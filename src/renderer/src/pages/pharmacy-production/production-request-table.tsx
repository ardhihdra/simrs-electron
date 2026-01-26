import { Button, Dropdown, Input, Table, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { queryClient } from '@renderer/query-client'

type ProductionRequestStatus = 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled'

interface ProductionRequestAttributes {
  id?: number
  code: string
  finishedGoodMedicineId: number
  productionFormulaId: number
  qtyPlanned: number
  status: ProductionRequestStatus
  scheduledStartDate?: string | null
  scheduledEndDate?: string | null
  actualStartDate?: string | null
  actualEndDate?: string | null
  notes?: string | null
  medicine?: { name: string } | null
  formula?: { version: string } | null
}

type ProductionRequestListResponse = {
  success: boolean
  result?: ProductionRequestAttributes[]
  message?: string
}

type ProductionRequestApi = {
  list: () => Promise<ProductionRequestListResponse>
  deleteById: (args: { id: number }) => Promise<{ success: boolean; message?: string }>
}

const statusLabel: Record<ProductionRequestStatus, string> = {
  draft: 'Draft',
  approved: 'Disetujui',
  in_progress: 'Sedang Diproduksi',
  completed: 'Selesai',
  cancelled: 'Dibatalkan'
}

const statusColor: Record<ProductionRequestStatus, string> = {
  draft: 'default',
  approved: 'blue',
  in_progress: 'orange',
  completed: 'green',
  cancelled: 'red'
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  const d = dayjs(value)
  if (!d.isValid()) return '-'
  return d.format('DD MMM YYYY')
}

function RowActions({ record }: { record: ProductionRequestAttributes }) {
  const navigate = useNavigate()
  const api = (window.api?.query as { productionRequest?: ProductionRequestApi }).productionRequest

  const deleteMutation = useMutation({
    mutationKey: ['productionRequest', 'delete'],
    mutationFn: (id: number) => {
      const fn = api?.deleteById
      if (!fn) throw new Error('API permintaan produksi tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionRequest', 'list'] })
    }
  })

  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') {
          navigate(`/dashboard/farmasi/production-requests/edit/${record.id}`)
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

export function ProductionRequestTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const api = (window.api?.query as { productionRequest?: ProductionRequestApi }).productionRequest

  const { data, refetch, isError } = useQuery({
    queryKey: ['productionRequest', 'list'],
    queryFn: () => {
      const fn = api?.list
      if (!fn) throw new Error('API permintaan produksi tidak tersedia.')
      return fn()
    }
  })

  useEffect(() => {
    console.log('[UI][ProductionRequestTable] query data', data)
    console.log('[UI][ProductionRequestTable] isError', isError)
  }, [data, isError])

  const filtered = useMemo(() => {
    const source: ProductionRequestAttributes[] = (data?.result as ProductionRequestAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((item) => {
      const code = item.code
      const medicineName = item.medicine?.name ?? ''
      const notes = item.notes ?? ''
      return [code, medicineName, notes].join(' ').toLowerCase().includes(q)
    })
  }, [data?.result, search])

  const columns = [
    {
      title: 'Kode',
      dataIndex: 'code',
      key: 'code'
    },
    {
      title: 'Obat Jadi',
      dataIndex: ['medicine', 'name'],
      key: 'medicine',
      render: (_: unknown, record: ProductionRequestAttributes) => record.medicine?.name ?? '-'
    },
    {
      title: 'Formula',
      dataIndex: ['formula', 'version'],
      key: 'formula',
      render: (_: unknown, record: ProductionRequestAttributes) => record.formula?.version ?? '-'
    },
    {
      title: 'Qty Rencana',
      dataIndex: 'qtyPlanned',
      key: 'qtyPlanned'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: ProductionRequestStatus) => (
        <Tag color={statusColor[value] ?? 'default'}>{statusLabel[value] ?? value}</Tag>
      )
    },
    {
      title: 'Jadwal Mulai',
      dataIndex: 'scheduledStartDate',
      key: 'scheduledStartDate',
      render: (value: string | null | undefined) => formatDate(value)
    },
    {
      title: 'Jadwal Selesai',
      dataIndex: 'scheduledEndDate',
      key: 'scheduledEndDate',
      render: (value: string | null | undefined) => formatDate(value)
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 80,
      align: 'center' as const,
      render: (_: ProductionRequestAttributes, record: ProductionRequestAttributes) => (
        <RowActions record={record} />
      )
    }
  ]

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Permintaan Produksi</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input
          type="text"
          placeholder="Cari kode, obat jadi atau catatan"
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
            onClick={() => navigate('/dashboard/farmasi/production-requests/create')}
          >
            Permintaan Produksi Baru
          </Button>
        </div>
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.message}</div>)}
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

export default ProductionRequestTable
