import { Button, Dropdown, Input, Table } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { DeleteOutlined, EditOutlined, MoreOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons'
import { queryClient } from '@renderer/query-client'

type FormulaStatus = 'draft' | 'active' | 'archived'

interface ProductionFormulaItemAttributes {
  id?: number
  rawMaterialId: number
  qty: number
  uom: string
}

interface ProductionFormulaAttributes {
  id?: number
  finishedGoodMedicineId: number
  version: string
  status: FormulaStatus
  notes?: string | null
  medicine?: { name: string }
  items?: ProductionFormulaItemAttributes[]
  updatedAt?: string
}

type ProductionFormulaListResponse = {
  success: boolean
  result?: ProductionFormulaAttributes[]
  message?: string
}

type ProductionFormulaApi = {
  list: () => Promise<ProductionFormulaListResponse>
  deleteById: (args: { id: number }) => Promise<{ success: boolean; message?: string }>
}

const statusLabel: Record<FormulaStatus, string> = {
  draft: 'Draft',
  active: 'Aktif',
  archived: 'Arsip'
}

function RowActions({ record }: { record: ProductionFormulaAttributes }) {
  const navigate = useNavigate()
  const api = (window.api?.query as { productionFormula?: ProductionFormulaApi }).productionFormula

  const deleteMutation = useMutation({
    mutationKey: ['productionFormula', 'delete'],
    mutationFn: (id: number) => {
      const fn = api?.deleteById
      if (!fn) throw new Error('API formula produksi tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionFormula', 'list'] })
    }
  })

  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') {
          navigate(`/dashboard/farmasi/formulas/edit/${record.id}`)
        }
      }
    },
    { type: 'divider' },
    {
      key: 'delete',
      danger: true,
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') {
          deleteMutation.mutate(record.id)
        }
      }
    }
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button aria-label="Actions" className="p-1 rounded hover:bg-gray-100">
        <MoreOutlined />
      </button>
    </Dropdown>
  )
}

export function ProductionFormulaTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const api = (window.api?.query as { productionFormula?: ProductionFormulaApi }).productionFormula

  const { data, refetch, isError } = useQuery({
    queryKey: ['productionFormula', 'list'],
    queryFn: () => {
      const fn = api?.list
      if (!fn) throw new Error('API formula produksi tidak tersedia.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: ProductionFormulaAttributes[] = (data?.result as ProductionFormulaAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((item) => {
      const medicineName = item.medicine?.name ?? ''
      const notes = item.notes ?? ''
      const version = item.version
      return [medicineName, notes, version].join(' ').toLowerCase().includes(q)
    })
  }, [data?.result, search])

  const columns = [
    {
      title: 'Obat Jadi',
      dataIndex: ['medicine', 'name'],
      key: 'medicine',
      render: (_: unknown, record: ProductionFormulaAttributes) => record.medicine?.name ?? '-'
    },
    {
      title: 'Versi',
      dataIndex: 'version',
      key: 'version'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: FormulaStatus) => statusLabel[value] ?? value
    },
    {
      title: 'Jumlah Bahan',
      dataIndex: 'items',
      key: 'items',
      render: (items: ProductionFormulaItemAttributes[] | undefined) =>
        Array.isArray(items) ? items.length : 0
    },
    {
      title: 'Catatan',
      dataIndex: 'notes',
      key: 'notes',
      render: (value: string | null | undefined) => value ?? '-'
    },
    {
      title: 'Terakhir Diubah',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (value: string | undefined) => value ?? '-'
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 80,
      align: 'center' as const,
      render: (_: ProductionFormulaAttributes, record: ProductionFormulaAttributes) => (
        <RowActions record={record} />
      )
    }
  ]

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Formula Produksi</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input
          type="text"
          placeholder="Cari obat, versi atau catatan"
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
            onClick={() => navigate('/dashboard/farmasi/formulas/create')}
          >
            Tambah Formula
          </Button>
        </div>
      </div>
      {isError || (!data?.success && (
        <div className="text-red-500">{data?.message}</div>
      ))}
      <Table
        dataSource={filtered}
        columns={columns}
        size="small"
        className="mt-4 rounded-xl shadow-sm"
        rowKey="id"
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default ProductionFormulaTable

