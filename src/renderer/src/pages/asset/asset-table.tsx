import { Button, Input, Table, Tag, Popconfirm, message, Select } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

type AssetStatus = 'REGISTERED' | 'IN_USE' | 'MAINTENANCE' | 'BROKEN' | 'DISPOSED'
type AssetCondition = 'GOOD' | 'FAIR' | 'POOR'

interface AssetAttributes {
  id?: number
  assetCode: string
  assetMasterId: number
  serialNumber?: string | null
  purchaseDate?: string | null
  purchasePrice?: number | null
  fundingSource?: 'BLUD' | 'APBN' | 'HIBAH' | null
  currentLocationId?: number | null
  status: AssetStatus
  condition: AssetCondition
}

function useDeleteAsset() {
  return useMutation({
    mutationKey: ['asset', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.asset?.deleteById
      if (!fn) throw new Error('API asset tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      message.success('Aset berhasil dihapus')
    }
  })
}

export const assetColumns = (
  onEdit: (record: AssetAttributes) => void,
  onDelete: (id: number) => void
): ColumnsType<AssetAttributes> => [
  { title: 'Kode Aset', dataIndex: 'assetCode', key: 'assetCode' },
  { title: 'Serial', dataIndex: 'serialNumber', key: 'serialNumber' },
  { title: 'Status', dataIndex: 'status', key: 'status', render: (v: AssetStatus) => <Tag>{v}</Tag> },
  { title: 'Kondisi', dataIndex: 'condition', key: 'condition', render: (v: AssetCondition) => <Tag>{v}</Tag> },
  {
    title: 'Aksi',
    key: 'actions',
    fixed: 'right',
    render: (_, record) => (
      <div className="flex gap-2">
        <EditOutlined className="cursor-pointer text-blue-500" onClick={() => onEdit(record)} />
        <Popconfirm title="Hapus aset?" onConfirm={() => record.id && onDelete(record.id)}>
          <DeleteOutlined className="cursor-pointer text-red-500" />
        </Popconfirm>
      </div>
    )
  }
]

export function AssetTable() {
  const navigate = useNavigate()
  
  // Individual search states
  const [searchCode, setSearchCode] = useState('')
  const [searchSerial, setSearchSerial] = useState('')
  const [searchStatus, setSearchStatus] = useState<AssetStatus | undefined>(undefined)
  const [searchCondition, setSearchCondition] = useState<AssetCondition | undefined>(undefined)

  const { data, refetch } = useQuery({
    queryKey: ['asset', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.asset?.list
      if (!fn) throw new Error('API asset tidak tersedia.')
      return fn()
    }
  })
  const deleteMutation = useDeleteAsset()

  const filtered = useMemo(() => {
    const source: AssetAttributes[] = (data?.result as AssetAttributes[]) || []
    
    return source.filter((p) => {
      const matchCode = searchCode ? p.assetCode.toLowerCase().includes(searchCode.toLowerCase()) : true
      const matchSerial = searchSerial ? (p.serialNumber || '').toLowerCase().includes(searchSerial.toLowerCase()) : true
      const matchStatus = searchStatus ? p.status === searchStatus : true
      const matchCondition = searchCondition ? p.condition === searchCondition : true

      return matchCode && matchSerial && matchStatus && matchCondition
    })
  }, [data?.result, searchCode, searchSerial, searchStatus, searchCondition])

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Registrasi Aset</h2>
      
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/asset/register/create')}>Tambah</Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3 mb-3">
        <Input placeholder="Kode Aset" value={searchCode} onChange={(e) => setSearchCode(e.target.value)} />
        <Input placeholder="Serial Number" value={searchSerial} onChange={(e) => setSearchSerial(e.target.value)} />
        <Select
          allowClear
          placeholder="Status"
          value={searchStatus}
          onChange={(v) => setSearchStatus(v)}
          options={[
            { label: 'REGISTERED', value: 'REGISTERED' },
            { label: 'IN_USE', value: 'IN_USE' },
            { label: 'MAINTENANCE', value: 'MAINTENANCE' },
            { label: 'BROKEN', value: 'BROKEN' },
            { label: 'DISPOSED', value: 'DISPOSED' }
          ]}
        />
        <Select
          allowClear
          placeholder="Kondisi"
          value={searchCondition}
          onChange={(v) => setSearchCondition(v)}
          options={[
            { label: 'GOOD', value: 'GOOD' },
            { label: 'FAIR', value: 'FAIR' },
            { label: 'POOR', value: 'POOR' }
          ]}
        />
      </div>

      <Table
        dataSource={filtered}
        columns={assetColumns(
          (record) => navigate('/dashboard/asset/register/create', { state: { record } }),
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

export default AssetTable
