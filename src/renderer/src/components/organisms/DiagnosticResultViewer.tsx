import { useMemo, useState } from 'react'
import { Card, Table, Tag, Empty, Spin, Button, Descriptions, List, Space, message } from 'antd'
import { FilePdfOutlined, PrinterOutlined, ExperimentOutlined, MedicineBoxOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useCreateDiagnosticReport } from '../../hooks/query/use-diagnostic-report'
import { useQueries, useQuery } from '@tanstack/react-query'
import { client, rpc } from '@renderer/utils/client'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'

interface DiagnosticResultViewerProps {
    encounterId: string
    patientId: string
}

interface EncounterListItem {
    id?: string
    partOfId?: string | null
}

interface ServiceRequestItem {
    id?: string | number
    encounterId?: string
    status?: string
    priority?: string
    categories?: Array<{ code?: string; display?: string }>
    codes?: Array<{ code?: string; display?: string }>
    patientInstruction?: string
    authoredOn?: string
    autheredOn?: string
    occurrenceDateTime?: string
    createdAt?: string
}

interface DiagnosticReportItem {
    id?: string | number
    encounterId?: string | null
    basedOn?: Array<{ reference?: string }> | null
    category?: Array<{ coding?: Array<{ code?: string; display?: string; system?: string }>; text?: string }> | null
    code?: { text?: string }
    effectiveDateTime?: string
    conclusion?: string
    observations?: any[]
}

interface LabReportByEncounter {
    encounterId?: string
    serviceRequests?: Array<{
        id?: string
        status?: string
        observations?: any[]
    }>
    imagingStudies?: Array<{
        reportStatus?: string
        diagnosticReport?: {
            id?: number
            status?: string
            conclusion?: string
        }
    }>
}

