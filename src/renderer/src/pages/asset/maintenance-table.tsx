import { Button, Input, Table, Popconfirm, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'

interface AssetMaintenanceAttributes {
  id?: number
  assetId: number
  type: 'PREVENTIVE' | 'REPAIR' | 'CALIBRATION'
  vendor?: string | null
  scheduleDate?: string | null
  actualDate?: string | null
  cost?: number | null
  nextDueDate?: string | null
}

function useDeleteMaintenance() {
  return useMutation({
    mutationKey: ['assetMaintenance', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.assetMaintenance?.deleteById
      if (!fn) throw new Error('API assetMaintenance tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      message.success('Data pemeliharaan berhasil dihapus')
    }
  })
}

const columns = (
  onEdit: (record: AssetMaintenanceAttributes) => void,
  onDelete: (id: number) => void
): ColumnsType<AssetMaintenanceAttributes> => [
  { title: 'Aset', dataIndex: 'assetId', key: 'assetId' },
  { title: 'Tipe', dataIndex: 'type', key: 'type' },
  { title: 'Vendor', dataIndex: 'vendor', key: 'vendor' },
  { title: 'Jadwal', dataIndex: 'scheduleDate', key: 'scheduleDate' },
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

export function AssetMaintenanceTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch } = useQuery({
    queryKey: ['assetMaintenance', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.assetMaintenance?.list
      if (!fn) throw new Error('API assetMaintenance tidak tersedia.')
      return fn()
    }
  })
  const deleteMutation = useDeleteMaintenance()

  const filtered = useMemo(() => {
    const source: AssetMaintenanceAttributes[] = (data?.result as AssetMaintenanceAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => [p.vendor, p.type].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [data?.result, search])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Pemeliharaan & Kalibrasi</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input type="text" placeholder="Cari" className="w-full md:max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" onClick={() => navigate('/dashboard/asset/maintenance/create')}>Tambah</Button>
        </div>
      </div>
      <Table
        dataSource={filtered}
        columns={columns(
          (record) => navigate('/dashboard/asset/maintenance/create', { state: { record } }),
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

export default AssetMaintenanceTable
