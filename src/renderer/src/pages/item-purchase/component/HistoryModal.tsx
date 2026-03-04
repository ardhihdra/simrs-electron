import { Button, Modal, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatRupiah, type PharmacyTransactionRecord } from '../types'

interface Props {
    open: boolean
    loading: boolean
    rows: PharmacyTransactionRecord[]
    onClose: () => void
}

const methodLabel = (m: string) => {
    if (m === 'CASH') return { label: 'Tunai', color: 'green' }
    if (m === 'NONCASH') return { label: 'Non Tunai', color: 'blue' }
    return { label: 'Kredit', color: 'orange' }
}

const formatDate = (v: string) => {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return v
    return `${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
}

export function HistoryModal({ open, loading, rows, onClose }: Props) {
    const columns: ColumnsType<PharmacyTransactionRecord> = [
        { title: 'No. Faktur', dataIndex: 'fakturNumber', key: 'fakturNumber', width: 140 },
        {
            title: 'Tanggal',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            width: 160,
            render: (v: string) => formatDate(v)
        },
        {
            title: 'Metode',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            width: 100,
            render: (v: string) => {
                const { label, color } = methodLabel(v)
                return <Tag color={color}>{label}</Tag>
            }
        },
        {
            title: 'Grand Total',
            dataIndex: 'grandTotal',
            key: 'grandTotal',
            width: 140,
            align: 'right',
            render: (v: number) => <span className="font-semibold">{formatRupiah(v)}</span>
        },
        {
            title: 'Dibayar',
            dataIndex: 'paidAmount',
            key: 'paidAmount',
            width: 130,
            align: 'right',
            render: (v: number) => formatRupiah(v)
        },
        {
            title: 'Kembali',
            dataIndex: 'changeAmount',
            key: 'changeAmount',
            width: 110,
            align: 'right',
            render: (v: number) => formatRupiah(v)
        }
    ]

    return (
        <Modal
            open={open}
            title="Riwayat Transaksi Farmasi"
            onCancel={onClose}
            footer={<Button onClick={onClose}>Tutup</Button>}
            width={960}
        >
            {rows.length === 0 && !loading ? (
                <div className="text-center text-gray-400 py-8">Belum ada riwayat transaksi</div>
            ) : (
                <Table<PharmacyTransactionRecord>
                    rowKey={(r) => String(r.id)}
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    size="small"
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                />
            )}
        </Modal>
    )
}
