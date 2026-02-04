import { Button, Dropdown, Input, Table } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'

interface MedicineBrandAttributes { id?: number; name: string; email?: string | null; phone?: string | null }

const columns = [
  { title: 'Brand', dataIndex: 'name', key: 'name' },
  { title: 'Email', dataIndex: 'email', key: 'email', render: (v: string | null) => v || '-' },
  { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (v: string | null) => v || '-' },
  { title: 'Action', key: 'action', width: 60, align: 'center' as const, render: (_: MedicineBrandAttributes, r: MedicineBrandAttributes) => <RowActions record={r} /> }
]

function RowActions({ record }: { record: MedicineBrandAttributes }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['medicineBrand', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.medicineBrand?.deleteById
      if (!fn) throw new Error('API merk obat tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineBrand', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => typeof record.id === 'number' && navigate(`/dashboard/medicine/medicine-brands/edit/${record.id}`) },
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

export function MedicineBrandTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch, isError } = useQuery({
    queryKey: ['medicineBrand', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.medicineBrand?.list
      if (!fn) throw new Error('API merk obat tidak tersedia.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: MedicineBrandAttributes[] = (data?.result as MedicineBrandAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => [p.name, p.email || '', p.phone || ''].join(' ').toLowerCase().includes(q))
  }, [data?.result, search])

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Merek Obat</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input type="text" placeholder="Cari" className="w-full md:max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" onClick={() => navigate('/dashboard/medicine/medicine-brands/create')}>Tambah</Button>
        </div>
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.message}</div>)}
      <Table dataSource={filtered} columns={columns} size="small" className="mt-4 rounded-xl shadow-sm" rowKey="id" scroll={{ x: 'max-content' }} />
    </div>
  )
}

export default MedicineBrandTable

