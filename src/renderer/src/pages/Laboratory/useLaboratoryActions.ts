import { client, rpc } from '@renderer/utils/client'
import { queryClient } from '@renderer/query-client'
import { message } from 'antd'
import { useEffect, useState } from 'react'
import { Interpretation } from 'simrs-types'

interface LabRecordResultInput {
  serviceRequestId: string
  encounterId: string
  patientId: string
  observations: Array<{
    observationCodeId: string
    value: string
    unit?: string
    referenceRange?: string
    interpretation?: Interpretation
    observedAt?: string
  }>
}

interface RadiologyRecordResultInput {
  serviceRequestId: string
  encounterId: string
  patientId: string
  modalityCode: string
  findings: string
  started?: string
}

type RecordResultInput = LabRecordResultInput | RadiologyRecordResultInput

async function invalidateLaboratoryQueries() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['laboratory-management-requests-v2'] }),
    queryClient.invalidateQueries({ queryKey: ['laboratory-report'] }),
    queryClient.invalidateQueries({
      predicate: ({ queryKey }) => {
        return queryKey.some(
          (part) =>
            typeof part === 'string' &&
            (part.includes('laboratoryManagement') ||
              part.includes('laboratory-management') ||
              part === 'searchPacsStudies')
        )
      }
    })
  ])
}

async function ensureEncounterInProgress(encounterId?: string) {
  if (!encounterId) return

  const encounterResult = await rpc.query.entity({
    model: 'encounter',
    path: String(encounterId),
    method: 'get'
  })

  if (!encounterResult?.success) {
    console.warn(
      '[useLaboratoryActions] gagal membaca encounter saat sinkronisasi status:',
      encounterResult?.message
    )
    return
  }

  const encounterStatus = String(encounterResult?.result?.status || '').toUpperCase()

  if (encounterStatus !== 'PLANNED') {
    return
  }

  const updateResult = await rpc.query.entity({
    model: 'encounter',
    path: String(encounterId),
    method: 'put',
    body: {
      status: 'IN_PROGRESS'
    }
  })

  if (!updateResult?.success) {
    console.warn(
      '[useLaboratoryActions] gagal mengubah status encounter ke IN_PROGRESS:',
      updateResult?.message
    )
  }
}

interface UseLaboratoryActionsReturn {
  loading: string | null
  handleCreateOrder: (data: any) => Promise<void>
  handleCollectSpecimen: (data: any) => Promise<void>
  handleRecordResult: (data: RecordResultInput) => Promise<void>
  handlePrintReport: (encounterId: string) => Promise<void>
}

