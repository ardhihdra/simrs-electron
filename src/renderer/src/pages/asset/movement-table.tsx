import { Button, Input, Table, Popconfirm, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'

interface AssetMovementAttributes {
  id?: number
  assetId: number
  fromLocationId?: number | null
  toLocationId: number
  movedAt: string
  reason?: string | null
  approvedBy?: number | null
}

function useDeleteMovement() {
  return useMutation({
    mutationKey: ['assetMovement', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.assetMovement?.deleteById
      if (!fn) throw new Error('API assetMovement tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      message.success('Data perpindahan berhasil dihapus')
    }
  })
}

const columns = (
  onEdit: (record: AssetMovementAttributes) => void,
  onDelete: (id: number) => void
): ColumnsType<AssetMovementAttributes> => [
  { title: 'Aset', dataIndex: 'assetId', key: 'assetId' },
  { title: 'Dari', dataIndex: 'fromLocationId', key: 'fromLocationId' },
  { title: 'Ke', dataIndex: 'toLocationId', key: 'toLocationId' },
  { title: 'Tanggal', dataIndex: 'movedAt', key: 'movedAt' },
  { title: 'Alasan', dataIndex: 'reason', key: 'reason' },
  {
    title: 'Aksi',
    key: 'actions',
    fixed: 'right',
    render: (_, record) => (
      <div className="flex gap-2">
        <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(record)} />
        <Popconfirm title="Hapus data?" onConfirm={() => record.id && onDelete(record.id)}>
          <Button icon={<DeleteOutlined />} size="small" danger />
        </Popconfirm>
      </div>
    )
  }
]

export function AssetMovementTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch } = useQuery({
    queryKey: ['assetMovement', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.assetMovement?.list
      if (!fn) throw new Error('API assetMovement tidak tersedia.')
      return fn()
    }
  })
  const deleteMutation = useDeleteMovement()

  const filtered = useMemo(() => {
    const source: AssetMovementAttributes[] = (data?.result as AssetMovementAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => [p.reason, p.movedAt].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [data?.result, search])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Perpindahan Aset</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input type="text" placeholder="Cari" className="w-full md:max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" onClick={() => navigate('/dashboard/asset/movement/create')}>Tambah</Button>
        </div>
      </div>
      <Table
        dataSource={filtered}
        columns={columns(
          (record) => navigate('/dashboard/asset/movement/create', { state: { record } }),
          (id) => deleteMutation.mutate(id, { onSuccess: () => refetch() })
        )}
        size="small"
        className="mt-4 rounded-xl shadow-sm"
        rowKey="id"
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default AssetMovementTable
