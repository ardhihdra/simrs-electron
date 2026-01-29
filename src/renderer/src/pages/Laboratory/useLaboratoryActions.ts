import { client } from '@renderer/utils/client'
import { message } from 'antd'
import { useEffect, useState } from 'react'
import type { RecordResultInput } from '../../../../main/rpc/procedure/laboratory'

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

  const createOrderMutation = client.laboratory.createOrder.useMutation()
  const collectSpecimenMutation = client.laboratory.collectSpecimen.useMutation()
  const recordResultMutation = client.laboratory.recordResult.useMutation()

  const {
    data: reportDataResponse,
    isFetching: isPrinting,
    isError: isPrintError,
    error: printError
  } = client.laboratory.getReport.useQuery(printEncounterId!, {
    enabled: !!printEncounterId,
    queryKey: ['laboratory-report', printEncounterId ?? '']
  })

  // Effect to handle printing when data is fetched
  useEffect(() => {
    if (!printEncounterId) return

    // accessing result directly as per new schema output
    if (!isPrinting && reportDataResponse?.result) {
      try {
        const reportData = reportDataResponse.result

        // Use iframe for printing in proper Electron way
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
                        <title>Lab Report - ${reportData.patient?.name}</title>
                        <style>
                            body { font-family: sans-serif; padding: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            .header { margin-bottom: 20px; }
                            @media print {
                                body { -webkit-print-color-adjust: exact; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h2>Laboratory Report</h2>
                            <p><strong>Patient:</strong> ${reportData.patient?.name} (ID: ${
                              reportData.patientId
                            })</p>
                            <p><strong>Date:</strong> ${new Date(reportData.startTime).toLocaleDateString()}</p>
                        </div>
                        
                        ${reportData.labServiceRequests
                          ?.map(
                            (req: any) => `
                            <h3>Order: ${req.testCode?.display || req.serviceCode?.display || req.serviceCodeId || 'Test'}</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Test</th>
                                        <th>Result</th>
                                        <th>Unit</th>
                                        <th>Ref Range</th>
                                        <th>Interpretation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${req.observations
                                      ?.map(
                                        (obs: any) => `
                                        <tr>
                                            <td>${obs.observationCodeId}</td>
                                            <td>${obs.value}</td>
                                            <td>${obs.unit}</td>
                                            <td>${obs.referenceRange || '-'}</td>
                                            <td>${obs.interpretation || '-'}</td>
                                        </tr>
                                    `
                                      )
                                      .join('')}
                                </tbody>
                            </table>
                        `
                          )
                          .join('')}
                    </body>
                </html>
             `)
          doc.close()

          // Wait for content to load/render slightly
          setTimeout(() => {
            contentWindow.focus()
            contentWindow.print()
            // Cleanup
            setTimeout(() => {
              document.body.removeChild(iframe)
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
    } else if (!isPrinting && isPrintError) {
      message.error(printError?.message || 'Failed to fetch report')
      setPrintEncounterId(null)
      setLoading(null)
    }
  }, [printEncounterId, isPrinting, reportDataResponse, isPrintError, printError])

  const handleCreateOrder = async (data: any) => {
    setLoading('create-order')
    try {
      await createOrderMutation.mutateAsync(data)
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
      await recordResultMutation.mutateAsync(data)
      message.success('Lab result recorded')
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
