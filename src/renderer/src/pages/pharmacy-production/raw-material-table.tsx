import { Button, Dropdown, Input, Table } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import { DeleteOutlined, EditOutlined, MoreOutlined, ReloadOutlined, PlusOutlined, ExportOutlined } from '@ant-design/icons'

type MaterialType = 'active' | 'excipient' | 'solvent'

interface RawMaterialAttributes {
  id?: number
  name: string
  rawMaterialCategoryId?: number | null
  internalCode?: string | null
  casCode?: string | null
  materialType: MaterialType
  defaultUom?: string | null
  grade?: string | null
  status: boolean
  description?: string | null
  category?: { name: string } | null
  defaultSupplier?: { nama: string } | null
  stock?: number
}

type RawMaterialApi = {
  list: () => Promise<{ success: boolean; result?: RawMaterialAttributes[]; message?: string }>
  deleteById: (args: { id: number }) => Promise<{ success: boolean; message?: string }>
}

const columns = [
  { title: 'Nama', dataIndex: 'name', key: 'name' },
  { title: 'Kategori', dataIndex: 'category', key: 'category', render: (v: { name: string } | null) => (v?.name || '-') },
  { title: 'Supplier Default', dataIndex: 'defaultSupplier', key: 'defaultSupplier', render: (v: { nama: string } | null) => (v?.nama || '-') },
  { title: 'Kode Internal', dataIndex: 'internalCode', key: 'internalCode', render: (v: string | null) => v || '-' },
  { title: 'CAS', dataIndex: 'casCode', key: 'casCode', render: (v: string | null) => v || '-' },
  { title: 'Stok', dataIndex: 'stock', key: 'stock', width: 100, render: (value: number | null | undefined) => (typeof value === 'number' ? value : 0) },
  { title: 'Action', key: 'action', width: 80, align: 'center' as const, render: (_: RawMaterialAttributes, r: RawMaterialAttributes) => <RowActions record={r} /> }
]

function RowActions({ record }: { record: RawMaterialAttributes }) {
  const navigate = useNavigate()
  const api = (window.api?.query as { rawMaterial?: RawMaterialApi }).rawMaterial
  const deleteMutation = useMutation({
    mutationKey: ['rawMaterial', 'delete'],
    mutationFn: (id: number) => {
      const fn = api?.deleteById
      if (!fn) throw new Error('API bahan baku tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterial', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => typeof record.id === 'number' && navigate(`/dashboard/farmasi/raw-materials/edit/${record.id}`) },
    { type: 'divider' },
    { key: 'delete', danger: true, label: 'Delete', icon: <DeleteOutlined />, onClick: () => typeof record.id === 'number' && deleteMutation.mutate(record.id) }
  ]
  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button aria-label="Actions" className="p-1 rounded hover:bg-gray-100">
        <MoreOutlined />
      </button>
    </Dropdown>
  )
}

export function RawMaterialTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const api = (window.api?.query as { rawMaterial?: RawMaterialApi; export: { exportCsv: (args: { entity: string; usePagination?: boolean; q?: string }) => Promise<{ success: boolean; url?: string }> } }).rawMaterial
  const { data, refetch, isError } = useQuery({
    queryKey: ['rawMaterial', 'list'],
    queryFn: () => {
      const fn = api?.list
      if (!fn) throw new Error('API bahan baku tidak tersedia.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: RawMaterialAttributes[] = (data?.result as RawMaterialAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => [p.name, p.internalCode || '', p.casCode || '', p.category?.name || '', p.defaultSupplier?.nama || ''].join(' ').toLowerCase().includes(q))
  }, [data?.result, search])

  const onExport = async () => {
    try {
      const res = await window.api.query.export.exportCsv({ entity: 'rawmaterial', usePagination: false, q: search.trim() || undefined })
      if (res && typeof res === 'object' && 'success' in res && res.success && 'url' in res && res.url) {
        window.open(res.url as string, '_blank')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(msg)
    }
  }

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Data Bahan Baku</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input type="text" placeholder="Cari" className="w-full md:max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
          <Button icon={<ExportOutlined />} onClick={onExport}>Export CSV</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/farmasi/raw-materials/create')}>Tambah</Button>
        </div>
      </div>
      {isError || (!data?.success && <div className="text-red-500">{typeof data?.message === 'string' ? data.message : ''}</div>)}
      <Table dataSource={filtered} columns={columns} size="small" className="mt-4 rounded-xl shadow-sm" rowKey="id" scroll={{ x: 'max-content' }} />
    </div>
  )
}

export default RawMaterialTable
