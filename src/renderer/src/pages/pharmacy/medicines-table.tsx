import { Button, Dropdown, Input, Table } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'

interface MedicineAttributes { 
  id?: number; 
  name: string; 
  medicineCategoryId: number; 
  medicineBrandId: number; 
  buyingPrice: number; 
  sellingPrice: number; 
  category?: { name: string }; 
  brand?: { name: string }; 
}

const columns = [
  { title: 'Medicine', dataIndex: 'name', key: 'name' },
  { title: 'Category', dataIndex: 'category', key: 'category', render: (val: any) => val ? val.name : '-' },
  { title: 'Brand', dataIndex: 'brand', key: 'brand', render: (val: any) => val ? val.name : '-' },
  { title: 'Buying', dataIndex: 'buyingPrice', key: 'buyingPrice', width: 120 },
  { title: 'Selling', dataIndex: 'sellingPrice', key: 'sellingPrice', width: 120 },
  { title: 'Action', key: 'action', width: 60, align: 'center' as const, render: (_: MedicineAttributes, r: MedicineAttributes) => <RowActions record={r} /> }
]

function RowActions({ record }: { record: MedicineAttributes }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['medicine', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.medicine?.deleteById
      if (!fn) throw new Error('API obat tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => typeof record.id === 'number' && navigate(`/dashboard/pharmacy/medicines/edit/${record.id}`) },
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

export function MedicinesTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch, isError } = useQuery({
    queryKey: ['medicine', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.medicine?.list
      if (!fn) throw new Error('API obat tidak tersedia.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: MedicineAttributes[] = (data?.result as MedicineAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => p.name.toLowerCase().includes(q))
  }, [data?.result, search])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Medicines</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input type="text" placeholder="Search" className="w-full md:max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" onClick={() => navigate('/dashboard/pharmacy/medicines/create')}>New Medicine</Button>
        </div>
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.message}</div>)}
      <Table dataSource={filtered} columns={columns} size="small" className="mt-4 rounded-xl shadow-sm" rowKey="id" scroll={{ x: 'max-content' }} />
    </div>
  )
}

export default MedicinesTable

