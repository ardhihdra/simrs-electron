import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { queryClient } from '@renderer/query-client'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { MenuProps } from 'antd'
import { Button, Dropdown, Input } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

type ItemKind = 'DEVICE' | 'CONSUMABLE' | 'NUTRITION' | 'GENERAL'

interface ItemAttributes {
  id?: number
  nama: string
  kode: string
  kodeUnit: string
  kind?: ItemKind | null
  unit?: { nama?: string; kode?: string } | null
  stock?: number
}

type ItemListResponse = {
  success: boolean
  result?: ItemAttributes[]
  message?: string
}

interface InventoryStockItem {
  kodeItem: string
  namaItem: string
  unit: string
  stockIn: number
  stockOut: number
  availableStock: number
}

type InventoryStockResponse = {
  success: boolean
  result?: InventoryStockItem[]
  message?: string
}

const kindLabels: Record<ItemKind, string> = {
  DEVICE: 'Alat Kesehatan',
  CONSUMABLE: 'BMHP / Habis Pakai',
  NUTRITION: 'Makanan / Minuman',
  GENERAL: 'Barang Umum'
}

function RowActions({ record }: { record: ItemAttributes }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['item', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.item?.deleteById
      if (!fn) throw new Error('API item tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', 'list'] })
    }
  })

  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') navigate(`/dashboard/farmasi/items/edit/${record.id}`)
      }
    },
    { type: 'divider' },
    {
      key: 'delete',
      danger: true,
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') deleteMutation.mutate(record.id)
      }
    }
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <Button type="text" icon={<MoreOutlined />} />
    </Dropdown>
  )
}

export function ItemTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data, refetch, isError } = useQuery<ItemListResponse>({
    queryKey: ['item', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.item?.list
      if (!fn) throw new Error('API item tidak tersedia.')
      return fn()
    }
  })

  const { data: stockData } = useQuery<InventoryStockResponse>({
    queryKey: ['inventoryStock', 'list'],
    queryFn: () => {
      const api = (
        window.api?.query as {
          inventoryStock?: { list: () => Promise<InventoryStockResponse> }
        }
      ).inventoryStock
      const fn = api?.list
      if (!fn) throw new Error('API stok inventory tidak tersedia.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: ItemAttributes[] = Array.isArray(data?.result) ? data.result : []
    const stockList: InventoryStockItem[] = Array.isArray(stockData?.result) ? stockData.result : []

    const stockMap = new Map<string, number>()
    for (const s of stockList) {
      const kodeItem = s.kodeItem.trim().toUpperCase()
      const value = typeof s.availableStock === 'number' ? s.availableStock : 0
      stockMap.set(kodeItem, value)
    }

    const withStock: ItemAttributes[] = source.map((item) => {
      const key = item.kode.trim().toUpperCase()
      const stock = stockMap.get(key) ?? 0
      return { ...item, stock }
    })

    const q = search.trim().toLowerCase()
    if (!q) return withStock
    return withStock.filter((item) => {
      const unitName = item.unit?.nama ?? ''
      const stockText = typeof item.stock === 'number' ? String(item.stock) : ''
      return [item.nama, item.kode, unitName, stockText].join(' ').toLowerCase().includes(q)
    })
  }, [data?.result, stockData?.result, search])

  return (
    <div>
      <h2 className="text-3xl md:text-4xl font-bold mb-4 justify-center flex">Data Master Item</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input
          type="text"
          placeholder="Cari nama, kode, atau unit"
          className="w-full md:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/dashboard/farmasi/items/create')}
          >
            Tambah
          </Button>
        </div>
      </div>
      {(isError || data?.success === false) && (
        <div className="text-red-500 mt-2">
          {typeof data?.message === 'string' && data.message.length > 0
            ? data.message
            : 'Gagal memuat data item'}
        </div>
      )}

      <div className="mt-4 bg-white dark:bg-[#141414] rounded-lg shadow border border-gray-200 dark:border-gray-800">
        <GenericTable<ItemAttributes>
          columns={[
            { title: 'Nama', dataIndex: 'nama', key: 'nama' },
            { title: 'Kode', dataIndex: 'kode', key: 'kode', width: 120 },
            {
              title: 'Stok',
              dataIndex: 'stock',
              key: 'stock',
              width: 100,
              render: (v: ItemAttributes['stock']) => (typeof v === 'number' ? v : 0)
            },
            {
              title: 'Unit',
              dataIndex: 'unit',
              key: 'unit',
              render: (v: ItemAttributes['unit']) => v?.nama || v?.kode || '-'
            },
            {
              title: 'Kategori',
              dataIndex: 'kind',
              key: 'kind',
              render: (v: ItemAttributes['kind']) => (v ? (kindLabels[v] ?? v) : '-')
            }
          ]}
          dataSource={filtered}
          rowKey={(r) => String(r.id ?? r.kode)}
          action={{
            title: 'Action',
            width: 80,
            align: 'center',
            fixedRight: true,
            render: (record) => <RowActions record={record} />
          }}
        />
      </div>
    </div>
  )
}

export default ItemTable
