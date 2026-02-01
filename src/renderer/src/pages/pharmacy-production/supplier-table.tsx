import { Button, Dropdown, Input, Table } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'

interface SupplierAttributes {
  id?: number
  nama: string
  kode: string
  noHp: string
  alamat?: string | null
  note?: string | null
}

type SupplierApi = {
  list: () => Promise<{ success: boolean; result?: SupplierAttributes[]; message?: string }>
  remove: (args: { id: number }) => Promise<{ success: boolean; message?: string }>
}

const columns = [
  { title: 'Kode', dataIndex: 'kode', key: 'kode', width: 100 },
  { title: 'Nama', dataIndex: 'nama', key: 'nama' },
  { title: 'No HP', dataIndex: 'noHp', key: 'noHp', width: 140 },
  { title: 'Alamat', dataIndex: 'alamat', key: 'alamat', render: (v: string | null) => v || '-' },
  { title: 'Catatan', dataIndex: 'note', key: 'note', render: (v: string | null) => v || '-' },
  { title: 'Action', key: 'action', width: 60, align: 'center' as const, render: (_: SupplierAttributes, r: SupplierAttributes) => <RowActions record={r} /> }
]

function RowActions({ record }: { record: SupplierAttributes }) {
  const navigate = useNavigate()
  const api = (window.api?.query as { suplier?: SupplierApi }).suplier
  const deleteMutation = useMutation({
    mutationKey: ['suplier', 'delete'],
    mutationFn: (id: number) => {
      const fn = api?.remove
      if (!fn) throw new Error('API pemasok tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suplier', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => typeof record.id === 'number' && navigate(`/dashboard/farmasi/suppliers/edit/${record.id}`) },
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

export function SupplierTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const api = (window.api?.query as { suplier?: SupplierApi }).suplier
  const { data, refetch, isError } = useQuery({
    queryKey: ['suplier', 'list'],
    queryFn: () => {
      const fn = api?.list
      if (!fn) throw new Error('API pemasok tidak tersedia.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: SupplierAttributes[] = (data?.result as SupplierAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => [p.nama, p.kode, p.noHp, p.alamat || '', p.note || ''].join(' ').toLowerCase().includes(q))
  }, [data?.result, search])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Pemasok</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input type="text" placeholder="Cari" className="w-full md:max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" onClick={() => navigate('/dashboard/farmasi/suppliers/create')}>Pemasok Baru</Button>
        </div>
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.message}</div>)}
      <Table dataSource={filtered} columns={columns} size="small" className="mt-4 rounded-xl shadow-sm" rowKey="id" scroll={{ x: 'max-content' }} />
    </div>
  )
}

export default SupplierTable