export function useLaboratoryActions(onSuccess?: () => void): UseLaboratoryActionsReturn {
  const [loading, setLoading] = useState<string | null>(null)
  const [printEncounterId, setPrintEncounterId] = useState<string | null>(null)

  const createOrderMutation = client.laboratoryManagement.createOrder.useMutation()
  const collectSpecimenMutation = client.laboratoryManagement.collectSpecimen.useMutation()
  const recordResultMutation = client.laboratoryManagement.recordResult.useMutation()
  const recordRadiologyResultMutation =
    client.laboratoryManagement.recordRadiologyResult.useMutation()

  const {
    data: reportDataResponse,
    isFetching: isPrinting,
    isError: isPrintError,
    error: printError
  } = client.laboratoryManagement.getReport.useQuery(
    { encounterId: printEncounterId! },
    {
      enabled: !!printEncounterId,
      queryKey: ['laboratory-report', { encounterId: printEncounterId ?? '' }]
    }
  )

  const escapeHtml = (value: unknown): string =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

  const formatPrintableDate = (value?: string | Date | null): string => {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '-'
    return parsed.toLocaleString('id-ID')
  }

  const resolvePatientName = async (patientId?: string): Promise<string> => {
    if (!patientId) return 'Pasien tidak ditemukan'

    try {
      const patientResult = await rpc.query.entity({
        model: 'patient',
        path: String(patientId),
        method: 'get'
      })

      const patient = patientResult?.result || patientResult?.data
      return String(patient?.name || patient?.fullName || 'Pasien tidak ditemukan')
    } catch {
      return 'Pasien tidak ditemukan'
    }
  }

  const resolveServiceRequestMeta = async (encounterId: string) => {
    const metadata = new Map<
      string,
      {
        testName: string
        loinc: string
        requestedAt?: string
      }
    >()

    const serviceRequestApi = window.api?.query?.serviceRequest?.getByEncounter
    if (!serviceRequestApi) return metadata

    try {
      const serviceRequestResult = await serviceRequestApi({ encounterId })
      const serviceRequests = Array.isArray(serviceRequestResult?.result) ? serviceRequestResult.result : []

      for (const request of serviceRequests) {
        const requestId = String(request?.id || '')
        if (!requestId) continue

        const coded = Array.isArray(request?.codes) ? request.codes[0] : undefined
        const fallbackTest = request?.test || request?.serviceCode
        const testName = String(
          coded?.display || fallbackTest?.display || request?.testDisplay || fallbackTest?.name || 'Pemeriksaan'
        )
        const loinc = String(coded?.code || fallbackTest?.code || '-')
        const requestedAt = request?.authoredOn || request?.autheredOn || request?.occurrenceDateTime || request?.createdAt

        metadata.set(requestId, { testName, loinc, requestedAt })
      }
    } catch {
      // ignore metadata fetch failure; print still proceeds with fallback labels
    }

    return metadata
  }

  // Effect to handle printing when data is fetched
  useEffect(() => {
    if (!printEncounterId) return

    if (!isPrinting && isPrintError) {
      message.error(printError?.message || 'Failed to fetch report')
      setPrintEncounterId(null)
      setLoading(null)
      return
    }

    if (isPrinting || !reportDataResponse?.result) return

    const generatePrintView = async () => {
      try {
        const reportData = reportDataResponse.result as any
        const patientName = reportData?.patient?.name || (await resolvePatientName(reportData?.patientId))
        const serviceRequestMeta = await resolveServiceRequestMeta(String(printEncounterId))
        const serviceRequests = Array.isArray(reportData?.serviceRequests) ? reportData.serviceRequests : []

        const reportDateCandidates: Array<string | Date> = []
        if (reportData?.queueTicket?.date) {
          reportDateCandidates.push(reportData.queueTicket.date)
        }

        const testSections = serviceRequests
          .map((req: any, index: number) => {
            const reqMeta = serviceRequestMeta.get(String(req?.id || ''))
            const testName = req?.testDisplay || reqMeta?.testName || `Pemeriksaan ${index + 1}`
            const loincCode = req?.testLoinc || reqMeta?.loinc || '-'
            if (req?.requestedAt) reportDateCandidates.push(req.requestedAt)
            if (reqMeta?.requestedAt) reportDateCandidates.push(reqMeta.requestedAt)

            const observations = Array.isArray(req?.observations) ? req.observations : []
            const rows =
              observations.length > 0
                ? observations
                    .map((obs: any, obsIndex: number) => {
                      if (obs?.observedAt) reportDateCandidates.push(obs.observedAt)
                      if (obs?.finalizedAt) reportDateCandidates.push(obs.finalizedAt)

                          return `
                        <tr>
                          <td>${escapeHtml(obs?.observationDisplay || obs?.display || `Parameter ${obsIndex + 1}`)}</td>
                          <td>${escapeHtml(obs?.value || '-')}</td>
                          <td>${escapeHtml(obs?.unit || '-')}</td>
                          <td>${escapeHtml(obs?.referenceRange || '-')}</td>
                          <td>${escapeHtml(obs?.interpretation || '-')}</td>
                        </tr>
                      `
                    })
                    .join('')
                : `
                    <tr>
                      <td colspan="5" style="text-align:center;color:#6b7280;">Belum ada hasil observasi</td>
                    </tr>
                  `

            return `
              <section class="test-section">
                <h3>${escapeHtml(testName)}</h3>
                <p class="meta"><strong>Kode LOINC:</strong> ${escapeHtml(loincCode)}</p>
                <table>
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Hasil</th>
                      <th>Unit</th>
                      <th>Nilai Rujukan</th>
                      <th>Interpretasi</th>
                    </tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
              </section>
            `
          })
          .join('')

        const validDateCandidates = reportDateCandidates
          .map((item) => new Date(item))
          .filter((item) => !Number.isNaN(item.getTime()))
          .sort((a, b) => b.getTime() - a.getTime())
        const reportDate = formatPrintableDate(validDateCandidates[0] || new Date())

        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.left = '-9999px'
        iframe.style.top = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = 'none'
        document.body.appendChild(iframe)

        const contentWindow = iframe.contentWindow
        const doc = contentWindow?.document

        if (doc && contentWindow) {
          doc.open()
          doc.write(`
            <html>
              <head>
                <title>Laporan Laboratorium</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
                  h1 { margin: 0 0 16px; font-size: 32px; }
                  h3 { margin: 0 0 8px; font-size: 18px; }
                  p { margin: 4px 0; }
                  .header { margin-bottom: 20px; }
                  .meta { color: #374151; margin-bottom: 12px; }
                  .test-section { margin-top: 20px; page-break-inside: avoid; }
                  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                  th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 13px; }
                  th { background-color: #f3f4f6; }
                  @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>Laboratory Report</h1>
                  <p><strong>Pasien:</strong> ${escapeHtml(patientName)}</p>
                  <p><strong>Tanggal Laporan:</strong> ${escapeHtml(reportDate)}</p>
                </div>
                ${testSections || '<p>Tidak ada data pemeriksaan.</p>'}
              </body>
            </html>
          `)
          doc.close()

          setTimeout(() => {
            contentWindow.focus()
            contentWindow.print()
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe)
              }
            }, 1000)
          }, 500)
        }
      } catch (e) {
        console.error(e)
        message.error('Failed to generate print view')
      } finally {
        setPrintEncounterId(null)
        setLoading(null)
      }
    }

    void generatePrintView()
  }, [printEncounterId, isPrinting, reportDataResponse, isPrintError, printError])

  const handleCreateOrder = async (data: any) => {
    setLoading('create-order')
    try {
      await createOrderMutation.mutateAsync(data)
      await invalidateLaboratoryQueries()
      message.success('Lab order created')
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      message.error(error.message || 'Failed to create order')
    } finally {
      setLoading(null)
    }
  }

  const handleCollectSpecimen = async (data: any) => {
    setLoading('collect-specimen')
    try {
      await collectSpecimenMutation.mutateAsync(data)
      await invalidateLaboratoryQueries()
      message.success('Specimen collected')
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      message.error(error.message || 'Failed to collect specimen')
    } finally {
      setLoading(null)
    }
  }

  const handleRecordResult = async (data: RecordResultInput) => {
    setLoading('record-result')
    try {
      if ('observations' in data) {
        await recordResultMutation.mutateAsync(data)
      } else {
        await recordRadiologyResultMutation.mutateAsync(data)
      }

      await ensureEncounterInProgress(data.encounterId)
      await invalidateLaboratoryQueries()
      message.success('Hasil pemeriksaan berhasil disimpan')
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      message.error(error.message || 'Failed to record result')
    } finally {
      setLoading(null)
    }
  }

  const handlePrintReport = async (encounterId: string) => {
    setLoading('print-report')
    setPrintEncounterId(encounterId)
    // The useEffect will handle the rest
  }

  return {
    loading,
    handleCreateOrder,
    handleCollectSpecimen,
    handleRecordResult,
    handlePrintReport
  }
}
