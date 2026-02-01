import { useState } from 'react'
import { Card, Table, Tag, Empty, Spin, Button, Descriptions, List, Space, message } from 'antd'
import { FilePdfOutlined, PrinterOutlined, ExperimentOutlined, MedicineBoxOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useDiagnosticReportByEncounter, useCreateDiagnosticReport } from '../../hooks/query/use-diagnostic-report'
import { useServiceRequestByEncounter } from '../../hooks/query/use-service-request'
import dayjs from 'dayjs'

interface DiagnosticResultViewerProps {
    encounterId: string
    patientId: string
}

export const DiagnosticResultViewer = ({ encounterId, patientId }: DiagnosticResultViewerProps) => {
    const [selectedReportId, setSelectedReportId] = useState<number | null>(null)

    const { data: reportsData, isLoading: isLoadingReports } = useDiagnosticReportByEncounter(encounterId)
    const { data: ordersData, isLoading: isLoadingOrders } = useServiceRequestByEncounter(encounterId)

    const createMutation = useCreateDiagnosticReport()

    const handleProcessOrder = async (order: any) => {
        try {
            const isLab = order.categories?.[0]?.code === 'laboratory'
            const code = order.codes?.[0]?.code
            const display = order.codes?.[0]?.display

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
                encounterId,
                patientId,
                serviceRequestId: order.id,
                category: isLab ? 'laboratory' : 'imaging',
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

    if (isLoadingReports || isLoadingOrders) {
        return (
            <div className="flex justify-center items-center py-8">
                <Spin size="large" tip="Memuat Hasil Penunjang..." />
            </div>
        )
    }

    const reports = reportsData?.result || []
    const selectedReport = reports.find((r: any) => r.id === selectedReportId) || reports[0]

    const pendingOrders = ordersData?.result?.filter((o: any) => o.status === 'active') || []

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

    return (
        <div className="flex flex-col h-full gap-4">
            {pendingOrders.length > 0 && (
                <Card
                    size="small"
                    title="Antrian Order (Simulasi input hasil dari Lab/Radiologi)"
                    className="bg-blue-50 border-blue-200"
                    styles={{ header: { backgroundColor: '#e6f7ff', borderBottom: '1px solid #91caff' } }}
                >
                    <List
                        grid={{ gutter: 16, column: 3 }}
                        dataSource={pendingOrders}
                        renderItem={(item: any) => (
                            <List.Item>
                                <Card size="small" hoverable>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-blue-700">{item.codes?.[0]?.display}</div>
                                            <div className="text-xs text-gray-500">{item.priority?.toUpperCase()}</div>
                                        </div>
                                        <Button
                                            size="small"
                                            type="primary"
                                            icon={<ThunderboltOutlined />}
                                            onClick={() => handleProcessOrder(item)}
                                            loading={createMutation.isPending}
                                        >
                                            Proses Hasil
                                        </Button>
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
                                <Descriptions.Item label="Dokter Pengirim">Dr. Dokter (Poli Umum)</Descriptions.Item>
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