export const DiagnosticResultViewer = ({ encounterId, patientId }: DiagnosticResultViewerProps) => {
    const navigate = useNavigate()
    const [selectedReportId, setSelectedReportId] = useState<string | number | null>(null)

    const {
        data: encounterListData,
        isLoading: isLoadingEncounterList
    } = client.query.entity.useQuery(
        {
            model: 'encounter',
            method: 'get',
            params: {
                patientId,
                items: '200',
                sortBy: 'updatedAt',
                sortOrder: 'DESC'
            }
        },
        {
            enabled: !!patientId,
            queryKey: ['diagnostic-result-related-encounters', encounterId, patientId]
        } as any
    )

    const relatedEncounterIds = useMemo(() => {
        const encounters = (
            ((encounterListData as any)?.result ||
                (encounterListData as any)?.data ||
                encounterListData ||
                []) as EncounterListItem[]
        )

        const childIds = encounters
            .filter((encounter) => String(encounter.partOfId || '') === String(encounterId))
            .map((encounter) => String(encounter.id || ''))
            .filter(Boolean)

        return Array.from(new Set([String(encounterId), ...childIds]))
    }, [encounterId, encounterListData])

    const {
        data: relatedOrders = [],
        isLoading: isLoadingOrders
    } = useQuery({
        queryKey: ['diagnostic-result-related-service-requests', relatedEncounterIds],
        enabled: relatedEncounterIds.length > 0,
        queryFn: async () => {
            const fn = window.api?.query?.serviceRequest?.getByEncounter
            if (!fn) throw new Error('API serviceRequest tidak tersedia')

            const responses = await Promise.all(
                relatedEncounterIds.map(async (targetEncounterId) => {
                    const response = await fn({ encounterId: targetEncounterId })
                    const result = Array.isArray(response?.result) ? response.result : []
                    return result.map((item: any) => ({
                        ...item,
                        encounterId: String(item.encounterId || targetEncounterId)
                    })) as ServiceRequestItem[]
                })
            )

            return responses.flat()
        }
    })

    const {
        data: relatedReports = [],
        isLoading: isLoadingReports
    } = useQuery({
        queryKey: ['diagnostic-result-related-reports', relatedEncounterIds],
        enabled: relatedEncounterIds.length > 0,
        queryFn: async () => {
            const fn = window.api?.query?.diagnosticReport?.getByEncounter
            if (!fn) throw new Error('API diagnosticReport tidak tersedia')

            const responses = await Promise.all(
                relatedEncounterIds.map(async (targetEncounterId) => {
                    const response = await fn({ encounterId: targetEncounterId })
                    const result = Array.isArray(response?.result) ? response.result : []
                    return result.map((item: any) => ({
                        ...item,
                        encounterId: String(item.encounterId || targetEncounterId)
                    })) as DiagnosticReportItem[]
                })
            )

            return responses.flat()
        }
    })

    const relatedLabReportQueries = useQueries({
        queries: relatedEncounterIds.map((targetEncounterId) => ({
            queryKey: ['diagnostic-result-related-lab-report', targetEncounterId],
            enabled: !!targetEncounterId,
            queryFn: async () => {
                const response = await rpc.laboratoryManagement.getReport({
                    encounterId: String(targetEncounterId)
                })
                return {
                    encounterId: String(targetEncounterId),
                    payload: response
                }
            }
        }))
    })

    const createMutation = useCreateDiagnosticReport()

    const handleProcessOrder = async (order: any) => {
        try {
            const categoryCode = String(order.categories?.[0]?.code || '').toUpperCase()
            const isLab = categoryCode === 'LABORATORY' || categoryCode === 'LAB'
            const code = order.codes?.[0]?.code
            const display = order.codes?.[0]?.display
            const orderEncounterId = String(order.encounterId || encounterId)

            let results: any[] = []
            let conclusion = ''

            if (code === 'CBC') {
                results = [
                    { code: 'HB', display: 'Hemoglobin', value: 11.2, unit: 'g/dL', referenceRange: '13.0 - 17.0' },
                    { code: 'LEU', display: 'Leukosit', value: 8500, unit: '/uL', referenceRange: '4000 - 10000' },
                    { code: 'TR', display: 'Trombosit', value: 250000, unit: '/uL', referenceRange: '150000 - 450000' },
                    { code: 'HT', display: 'Hematokrit', value: 34, unit: '%', referenceRange: '40 - 52' }
                ]
                conclusion = 'Anemia ringan, trombosit normal.'
            } else if (code === 'FBG') {
                results = [
                    { code: 'GLU-F', display: 'Glukosa Puasa', value: 140, unit: 'mg/dL', referenceRange: '70 - 100' }
                ]
                conclusion = 'Hiperglikemia puasa.'
            } else if (code === 'CHEST-XRAY') {
                conclusion = 'Cor: ukuran normal. Pulmo: tak tampak infiltrat. Kesan: Thorax dalam batas normal.'
            } else {
                results = [
                    { code: 'RESULT', display: `Hasil ${display}`, value: 10, unit: 'units', referenceRange: '0 - 20' }
                ]
                conclusion = 'Dalam batas normal.'
            }

            await createMutation.mutateAsync({
                encounterId: orderEncounterId,
                patientId,
                serviceRequestId: order.id,
                category: isLab ? 'laboratory' : 'radiology',
                code: code || 'UNKNOWN',
                display: display || 'Unknown Test',
                conclusion: conclusion,
                results: results
            })

            message.success('Hasil simulasi berhasil dibuat')
        } catch (error) {
            console.error(error)
            message.error('Gagal membuat data simulasi')
        }
    }

    const isLoadingLabReports = relatedLabReportQueries.some((query) => query.isLoading)

    const reports = relatedReports as DiagnosticReportItem[]
    const orders = relatedOrders as ServiceRequestItem[]
    const selectedReport =
        reports.find((r: DiagnosticReportItem) => String(r.id) === String(selectedReportId)) || reports[0]

    const reportByServiceRequestId = useMemo(() => {
        const map = new Map<string, DiagnosticReportItem>()
        for (const report of reports) {
            const serviceRequestId = String(report.basedOn?.[0]?.reference || '').split('/')[1]
            if (serviceRequestId) {
                map.set(serviceRequestId, report)
            }
        }
        return map
    }, [reports])

    const labReportByEncounterId = useMemo(() => {
        const map = new Map<string, LabReportByEncounter>()
        for (const query of relatedLabReportQueries) {
            const encounter = String((query.data as any)?.encounterId || '')
            const payload = (query.data as any)?.payload
            const result = (payload?.result || payload) as LabReportByEncounter | undefined
            if (encounter && result) {
                map.set(encounter, result)
            }
        }
        return map
    }, [relatedLabReportQueries])

    const hasResultByServiceRequestId = useMemo(() => {
        const map = new Map<string, boolean>()
        for (const report of labReportByEncounterId.values()) {
            const serviceRequests = Array.isArray(report.serviceRequests) ? report.serviceRequests : []
            for (const serviceRequest of serviceRequests) {
                const serviceRequestId = String(serviceRequest.id || '')
                if (!serviceRequestId) continue

                const status = String(serviceRequest.status || '').toUpperCase()
                const observations = Array.isArray(serviceRequest.observations)
                    ? serviceRequest.observations
                    : []
                const hasResult = observations.length > 0 || status === 'COMPLETED' || status === 'FINAL'
                if (hasResult) {
                    map.set(serviceRequestId, true)
                }
            }
        }
        return map
    }, [labReportByEncounterId])

    const encounterHasImagingResult = useMemo(() => {
        const map = new Map<string, boolean>()
        for (const [encounterKey, report] of labReportByEncounterId.entries()) {
            const imagingStudies = Array.isArray(report.imagingStudies) ? report.imagingStudies : []
            const hasImaging = imagingStudies.some((study) => {
                const reportStatus = String(study.reportStatus || '').toUpperCase()
                const diagnosticStatus = String(study.diagnosticReport?.status || '').toUpperCase()
                const hasDiagnosticConclusion = Boolean(study.diagnosticReport?.conclusion)
                return (
                    reportStatus === 'FINAL' ||
                    diagnosticStatus === 'FINAL' ||
                    diagnosticStatus === 'COMPLETED' ||
                    hasDiagnosticConclusion
                )
            })
            if (hasImaging) {
                map.set(encounterKey, true)
            }
        }
        return map
    }, [labReportByEncounterId])

    const orderById = useMemo(() => {
        const map = new Map<string, ServiceRequestItem>()
        for (const order of orders) {
            const id = String(order.id || '')
            if (id) map.set(id, order)
        }
        return map
    }, [orders])

    const sortedOrders = useMemo(() => {
        return [...orders].sort((a, b) => {
            const aTime = dayjs(a.autheredOn || a.authoredOn || a.occurrenceDateTime || a.createdAt).valueOf()
            const bTime = dayjs(b.autheredOn || b.authoredOn || b.occurrenceDateTime || b.createdAt).valueOf()
            return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
        })
    }, [orders])

    const pendingOrders = sortedOrders.filter((o: ServiceRequestItem) => {
        const status = String(o.status || '').toLowerCase()
        return status === 'active' || status === 'requested'
    })

    const hasResultForOrder = (order: ServiceRequestItem) => {
        const orderId = String(order.id || '')
        if (!orderId) return false
        if (reportByServiceRequestId.has(orderId)) return true
        if (hasResultByServiceRequestId.get(orderId)) return true

        const status = String(order.status || '').toUpperCase()
        if (status === 'COMPLETED' || status === 'FINAL') return true

        const categoryCode = String(order.categories?.[0]?.code || '').toUpperCase()
        const isRadiology = categoryCode === 'RADIOLOGY' || categoryCode === 'RAD'
        const orderEncounterId = String(order.encounterId || '')
        if (isRadiology && orderEncounterId && encounterHasImagingResult.get(orderEncounterId)) return true

        return false
    }

    const resultColumns = [
        {
            title: 'Pemeriksaan',
            dataIndex: ['code', 'text'],
            key: 'test',
            width: '30%',
        },
        {
            title: 'Hasil',
            key: 'result',
            render: (_: any, record: any) => (
                <span className={isAbnormal(record) ? 'text-red-600 font-bold' : ''}>
                    {record.valueQuantity?.value} {record.valueQuantity?.unit}
                </span>
            ),
            width: '20%',
        },
        {
            title: 'Nilai Rujukan',
            key: 'reference',
            render: (_: any, record: any) => record.referenceRange?.[0]?.text || '-',
            width: '30%',
        },
        {
            title: 'Interpretasi',
            key: 'interpretation',
            render: (_: any, record: any) => (
                isAbnormal(record) ? <Tag color="red">Abnormal</Tag> : <Tag color="green">Normal</Tag>
            ),
            width: '20%',
        }
    ]

    const isAbnormal = (record: any) => {
        const val = record.valueQuantity?.value
        if (record.code?.text === 'Hemoglobin' && val < 13) return true
        if (record.code?.text === 'Glukosa Puasa' && val > 100) return true
        return false
    }

    const selectedReportServiceRequestId = String(selectedReport?.basedOn?.[0]?.reference || '').split('/')[1]
    const selectedReportOrder = selectedReportServiceRequestId
        ? orderById.get(selectedReportServiceRequestId)
        : undefined

    if (isLoadingReports || isLoadingOrders || isLoadingEncounterList || isLoadingLabReports) {
        return (
            <div className="flex justify-center items-center py-8">
                <Spin size="large" tip="Memuat Hasil Penunjang..." />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full gap-4">
            {sortedOrders.length > 0 && (
                <Card
                    size="small"
                    title="Service Request Terkait dan Hasil"
                    className="bg-blue-50 border-blue-200"
                    styles={{ header: { backgroundColor: '#e6f7ff', borderBottom: '1px solid #91caff' } }}
                >
                    <List
                        grid={{ gutter: 16, column: 3 }}
                        dataSource={sortedOrders}
                        renderItem={(item: any) => (
                            <List.Item>
                                <Card size="small" hoverable>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-blue-700">{item.codes?.[0]?.display}</div>
                                            <div className="text-xs text-gray-500">{item.priority?.toUpperCase()}</div>
                                            <div className="text-[11px] text-gray-500">
                                                Encounter: {item.encounterId || '-'}
                                            </div>
                                            {hasResultForOrder(item) ? (
                                                <Tag color="green" className="mt-2 mb-0 mr-0">
                                                    Hasil tersedia
                                                </Tag>
                                            ) : (
                                                <Tag color="default" className="mt-2 mb-0 mr-0">
                                                    Belum ada hasil
                                                </Tag>
                                            )}
                                        </div>
                                        <Space direction="vertical" size={6}>
                                            {reportByServiceRequestId.has(String(item.id || '')) ? (
                                                <Button
                                                    size="small"
                                                    onClick={() =>
                                                        setSelectedReportId(
                                                            reportByServiceRequestId.get(String(item.id || ''))?.id || null
                                                        )
                                                    }
                                                >
                                                    Lihat Hasil
                                                </Button>
                                            ) : hasResultForOrder(item) ? (
                                                <Button
                                                    size="small"
                                                    onClick={() =>
                                                        navigate(`/dashboard/laboratory/report/${item.encounterId}`)
                                                    }
                                                >
                                                    Lihat Ringkasan
                                                </Button>
                                            ) : (
                                                pendingOrders.some((order) => String(order.id || '') === String(item.id || '')) && (
                                                    <Button
                                                        size="small"
                                                        type="primary"
                                                        icon={<ThunderboltOutlined />}
                                                        onClick={() => handleProcessOrder(item)}
                                                        loading={createMutation.isPending}
                                                    >
                                                        Proses Hasil
                                                    </Button>
                                                )
                                            )}
                                        </Space>
                                    </div>
                                </Card>
                            </List.Item>
                        )}
                    />
                </Card>
            )}

            <div className="flex flex-col md:flex-row h-full gap-4 flex-1 overflow-hidden">
                <div className="w-full md:w-1/4 h-full">
                    <Card title="Daftar Hasil Selesai" className="h-full flex flex-col" size="small" bodyStyle={{ flex: 1, overflow: 'auto' }}>
                        {reports.length === 0 ? (
                            <Empty description="Belum ada hasil selesai" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                            <List
                                dataSource={reports}
                                renderItem={(item: any) => {
                                    const category = item.category?.[0]?.coding?.[0]?.display || 'Lab'
                                    const isSelected = selectedReport?.id === item.id || (!selectedReportId && item.id === reports[0]?.id)

                                    return (
                                        <List.Item
                                            className={`cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                            onClick={() => setSelectedReportId(item.id)}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    category === 'Radiology'
                                                        ? <MedicineBoxOutlined className="text-xl text-purple-600" />
                                                        : <ExperimentOutlined className="text-xl text-blue-600" />
                                                }
                                                title={<span className="font-medium text-sm">{item.code?.text}</span>}
                                                description={
                                                    <div className="text-xs text-gray-500">
                                                        <div>{dayjs(item.effectiveDateTime).format('DD MMM HH:mm')}</div>
                                                        <Tag color="green" className="mt-1 mr-0 text-[10px]">FINAL</Tag>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )
                                }}
                            />
                        )}
                    </Card>
                </div>

                <div className="w-full md:w-3/4 h-full">
                    {selectedReport ? (
                        <Card
                            title={
                                <div className="flex justify-between items-center">
                                    <span>{selectedReport.code?.text}</span>
                                    <Space>
                                        <Button icon={<PrinterOutlined />}>Print</Button>
                                        <Button icon={<FilePdfOutlined />}>PDF</Button>
                                    </Space>
                                </div>
                            }
                            className="h-full flex flex-col"
                            bodyStyle={{ flex: 1, overflow: 'auto' }}
                        >
                            <Descriptions column={2} size="small" bordered className="mb-6">
                                <Descriptions.Item label="No. Order">{selectedReport.basedOn?.[0]?.reference?.split('/')[1] || '-'}</Descriptions.Item>
                                <Descriptions.Item label="Tgl Periksa">{dayjs(selectedReport.effectiveDateTime).format('DD MMMM YYYY HH:mm')}</Descriptions.Item>
                                <Descriptions.Item label="Kategori">{selectedReport.category?.[0]?.coding?.[0]?.display}</Descriptions.Item>
                                <Descriptions.Item label="Pemeriksaan Terkait">
                                    {selectedReportOrder?.codes?.[0]?.display || '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Encounter Order">
                                    {selectedReportOrder?.encounterId || selectedReport.encounterId || '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Status Service Request">
                                    {String(selectedReportOrder?.status || '-').toUpperCase()}
                                </Descriptions.Item>
                            </Descriptions>

                            {selectedReport.category?.[0]?.coding?.[0]?.code === 'RAD' && (
                                <div className="mb-6 p-4 bg-gray-900 rounded-lg text-center">
                                    <div className="text-gray-400 mb-2">Citra Radiologi (DICOM View)</div>
                                    <div className="w-full h-64 border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500">
                                        [DICOM IMAGE PLACEHOLDER]
                                    </div>
                                </div>
                            )}

                            {selectedReport.observations && selectedReport.observations.length > 0 ? (
                                <>
                                    <h4 className="font-semibold mb-2">Hasil Pemeriksaan</h4>
                                    <Table
                                        dataSource={selectedReport.observations}
                                        columns={resultColumns}
                                        pagination={false}
                                        size="small"
                                        rowKey="id"
                                        className="mb-6"
                                    />
                                </>
                            ) : null}

                            {selectedReport.conclusion && (
                                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                    <h4 className="font-semibold text-gray-700 mb-2">Kesimpulan / Kesan:</h4>
                                    <p className="whitespace-pre-wrap text-gray-800">{selectedReport.conclusion}</p>
                                </div>
                            )}

                        </Card>
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <Empty description="Pilih hasil pemeriksaan untuk melihat detail" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
