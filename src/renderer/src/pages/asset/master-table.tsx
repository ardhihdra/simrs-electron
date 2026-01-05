import { Button, Input, Table, Popconfirm, message, Select } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

interface AssetMasterAttributes {
  id?: number
  categoryId: number
  name: string
  brand?: string | null
  model?: string | null
  spec?: string | null
}

interface CategoryAttributes {
  id: number
  name: string
}

function useDeleteMaster() {
  return useMutation({
    mutationKey: ['assetMaster', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.assetMaster?.deleteById
      if (!fn) throw new Error('API assetMaster tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      message.success('Master aset berhasil dihapus')
    }
  })
}

export const masterColumns = (
  onEdit: (record: AssetMasterAttributes) => void,
  onDelete: (id: number) => void,
  categoryMap: Record<number, string>
): ColumnsType<AssetMasterAttributes> => [
  { 
    title: 'Kategori', 
    dataIndex: 'categoryId', 
    key: 'categoryId',
    render: (id) => categoryMap[id] || '-'
  },
  { title: 'Nama', dataIndex: 'name', key: 'name' },
  { title: 'Merk', dataIndex: 'brand', key: 'brand' },
  { title: 'Model', dataIndex: 'model', key: 'model' },
  { title: 'Spesifikasi', dataIndex: 'spec', key: 'spec' },
  {
    title: 'Aksi',
    key: 'actions',
    fixed: 'right',
    render: (_, record) => (
      <div className="flex gap-2">
        <EditOutlined className="cursor-pointer text-blue-500" onClick={() => onEdit(record)} />
        <Popconfirm title="Hapus master?" onConfirm={() => record.id && onDelete(record.id)}>
          <DeleteOutlined className="cursor-pointer text-red-500" />
        </Popconfirm>
      </div>
    )
  }
]

export function AssetMasterTable() {
  const navigate = useNavigate()
  
  // Individual search states
  const [searchCategory, setSearchCategory] = useState<number | undefined>(undefined)
  const [searchName, setSearchName] = useState('')
  const [searchBrand, setSearchBrand] = useState('')
  const [searchModel, setSearchModel] = useState('')
  const [searchSpec, setSearchSpec] = useState('')

  const { data, refetch } = useQuery({
    queryKey: ['assetMaster', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.assetMaster?.list
      if (!fn) throw new Error('API assetMaster tidak tersedia.')
      return fn()
    }
  })
  
  const { data: categories } = useQuery({
    queryKey: ['assetCategory', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.assetCategory?.list
      if (!fn) throw new Error('API assetCategory tidak tersedia.')
      return fn()
    }
  })

  const categoryMap = useMemo(() => {
    const map: Record<number, string> = {}
    const list = (categories?.result as CategoryAttributes[]) || []
    list.forEach((c) => {
      map[c.id] = c.name
    })
    return map
  }, [categories?.result])

  const categoryOptions = useMemo(() => {
    const list = (categories?.result as CategoryAttributes[]) || []
    return list.map(c => ({ label: c.name, value: c.id }))
  }, [categories?.result])

  const deleteMutation = useDeleteMaster()

  const filtered = useMemo(() => {
    const source: AssetMasterAttributes[] = (data?.result as AssetMasterAttributes[]) || []
    
    return source.filter((p) => {
      const matchCategory = searchCategory ? p.categoryId === searchCategory : true
      const matchName = searchName ? p.name.toLowerCase().includes(searchName.toLowerCase()) : true
      const matchBrand = searchBrand ? (p.brand || '').toLowerCase().includes(searchBrand.toLowerCase()) : true
      const matchModel = searchModel ? (p.model || '').toLowerCase().includes(searchModel.toLowerCase()) : true
      const matchSpec = searchSpec ? (p.spec || '').toLowerCase().includes(searchSpec.toLowerCase()) : true

      return matchCategory && matchName && matchBrand && matchModel && matchSpec
    })
  }, [data?.result, searchCategory, searchName, searchBrand, searchModel, searchSpec])

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Master Aset</h2>
      
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/asset/master/create')}>Tambah</Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3 mb-3">
        <Select
          allowClear
          placeholder="SEMUA KATEGORI"
          value={searchCategory}
          onChange={(v) => setSearchCategory(v)}
          options={categoryOptions}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
        <Input placeholder="Nama" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
        <Input placeholder="Merk" value={searchBrand} onChange={(e) => setSearchBrand(e.target.value)} />
        <Input placeholder="Model" value={searchModel} onChange={(e) => setSearchModel(e.target.value)} />
        <Input placeholder="Spesifikasi" value={searchSpec} onChange={(e) => setSearchSpec(e.target.value)} />
      </div>

      <Table
        dataSource={filtered}
        columns={masterColumns(
          (record) => navigate('/dashboard/asset/master/create', { state: { record } }),
          (id) => deleteMutation.mutate(id, { onSuccess: () => refetch() }),
          categoryMap
        )}
        size="small"
        className="mt-4 rounded-xl shadow-sm"
        rowKey="id"
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default AssetMasterTable
