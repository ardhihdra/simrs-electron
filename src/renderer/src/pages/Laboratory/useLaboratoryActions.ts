import logoUrl from '@renderer/assets/logo.png'
import { queryClient } from '@renderer/query-client'
import { client, rpc } from '@renderer/utils/client'
import { message } from 'antd'
import { useEffect, useState } from 'react'
import { Interpretation } from 'simrs-types'
import { AncillaryCategory, getAncillarySectionConfigByCategory } from '../laboratory-management/section-config'

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
interface PrintReportOptions {
  category?: AncillaryCategory
}

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
  handlePrintReport: (encounterId: string, options?: PrintReportOptions) => Promise<void>
}

export function useLaboratoryActions(onSuccess?: () => void): UseLaboratoryActionsReturn {
  const [loading, setLoading] = useState<string | null>(null)
  const [printContext, setPrintContext] = useState<{
    encounterId: string
    category: AncillaryCategory
  } | null>(null)

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
    { encounterId: printContext?.encounterId || '' },
    {
      enabled: !!printContext?.encounterId,
      queryKey: ['laboratory-report', { encounterId: printContext?.encounterId ?? '' }]
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

  const formatGenderLabel = (value?: string): string => {
    const normalized = String(value || '').toLowerCase()
    if (!normalized) return '-'
    if (normalized === 'female' || normalized === 'perempuan' || normalized === 'p')
      return 'Perempuan'
    if (normalized === 'male' || normalized === 'laki-laki' || normalized === 'l')
      return 'Laki-laki'
    return value || '-'
  }

  const calculateAgeLabel = (birthDateValue?: string, ageValue?: number): string => {
    if (typeof ageValue === 'number' && Number.isFinite(ageValue) && ageValue >= 0) {
      return `${ageValue} th`
    }
    if (!birthDateValue) return '-'

    const birthDate = new Date(birthDateValue)
    if (Number.isNaN(birthDate.getTime())) return '-'

    const now = new Date()
    let age = now.getFullYear() - birthDate.getFullYear()
    const monthDiff = now.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) age -= 1
    return age >= 0 ? `${age} th` : '-'
  }

  const formatDateOnly = (value?: string): string => {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '-'
    return parsed.toLocaleDateString('id-ID')
  }

  const resolvePatientProfile = async (
    patientId?: string
  ): Promise<{
    name: string
    medicalRecordNumber?: string
    birthDate?: string
    gender?: string
    address?: string
  }> => {
    if (!patientId) return { name: 'Pasien tidak ditemukan' }

    try {
      const patientResult = await rpc.query.entity({
        model: 'patient',
        path: String(patientId),
        method: 'get'
      })

      const patient = patientResult?.result || patientResult?.data
      return {
        name: String(patient?.name || patient?.fullName || 'Pasien tidak ditemukan'),
        medicalRecordNumber: patient?.medicalRecordNumber || patient?.mrn,
        birthDate: patient?.birthDate,
        gender: patient?.gender,
        address:
          typeof patient?.address === 'string'
            ? patient.address
            : [
                patient?.address,
                patient?.village,
                patient?.district,
                patient?.city,
                patient?.province
              ]
                .filter((item) => typeof item === 'string' && item.trim().length > 0)
                .join(', ') || undefined
      }
    } catch {
      return { name: 'Pasien tidak ditemukan' }
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
      const serviceRequests = Array.isArray(serviceRequestResult?.result)
        ? serviceRequestResult.result
        : []

      for (const request of serviceRequests) {
        const requestId = String(request?.id || '')
        if (!requestId) continue

        const coded = Array.isArray(request?.codes) ? request.codes[0] : undefined
        const fallbackTest = request?.test || request?.serviceCode
        const testName = String(
          coded?.display ||
            fallbackTest?.display ||
            request?.testDisplay ||
            fallbackTest?.name ||
            'Pemeriksaan'
        )
        const loinc = String(coded?.code || fallbackTest?.code || '-')
        const requestedAt =
          request?.authoredOn ||
          request?.autheredOn ||
          request?.occurrenceDateTime ||
          request?.createdAt

        metadata.set(requestId, { testName, loinc, requestedAt })
      }
    } catch {
      // ignore metadata fetch failure; print still proceeds with fallback labels
    }

    return metadata
  }

  // Effect to handle printing when data is fetched
  useEffect(() => {
    if (!printContext) return

    if (!isPrinting && isPrintError) {
      message.error(printError?.message || 'Failed to fetch report')
      setPrintContext(null)
      setLoading(null)
      return
    }

    if (isPrinting || !reportDataResponse?.result) return

    const generatePrintView = async () => {
      try {
        const reportData = reportDataResponse.result as any
        const printCategory = printContext.category
        const sectionConfig = getAncillarySectionConfigByCategory(printCategory)
        const reportPatient = reportData?.patient ?? {}
        const reportContext = reportData?.context ?? {}
        const patientProfile = await resolvePatientProfile(reportData?.patientId)
        const patientName = reportPatient?.name || patientProfile.name
        const medicalRecordNumber =
          reportPatient?.medicalRecordNumber || patientProfile.medicalRecordNumber || '-'
        const birthDateValue = reportPatient?.birthDate || patientProfile.birthDate
        const birthDate = formatDateOnly(birthDateValue)
        const gender = formatGenderLabel(reportPatient?.gender || patientProfile.gender)
        const address = reportPatient?.address || patientProfile.address || '-'
        const age = calculateAgeLabel(birthDateValue, reportPatient?.age)

        const serviceRequestMeta = await resolveServiceRequestMeta(String(printContext.encounterId))
        const serviceRequests = Array.isArray(reportData?.serviceRequests)
          ? reportData.serviceRequests
          : []
        const imagingStudies = Array.isArray(reportData?.imagingStudies) ? reportData.imagingStudies : []

        const reportDateCandidates: Array<string | Date> = []
        if (reportData?.queueTicket?.date) {
          reportDateCandidates.push(reportData.queueTicket.date)
        }

        const isRadiology = printCategory === 'RADIOLOGY'
        const reportRows = isRadiology
          ? imagingStudies
              .map((study: any, index: number) => {
                if (study?.started) reportDateCandidates.push(study.started)
                if (study?.diagnosticReport?.issued) reportDateCandidates.push(study.diagnosticReport.issued)

                const testName =
                  study?.diagnosticReport?.categoryDisplay ||
                  study?.modalityCode ||
                  `Pemeriksaan Radiologi ${index + 1}`
                const findings = study?.diagnosticReport?.conclusion || '-'
                const reportStatus = study?.diagnosticReport?.status || study?.reportStatus || '-'

                return `
                  <tr>
                    <td class="param-cell">${escapeHtml(testName)}</td>
                    <td>${escapeHtml(study?.modalityCode || '-')}</td>
                    <td>${escapeHtml(formatPrintableDate(study?.started))}</td>
                    <td>${escapeHtml(reportStatus)}</td>
                    <td>${escapeHtml(findings)}</td>
                  </tr>
                `
              })
              .join('')
          : serviceRequests
              .flatMap((req: any, index: number) => {
                const reqMeta = serviceRequestMeta.get(String(req?.id || ''))
                const testName = req?.testDisplay || reqMeta?.testName || `Pemeriksaan ${index + 1}`
                const loincCode = req?.testLoinc || reqMeta?.loinc || '-'
                if (req?.requestedAt) reportDateCandidates.push(req.requestedAt)
                if (reqMeta?.requestedAt) reportDateCandidates.push(reqMeta.requestedAt)

                const observations = Array.isArray(req?.observations) ? req.observations : []
                if (observations.length === 0) {
                  return [
                    `
                      <tr>
                        <td class="param-cell">
                          ${escapeHtml(testName)}
                          ${loincCode !== '-' ? `<div class="sub-loinc">LOINC: ${escapeHtml(loincCode)}</div>` : ''}
                        </td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                      </tr>
                    `
                  ]
                }

                return observations.map((obs: any) => {
                  if (obs?.observedAt) reportDateCandidates.push(obs.observedAt)
                  if (obs?.finalizedAt) reportDateCandidates.push(obs.finalizedAt)

                  const pemeriksaanName = obs?.observationDisplay || obs?.display || testName
                  const pemeriksaanLoinc = obs?.observationLoinc || loincCode

                  return `
                    <tr>
                      <td class="param-cell">
                        ${escapeHtml(pemeriksaanName)}
                        ${pemeriksaanLoinc && pemeriksaanLoinc !== '-' ? `<div class="sub-loinc">LOINC: ${escapeHtml(pemeriksaanLoinc)}</div>` : ''}
                      </td>
                      <td>${escapeHtml(obs?.value || '-')}</td>
                      <td>${escapeHtml(obs?.referenceRange || '-')}</td>
                      <td>${escapeHtml(obs?.unit || '-')}</td>
                      <td>${escapeHtml(obs?.interpretation || '-')}</td>
                    </tr>
                  `
                })
              })
              .join('')

        const validDateCandidates = reportDateCandidates
          .map((item) => new Date(item))
          .filter((item) => !Number.isNaN(item.getTime()))
          .sort((a, b) => b.getTime() - a.getTime())
        const reportDate = formatPrintableDate(
          reportContext?.tanggal || validDateCandidates[0] || new Date()
        )
        const doctorName = String(reportContext?.doctorName || '-')
        const petugasMedis = '(................................)'
        const penjamin = String(reportContext?.penjamin || 'Umum')
        const ruang = String(reportContext?.ruang || sectionConfig.menuLabel)
        const totalPemeriksaan = isRadiology ? imagingStudies.length : serviceRequests.length
        const totalParameter = isRadiology
          ? imagingStudies.length
          : serviceRequests.reduce((sum: number, req: any) => {
              const observations = Array.isArray(req?.observations) ? req.observations.length : 0
              return sum + Math.max(observations, 1)
            }, 0)
        const printedAt = formatPrintableDate(new Date())

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
                <title>${sectionConfig.reportsTitle}</title>
                <style>
                  @page { size: A4 portrait; margin: 12mm; }
                  body { font-family: "Arial", sans-serif; color: #111827; font-size: 12px; margin: 0; background: #fff; }
                  .sheet {
                    border: 1px solid #7a7a7a;
                    padding: 10px 12px;
                    background: repeating-linear-gradient(
                      to bottom,
                      #ffffff 0px,
                      #ffffff 20px,
                      #fff8f6 20px,
                      #fff8f6 40px
                    );
                  }
                  .head-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #6b7280;
                    padding-bottom: 6px;
                    margin-bottom: 6px;
                  }
                  .brand { display: flex; align-items: center; gap: 10px; }
                  .logo { width: 50px; height: auto; object-fit: contain; margin-right: 10px; }
                  .brand-text { line-height: 1.2; }
                  .brand-title { font-size: 15px; font-weight: 700; text-transform: uppercase; }
                  .brand-sub { font-size: 11px; color: #374151; }
                  .meta-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 8px; }
                  .meta-grid { width: 100%; border-collapse: collapse; }
                  .meta-grid td { padding: 1px 3px; vertical-align: top; font-size: 12px; }
                  .meta-label { width: 110px; font-weight: 700; }
                  .report-banner {
                    background: #4b5563;
                    color: #fff;
                    text-align: center;
                    font-size: 14px;
                    font-weight: 700;
                    padding: 5px;
                    margin: 8px 0 0;
                    text-transform: uppercase;
                  }
                  table.report-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                  .report-table th, .report-table td { border: 1px solid #b6b6b6; padding: 4px 6px; font-size: 12px; }
                  .report-table th { background: #6b7280; color: #fff; text-transform: uppercase; font-weight: 700; }
                  .center { text-align: center; }
                  .right { text-align: right; }
                  .param-cell { padding-left: 8px; }
                  .sub-loinc { font-size: 10px; color: #6b7280; margin-top: 2px; }
                  .summary { margin-top: 8px; width: 100%; border-collapse: collapse; }
                  .summary td { padding: 3px 6px; font-size: 12px; }
                  .summary .label { width: 180px; font-weight: 700; text-transform: uppercase; }
                  .notes { margin-top: 10px; min-height: 28px; border-top: 1px solid #9ca3af; padding-top: 4px; font-size: 11px; }
                  .signatures { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
                  .sign-item { text-align: center; }
                  .sign-title { font-size: 12px; }
                  .sign-space { height: 52px; }
                  .sign-name { border-top: 1px solid #374151; padding-top: 2px; font-weight: 700; text-transform: uppercase; }
                  .footnote { margin-top: 14px; border-top: 1px solid #6b7280; padding-top: 6px; font-size: 11px; }
                  .printed { margin-top: 6px; font-size: 11px; }
                  @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
                  }
                </style>
              </head>
              <body>
                <div class="sheet">
                  <div class="head-top">
                    <div class="brand">
                      <img class="logo" src="${logoUrl}" alt="Logo Klinik" />
                      <div class="brand-text">
                        <div class="brand-title">SIMRS Rahayu Medical Center</div>
                        <div class="brand-sub">Jl. Otista, Tarogong Garut</div>
                        <div class="brand-sub">Telp. (0262) 2542608</div>
                      </div>
                    </div>
                  </div>
                  <div class="meta-wrap">
                    <table class="meta-grid">
                      <tr><td class="meta-label">Nama</td><td>: ${escapeHtml(patientName)}</td></tr>
                      <tr><td class="meta-label">Tgl. Lahir</td><td>: ${escapeHtml(birthDate)}</td></tr>
                      <tr><td class="meta-label">Umur</td><td>: ${escapeHtml(age)}</td></tr>
                      <tr><td class="meta-label">Jenis Kelamin</td><td>: ${escapeHtml(gender)}</td></tr>
                      <tr><td class="meta-label">Alamat</td><td>: ${escapeHtml(address)}</td></tr>
                    </table>
                    <table class="meta-grid">
                      <tr><td class="meta-label">No. RM</td><td>: ${escapeHtml(medicalRecordNumber)}</td></tr>
                      <tr><td class="meta-label">Dokter</td><td>: ${escapeHtml(doctorName)}</td></tr>
                      <tr><td class="meta-label">Tanggal</td><td>: ${escapeHtml(reportDate)}</td></tr>
                      <tr><td class="meta-label">Penjamin</td><td>: ${escapeHtml(penjamin)}</td></tr>
                      <tr><td class="meta-label">Ruang</td><td>: ${escapeHtml(ruang)}</td></tr>
                    </table>
                  </div>

                  <div class="report-banner">${escapeHtml(sectionConfig.printTitle)}</div>
                  <table class="report-table">
                    <thead>
                      ${
                        isRadiology
                          ? `
                            <tr>
                              <th>Nama Pemeriksaan</th>
                              <th style="width:90px;">Modality</th>
                              <th style="width:150px;">Tanggal</th>
                              <th style="width:110px;">Status</th>
                              <th style="width:220px;">Temuan</th>
                            </tr>
                          `
                          : `
                            <tr>
                              <th>Nama Pemeriksaan</th>
                              <th style="width:110px;">Hasil</th>
                              <th style="width:130px;">Nilai Rujukan</th>
                              <th style="width:110px;">Satuan</th>
                              <th style="width:130px;">Interpretasi</th>
                            </tr>
                          `
                      }
                    </thead>
                    <tbody>
                      ${
                        reportRows ||
                        `<tr><td colspan="5" class="center">${escapeHtml(sectionConfig.printEmptyMessage)}</td></tr>`
                      }
                    </tbody>
                  </table>

                  <table class="summary">
                    <tr>
                      <td></td>
                      <td class="label">Subtotal Pemeriksaan</td>
                      <td class="right">${escapeHtml(totalPemeriksaan)}</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td class="label">Total Parameter</td>
                      <td class="right">${escapeHtml(totalParameter)}</td>
                    </tr>
                  </table>

                  <div class="notes">
                    <strong>Catatan:</strong>
                  </div>

                  <div class="signatures">
                    <div class="sign-item">
                      <div class="sign-title">Penanggung Jawab</div>
                      <div class="sign-space"></div>
                      <div class="sign-name">${escapeHtml(doctorName)}</div>
                    </div>
                    <div class="sign-item">
                      <div class="sign-title">Petugas Medis</div>
                      <div class="sign-space"></div>
                      <div class="sign-name">${escapeHtml(petugasMedis)}</div>
                    </div>
                  </div>

                  <div class="footnote">
                    ${escapeHtml(sectionConfig.printFootnote)}
                  </div>
                  <div class="printed">
                    Printed: ${escapeHtml(printedAt)}
                  </div>
                </div>
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
        setPrintContext(null)
        setLoading(null)
      }
    }

    void generatePrintView()
  }, [printContext, isPrinting, reportDataResponse, isPrintError, printError])

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

  const handlePrintReport = async (encounterId: string, options?: PrintReportOptions) => {
    setLoading('print-report')
    setPrintContext({
      encounterId,
      category: options?.category || 'LABORATORY'
    })
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
