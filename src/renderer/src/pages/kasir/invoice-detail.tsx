import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { Button, Divider, Spin, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useReactToPrint } from 'react-to-print'

const { Title, Text } = Typography

interface InvoiceLineItem {
    category: 'tindakan' | 'bhp' | 'service_request' | 'obat'
    description: string
    qty: number
    unitPrice: number
    subtotal: number
    no?: number
}

const lineItemColumns: ColumnsType<InvoiceLineItem> = [
    { title: 'No.', dataIndex: 'no', key: 'no', width: 50 },
    { title: 'Deskripsi', dataIndex: 'description', key: 'description' },
    {
        title: 'Qty',
        dataIndex: 'qty',
        key: 'qty',
        width: 70,
        align: 'right'
    },
    {
        title: 'Harga Satuan',
        dataIndex: 'unitPrice',
        key: 'unitPrice',
        width: 140,
        align: 'right',
        render: (v: number) => formatRupiah(v)
    },
    {
        title: 'Subtotal',
        dataIndex: 'subtotal',
        key: 'subtotal',
        width: 140,
        align: 'right',
        render: (v: number) => formatRupiah(v)
    }
]

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
        value
    )
}

function numbered(items: InvoiceLineItem[]): InvoiceLineItem[] {
    return items.map((item, idx) => ({ ...item, no: idx + 1 }))
}

function MedicationItems({ items }: { items: InvoiceLineItem[] }) {
    if (items.length === 0) return null
    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
                <Title level={5} className="!mb-0">
                    Medication Items
                </Title>
                <Tag color="purple">{items.length} item</Tag>
            </div>
            <Table
                size="small"
                bordered
                pagination={false}
                columns={lineItemColumns}
                dataSource={numbered(items)}
                rowKey="no"
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4} align="right">
                            <Text strong>Subtotal Obat</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                            <Text strong>
                                {formatRupiah(items.reduce((s, i) => s + i.subtotal, 0))}
                            </Text>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />
        </div>
    )
}

export default function InvoiceDetailPage() {
    const { encounterId } = useParams<{ encounterId: string }>()
    const [searchParams] = useSearchParams()
    const patientId = searchParams.get('patientId') ?? ''
    const navigate = useNavigate()
    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Invoice_${encounterId}`
    })

    const { data, isLoading, isError, error } = client.kasir.getInvoice.useQuery(
        { encounterId: encounterId!, patientId }
    )

    const invoice = (data as any)?.result

    if (!encounterId || !patientId) {
        return (
            <div className="p-4 text-red-500">
                Parameter tidak lengkap. encounterId dan patientId diperlukan.
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="flex items-center gap-2 mb-4 no-print">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                    Kembali
                </Button>
                <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    onClick={() => handlePrint()}
                    disabled={!invoice}
                >
                    Cetak Invoice
                </Button>
            </div>

            {isLoading && (
                <div className="flex justify-center py-16">
                    <Spin size="large" />
                </div>
            )}

            {isError && (
                <div className="text-red-500 py-4">
                    Gagal memuat invoice: {(error as Error)?.message ?? 'Error tidak diketahui'}
                </div>
            )}

            {invoice && (
                <div ref={printRef} className="bg-white p-6 max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <Title level={3} className="!mb-0">
                            INVOICE LAYANAN KESEHATAN
                        </Title>
                        <Text type="secondary" className="text-sm">
                            Rumah Sakit · SIMRS
                        </Text>
                    </div>

                    <Divider />

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div>
                            <div className="text-gray-500">No. Kunjungan</div>
                            <div className="font-medium">{invoice.encounterId}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">ID Pasien</div>
                            <div className="font-medium">{invoice.patientId}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Tanggal Cetak</div>
                            <div className="font-medium">
                                {new Date().toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Tindakan */}
                    {invoice.tindakanItems.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Title level={5} className="!mb-0">
                                    Tindakan Medis
                                </Title>
                                <Tag color="blue">{invoice.tindakanItems.length} item</Tag>
                            </div>
                            <Table
                                size="small"
                                bordered
                                pagination={false}
                                columns={lineItemColumns}
                                dataSource={numbered(invoice.tindakanItems)}
                                rowKey="no"
                                summary={() => (
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={4} align="right">
                                            <Text strong>Subtotal Tindakan</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right">
                                            <Text strong>
                                                {formatRupiah(
                                                    invoice.tindakanItems.reduce(
                                                        (s: number, i: InvoiceLineItem) =>
                                                            s + i.subtotal,
                                                        0
                                                    )
                                                )}
                                            </Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                )}
                            />
                        </div>
                    )}

                    {/* BHP */}
                    {invoice.bhpItems.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Title level={5} className="!mb-0">
                                    Bahan Habis Pakai (BHP)
                                </Title>
                                <Tag color="orange">{invoice.bhpItems.length} item</Tag>
                            </div>
                            <Table
                                size="small"
                                bordered
                                pagination={false}
                                columns={lineItemColumns}
                                dataSource={numbered(invoice.bhpItems)}
                                rowKey="no"
                                summary={() => (
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={4} align="right">
                                            <Text strong>Subtotal BHP</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right">
                                            <Text strong>
                                                {formatRupiah(
                                                    invoice.bhpItems.reduce(
                                                        (s: number, i: InvoiceLineItem) =>
                                                            s + i.subtotal,
                                                        0
                                                    )
                                                )}
                                            </Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                )}
                            />
                        </div>
                    )}

                    {/* Service Requests */}
                    {invoice.serviceRequestItems.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Title level={5} className="!mb-0">
                                    Pemeriksaan Lab & Radiologi
                                </Title>
                                <Tag color="green">{invoice.serviceRequestItems.length} item</Tag>
                            </div>
                            <Table
                                size="small"
                                bordered
                                pagination={false}
                                columns={lineItemColumns}
                                dataSource={numbered(invoice.serviceRequestItems)}
                                rowKey="no"
                                summary={() => (
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={4} align="right">
                                            <Text strong>Subtotal Lab/Radiologi</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right">
                                            <Text strong>
                                                {formatRupiah(
                                                    invoice.serviceRequestItems.reduce(
                                                        (s: number, i: InvoiceLineItem) =>
                                                            s + i.subtotal,
                                                        0
                                                    )
                                                )}
                                            </Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                )}
                            />
                        </div>
                    )}

                    {/* Medication Items */}
                    <MedicationItems items={invoice.obatItems ?? []} />

                    {/* Empty state */}
                    {invoice.tindakanItems.length === 0 &&
                        invoice.bhpItems.length === 0 &&
                        invoice.serviceRequestItems.length === 0 &&
                        (invoice.obatItems?.length ?? 0) === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                Tidak ada item tagihan untuk kunjungan ini.
                            </div>
                        )}

                    <Divider />

                    {/* Grand Total */}
                    <div className="flex justify-end">
                        <div className="text-right">
                            <div className="text-gray-500 text-sm mb-1">Total Tagihan</div>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatRupiah(invoice.total)}
                            </div>
                        </div>
                    </div>

                    {/* Signature area (print only) */}
                    <div className="mt-12 grid grid-cols-2 gap-8 text-center text-sm print-only">
                        <div>
                            <div>Petugas Kasir</div>
                            <div className="mt-16 border-t border-gray-400 pt-1">(_____________)</div>
                        </div>
                        <div>
                            <div>Pasien / Keluarga</div>
                            <div className="mt-16 border-t border-gray-400 pt-1">(_____________)</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
