import { Button, Dropdown, Input, Switch, Table } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'

interface RawMaterialCategoryAttributes {
  id?: number
  name: string
  status: boolean
}

type RawMaterialCategoryApi = {
  list: () => Promise<{ success: boolean; result?: RawMaterialCategoryAttributes[]; message?: string }>
  deleteById: (args: { id: number }) => Promise<{ success: boolean; message?: string }>
}

const columns = [
  { title: 'Nama', dataIndex: 'name', key: 'name' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (value: boolean) => <Switch checked={Boolean(value)} disabled />
  },
  {
    title: 'Action',
    key: 'action',
    width: 80,
    align: 'center' as const,
    render: (_: RawMaterialCategoryAttributes, record: RawMaterialCategoryAttributes) => <RowActions record={record} />
  }
]

function RowActions({ record }: { record: RawMaterialCategoryAttributes }) {
  const navigate = useNavigate()
  const api = (window.api?.query as { rawMaterialCategory?: RawMaterialCategoryApi }).rawMaterialCategory
  const deleteMutation = useMutation({
    mutationKey: ['rawMaterialCategory', 'delete'],
    mutationFn: (id: number) => {
      const fn = api?.deleteById
      if (!fn) throw new Error('API kategori bahan baku tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterialCategory', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => typeof record.id === 'number' && navigate(`/dashboard/farmasi/raw-material-categories/edit/${record.id}`) },
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

export function RawMaterialCategoryTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const api = (window.api?.query as { rawMaterialCategory?: RawMaterialCategoryApi }).rawMaterialCategory
  const { data, refetch, isError } = useQuery({
    queryKey: ['rawMaterialCategory', 'list'],
    queryFn: () => {
      const fn = api?.list
      if (!fn) throw new Error('API kategori bahan baku tidak tersedia.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: RawMaterialCategoryAttributes[] = (data?.result as RawMaterialCategoryAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => p.name.toLowerCase().includes(q))
  }, [data?.result, search])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Kategori Bahan Baku</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input type="text" placeholder="Cari" className="w-full md:max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" onClick={() => navigate('/dashboard/farmasi/raw-material-categories/create')}>Kategori Baru</Button>
        </div>
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.message}</div>)}
      <Table dataSource={filtered} columns={columns} size="small" className="mt-4 rounded-xl shadow-sm" rowKey="id" scroll={{ x: 'max-content' }} />
    </div>
  )
}

export default RawMaterialCategoryTable
