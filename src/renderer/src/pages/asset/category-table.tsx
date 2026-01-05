import { Button, Input, Table, Tag, Popconfirm, message, Select } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

interface AssetCategoryAttributes {
  id?: number
  name: string
  type: 'MEDICAL' | 'NON_MEDICAL'
  requiresCalibration: boolean
  depreciationYears?: number | null
}

function useDeleteCategory() {
  return useMutation({
    mutationKey: ['assetCategory', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.assetCategory?.deleteById
      if (!fn) throw new Error('API assetCategory tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      message.success('Kategori aset berhasil dihapus')
    }
  })
}

export const categoryColumns = (
  onEdit: (record: AssetCategoryAttributes) => void,
  onDelete: (id: number) => void
): ColumnsType<AssetCategoryAttributes> => [
  { title: 'Nama', dataIndex: 'name', key: 'name' },
  { title: 'Tipe', dataIndex: 'type', key: 'type', render: (v: 'MEDICAL' | 'NON_MEDICAL') => (v === 'MEDICAL' ? 'Medis' : 'Non-Medis') },
  { title: 'Kalibrasi', dataIndex: 'requiresCalibration', key: 'requiresCalibration', render: (v: boolean) => <Tag color={v ? 'blue' : 'default'}>{v ? 'Perlu' : 'Tidak'}</Tag> },
  { title: 'Depresiasi (tahun)', dataIndex: 'depreciationYears', key: 'depreciationYears' },
  {
    title: 'Aksi',
    key: 'actions',
    fixed: 'right',
    render: (_, record) => (
      <div className="flex gap-2">
        <EditOutlined className="cursor-pointer text-blue-500" onClick={() => onEdit(record)} />
        <Popconfirm title="Hapus kategori?" onConfirm={() => record.id && onDelete(record.id)}>
          <DeleteOutlined className="cursor-pointer text-red-500" />
        </Popconfirm>
      </div>
    )
  }
]

export function AssetCategoryTable() {
  const navigate = useNavigate()
  
  // Individual search states
  const [searchName, setSearchName] = useState('')
  const [searchType, setSearchType] = useState<'MEDICAL' | 'NON_MEDICAL' | undefined>(undefined)

  const { data, refetch } = useQuery({
    queryKey: ['assetCategory', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.assetCategory?.list
      if (!fn) throw new Error('API assetCategory tidak tersedia.')
      return fn()
    }
  })

  const deleteMutation = useDeleteCategory()

  const filtered = useMemo(() => {
    const source: AssetCategoryAttributes[] = (data?.result as AssetCategoryAttributes[]) || []
    
    return source.filter((p) => {
      const matchName = searchName ? p.name.toLowerCase().includes(searchName.toLowerCase()) : true
      const matchType = searchType ? p.type === searchType : true
      return matchName && matchType
    })
  }, [data?.result, searchName, searchType])

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Kategori Aset</h2>
      
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/asset/category/create')}>Tambah</Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-3">
        <Input placeholder="Nama Kategori" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        <Select
          allowClear
          placeholder="Tipe"
          value={searchType}
          onChange={(v) => setSearchType(v)}
          options={[
            { label: 'Medis', value: 'MEDICAL' },
            { label: 'Non-Medis', value: 'NON_MEDICAL' }
          ]}
        />
      </div>

      <Table
        dataSource={filtered}
        columns={categoryColumns(
          (record) => navigate('/dashboard/asset/category/create', { state: { record } }),
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

export default AssetCategoryTable
