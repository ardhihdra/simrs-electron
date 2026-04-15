import { Table, Typography, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

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

const columns: ColumnsType<PaymentRecord> = [
    { title: 'Kode', dataIndex: 'kode', key: 'kode', width: 180 },
    {
        title: 'Tanggal',
        dataIndex: 'date',
        key: 'date',
        width: 160,
        render: (v) => dayjs(v).format('DD MMM YYYY HH:mm'),
    },
    {
        title: 'Metode',
        dataIndex: 'paymentMethod',
        key: 'paymentMethod',
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
        align: 'right' as const,
        render: (v) => formatRupiah(Number(v)),
    },
    {
        title: 'Bukti',
        key: 'attachment',
        width: 80,
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
]

interface PaymentHistoryProps {
    payments: PaymentRecord[]
    totalPaid: number
    remaining: number
}

export function PaymentHistory({ payments, totalPaid, remaining }: PaymentHistoryProps) {
    if (payments.length === 0) return null

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
