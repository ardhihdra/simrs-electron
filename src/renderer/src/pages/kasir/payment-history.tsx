import { Table, Typography, Button, Dropdown } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { PrinterOutlined } from '@ant-design/icons'
import { printReceipt } from '@renderer/utils/print-service'
import type { Invoice, PersistedInvoice } from '@renderer/utils/print-service'

interface PaymentRecord {
    id: number
    kode: string
    date: string | Date
    amount: number
    paymentMethod: string
    bankName: string | null
    ref: string | null
    note: string | null
    attachmentPath: string | null
    paymentStatus: string
}



interface PaymentHistoryProps {
    payments: PaymentRecord[]
    totalPaid: number
    remaining: number
    invoice?: Invoice
    persistedInvoice?: PersistedInvoice | null
    cashierName?: string
}

const methodLabel: Record<string, string> = {
    CASH: 'Tunai',
    BANK_TRANSFER: 'Transfer Bank',
    OTHER: 'Lainnya',
}

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value)
}

export function PaymentHistory({ payments, totalPaid, remaining, invoice, persistedInvoice, cashierName }: PaymentHistoryProps) {
    if (payments.length === 0) return null

    const columns: ColumnsType<PaymentRecord> = [
        { title: 'Kode', dataIndex: 'kode', key: 'kode', width: 170 },
        {
            title: 'Tanggal',
            dataIndex: 'date',
            key: 'date',
            width: 150,
            render: (v) => dayjs(v).format('DD MMM YYYY HH:mm'),
        },
        {
            title: 'Metode',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            width: 130,
            render: (v, r) => (
                <span>
                    {methodLabel[v] ?? v}
                    {r.bankName && (
                        <span className="text-gray-500 ml-1 text-xs">({r.bankName})</span>
                    )}
                </span>
            ),
        },
        {
            title: 'Referensi',
            dataIndex: 'ref',
            key: 'ref',
            render: (v) => v ?? '-',
        },
        {
            title: 'Jumlah',
            dataIndex: 'amount',
            key: 'amount',
            width: 130,
            align: 'right' as const,
            render: (v) => formatRupiah(Number(v)),
        },
        {
            title: 'Bukti',
            key: 'attachment',
            width: 70,
            align: 'center' as const,
            render: (_, r) =>
                r.attachmentPath ? (
                    <Button
                        type="link"
                        size="small"
                        onClick={() =>
                            window.open(
                                `${import.meta.env.VITE_FILE_SERVER_URL ?? ''}/${r.attachmentPath}`,
                                '_blank',
                            )
                        }
                    >
                        Lihat
                    </Button>
                ) : (
                    <span className="text-gray-400 text-xs">-</span>
                ),
        },
        {
            title: 'Aksi',
            key: 'action',
            width: 100,
            align: 'center' as const,
            render: (_, r) => (
                <Dropdown
                    menu={{
                        items: [
                            { 
                                key: 'patient', 
                                label: 'Cetak (An. Pasien)', 
                                onClick: () => invoice && printReceipt(invoice, persistedInvoice || null, r, { printForKind: 'patient', cashierName }) 
                            },
                            { 
                                key: 'guarantor', 
                                label: 'Cetak (An. Penjamin)', 
                                onClick: () => invoice && printReceipt(invoice, persistedInvoice || null, r, { printForKind: 'guarantor', cashierName }) 
                            }
                        ]
                    }}
                    trigger={['click']}
                >
                    <Button size="small" type="primary" icon={<PrinterOutlined />}>Kwitansi</Button>
                </Dropdown>
            )
        }
    ]

    return (
        <div className="mt-6">
            <Typography.Title level={5} className="!mb-3">
                Riwayat Pembayaran
            </Typography.Title>
            <Table
                size="small"
                bordered
                pagination={false}
                columns={columns}
                dataSource={payments}
                rowKey="id"
                summary={() => (
                    <Table.Summary>
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4} align="right">
                                <Typography.Text strong>Total Dibayar</Typography.Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right">
                                <Typography.Text strong className="text-green-600">
                                    {formatRupiah(totalPaid)}
                                </Typography.Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2} />
                        </Table.Summary.Row>
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4} align="right">
                                <Typography.Text strong>Sisa Tagihan</Typography.Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right">
                                <Typography.Text
                                    strong
                                    className={remaining > 0 ? 'text-red-600' : 'text-green-600'}
                                >
                                    {formatRupiah(remaining)}
                                </Typography.Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2} />
                        </Table.Summary.Row>
                    </Table.Summary>
                )}
            />
        </div>
    )
}
