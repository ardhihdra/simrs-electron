import { Button, Dropdown, Input } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import { DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/GenericTable'

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
      <Button
        type="text"
        icon={<MoreOutlined />}
        className="text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
      />
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

  const columns = [
    { title: 'Medicine', dataIndex: 'name', key: 'name' },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (val: MedicineAttributes['category']) => (val?.name ? val.name : '-')
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      render: (val: MedicineAttributes['brand']) => (val?.name ? val.name : '-')
    },
    { title: 'Buying', dataIndex: 'buyingPrice', key: 'buyingPrice', width: 120 },
    { title: 'Selling', dataIndex: 'sellingPrice', key: 'sellingPrice', width: 120 },
  ]

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold dark:text-white">Medicines</h2>
        <div className="flex gap-2 flex-wrap md:justify-end w-full md:w-auto">
          <Input type="text" placeholder="Search" className="w-full md:w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/pharmacy/medicines/create')}>New Medicine</Button>
        </div>
      </div>
      {isError || (!data?.success && <div className="text-red-500 mb-4">{data?.message}</div>)}
      
      <div className="bg-white dark:bg-[#141414] rounded-lg shadow border border-gray-200 dark:border-gray-800">
        <GenericTable 
            columns={columns} 
            dataSource={filtered} 
            rowKey="id" 
            action={{
                title: 'Action',
                width: 80,
                align: 'center',
                render: (record) => <RowActions record={record} />
            }}
        />
      </div>
    </div>
  )
}

export default MedicinesTable
