import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { queryClient } from '@renderer/query-client'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { MenuProps } from 'antd'
import { Button, Dropdown, Input, Tooltip } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

interface MedicineAttributes {
  id?: number
  name: string
  medicineCategoryId: number
  medicineBrandId: number
  buyingPrice: number
  sellingPrice: number
  stock?: number
  category?: { name: string }
  brand?: { name: string }
}

const LOW_STOCK_THRESHOLD_MEDICINE = 20

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
  {
    title: 'Stock',
    dataIndex: 'stock',
    key: 'stock',
    width: 120,
    render: (value: MedicineAttributes['stock']) => {
      const stockValue = typeof value === 'number' ? value : 0
      if (stockValue === 0) {
        return (
          <Tooltip title="Stok habis">
            <span className="text-red-600 font-semibold">{stockValue}</span>
          </Tooltip>
        )
      }
      if (stockValue > 0 && stockValue <= LOW_STOCK_THRESHOLD_MEDICINE) {
        return (
          <Tooltip title="Stok hampir habis">
            <span className="text-orange-600 font-semibold">{stockValue}</span>
          </Tooltip>
        )
      }
      return stockValue
    }
  },
  {
    title: 'Harga Beli',
    dataIndex: 'buyingPrice',
    key: 'buyingPrice',
    width: 120,
    render: (value: number) => (
      <span className="text-gray-700 dark:text-gray-300">
        {new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(value)}
      </span>
    )
  },
  {
    title: 'Harga Jual',
    dataIndex: 'sellingPrice',
    key: 'sellingPrice',
    width: 120,
    render: (value: number) => (
      <span className="text-gray-700 dark:text-gray-300">
        {new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(value)}
      </span>
    )
  }
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
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () =>
        typeof record.id === 'number' && navigate(`/dashboard/medicine/medicines/edit/${record.id}`)
    },
    { type: 'divider' },
    {
      key: 'delete',
      danger: true,
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => typeof record.id === 'number' && deleteMutation.mutate(record.id)
    }
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

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Data Master Obat</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input
          type="text"
          placeholder="Cari"
          className="w-full md:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" onClick={() => navigate('/dashboard/medicine/medicines/create')}>
            Tambah
          </Button>
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
