import { Button, Dropdown, Input, Switch, Table } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'

interface MedicineCategoryAttributes {
  id?: number
  name: string
  status?: boolean
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
    render: (_: MedicineCategoryAttributes, record: MedicineCategoryAttributes) => (
      <RowActions record={record} />
    )
  }
]

function RowActions({ record }: { record: MedicineCategoryAttributes }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['medicineCategory', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.medicineCategory?.deleteById
      if (!fn) throw new Error('API kategori obat tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineCategory', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => typeof record.id === 'number' && navigate(`/dashboard/pharmacy/medicine-categories/edit/${record.id}`) },
    { type: 'divider' },
    { key: 'delete', danger: true, label: 'Delete', icon: <DeleteOutlined />, onClick: () => typeof record.id === 'number' && deleteMutation.mutate(record.id) }
  ]
  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button
        aria-label="Actions"
        className="p-1 rounded text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <MoreOutlined />
      </button>
    </Dropdown>
  )
}

export function MedicineCategoryTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch, isError } = useQuery({
    queryKey: ['medicineCategory', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.medicineCategory?.list
      if (!fn) throw new Error('API kategori obat tidak tersedia.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: MedicineCategoryAttributes[] = (data?.result as MedicineCategoryAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => p.name.toLowerCase().includes(q))
  }, [data?.result, search])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Medicine Categories</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input type="text" placeholder="Search" className="w-full md:max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" onClick={() => navigate('/dashboard/pharmacy/medicine-categories/create')}>New Category</Button>
        </div>
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.message}</div>)}
      <Table dataSource={filtered} columns={columns} size="small" className="mt-4 rounded-xl shadow-sm" rowKey="id" scroll={{ x: 'max-content' }} />
    </div>
  )
}

export default MedicineCategoryTable

