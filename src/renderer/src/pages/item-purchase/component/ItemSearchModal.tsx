import { useState, useMemo } from 'react'
import { Button, Input, Modal, Select, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatRupiah, type ItemLookup } from '../types'

interface Props {
    open: boolean
    loading: boolean
    itemList: ItemLookup[]
    onClose: () => void
    onSelect: (item: ItemLookup) => void
}

export function ItemSearchModal({ open, loading, itemList, onClose, onSelect }: Props) {
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

    const categories = useMemo(() => {
        return Array.from(
            new Map(
                itemList
                    .map((i) => (i.categoryName ?? '').trim())
                    .filter((n) => n.length > 0)
                    .map((n) => [n.toLowerCase(), n] as [string, string])
            ).values()
        )
    }, [itemList])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        let base = itemList
        if (categoryFilter !== 'ALL') {
            const target = categoryFilter.toLowerCase()
            base = base.filter((it) => (it.categoryName ?? '').toLowerCase() === target)
        }
        if (!q) return base
        return base.filter(
            (it) => it.kode.toLowerCase().includes(q) || it.nama.toLowerCase().includes(q)
        )
    }, [itemList, search, categoryFilter])

    const columns: ColumnsType<ItemLookup> = [
        {
            title: 'Kategori',
            dataIndex: 'categoryName',
            key: 'categoryName',
            width: 130,
            render: (v: string | null | undefined) =>
                v ? <Tag color="blue">{v}</Tag> : <span className="text-gray-400">—</span>
        },
        { title: 'Kode', dataIndex: 'kode', key: 'kode', width: 100 },
        { title: 'Nama Item', dataIndex: 'nama', key: 'nama' },
        {
            title: 'Stok',
            dataIndex: 'currentStock',
            key: 'currentStock',
            width: 80,
            align: 'right',
            render: (v: number | null | undefined) => {
                const n = typeof v === 'number' && Number.isFinite(v) ? v : 0
                return (
                    <span className={n <= 0 ? 'text-red-500 font-semibold' : n <= 10 ? 'text-orange-500 font-semibold' : 'text-green-600 font-semibold'}>
                        {n}
                    </span>
                )
            }
        },
        {
            title: 'Harga Jual',
            dataIndex: 'sellingPrice',
            key: 'sellingPrice',
            width: 130,
            align: 'right',
            render: (v: number | null) => formatRupiah(v)
        },
        {
            title: '',
            key: 'action',
            width: 70,
            align: 'center',
            render: (_: unknown, record: ItemLookup) => (
                <Button type="link" size="small" onClick={() => { onSelect(record); setSearch(''); setCategoryFilter('ALL') }}>
                    Pilih
                </Button>
            )
        }
    ]

    return (
        <Modal
            open={open}
            title="Pilih Barang / Obat"
            onCancel={() => { onClose(); setSearch(''); setCategoryFilter('ALL') }}
            footer={null}
            width={860}
        >
            <div className="mb-3 flex gap-2">
                <Input
                    placeholder="Cari kode / nama..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    allowClear
                    className="flex-1"
                    autoFocus
                />
                <Select
                    allowClear
                    placeholder="Filter kategori"
                    className="w-48"
                    value={categoryFilter === 'ALL' ? undefined : categoryFilter}
                    onChange={(v) => setCategoryFilter(typeof v === 'string' && v ? v : 'ALL')}
                    options={categories.map((c) => ({ value: c, label: c }))}
                />
            </div>
            <Table<ItemLookup>
                rowKey={(r) => String(r.id)}
                columns={columns}
                dataSource={filtered}
                loading={loading}
                size="small"
                pagination={{ pageSize: 8, showSizeChanger: false }}
                onRow={(record) => ({
                    onDoubleClick: () => { onSelect(record); setSearch(''); setCategoryFilter('ALL') },
                    style: { cursor: 'pointer' }
                })}
            />
        </Modal>
    )
}
