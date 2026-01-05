import { Button, Input, Table, Popconfirm, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'

interface AssetDepreciationAttributes {
  id?: number
  assetId: number
  year: number
  bookValue: number
  depreciationValue: number
}

function useDeleteDepreciation() {
  return useMutation({
    mutationKey: ['assetDepreciation', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.assetDepreciation?.deleteById
      if (!fn) throw new Error('API assetDepreciation tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      message.success('Data depresiasi berhasil dihapus')
    }
  })
}

const columns = (
  onEdit: (record: AssetDepreciationAttributes) => void,
  onDelete: (id: number) => void
): ColumnsType<AssetDepreciationAttributes> => [
  { title: 'Aset', dataIndex: 'assetId', key: 'assetId' },
  { title: 'Tahun', dataIndex: 'year', key: 'year' },
  { title: 'Nilai Buku', dataIndex: 'bookValue', key: 'bookValue' },
  { title: 'Nilai Depresiasi', dataIndex: 'depreciationValue', key: 'depreciationValue' },
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

export function AssetDepreciationTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch } = useQuery({
    queryKey: ['assetDepreciation', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.assetDepreciation?.list
      if (!fn) throw new Error('API assetDepreciation tidak tersedia.')
      return fn()
    }
  })
  const deleteMutation = useDeleteDepreciation()

  const filtered = useMemo(() => {
    const source: AssetDepreciationAttributes[] = (data?.result as AssetDepreciationAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => [String(p.year)].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [data?.result, search])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Depresiasi Aset</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input type="text" placeholder="Cari" className="w-full md:max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" onClick={() => navigate('/dashboard/asset/depreciation/create')}>Tambah</Button>
        </div>
      </div>
      <Table
        dataSource={filtered}
        columns={columns(
          (record) => navigate('/dashboard/asset/depreciation/create', { state: { record } }),
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

export default AssetDepreciationTable
