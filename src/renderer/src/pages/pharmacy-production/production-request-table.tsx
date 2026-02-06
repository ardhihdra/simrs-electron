import { Button, Dropdown, Input, Table, Tag, message } from 'antd'
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
  update: (data: ProductionRequestAttributes & { id: number }) => Promise<{ success: boolean; result?: ProductionRequestAttributes; message?: string }>
}

interface ProductionFormulaItemForCheck {
  rawMaterialId: number
  qty: number
}

interface ProductionFormulaDetailForCheck {
  id?: number
  items?: ProductionFormulaItemForCheck[] | null
}

type ProductionFormulaDetailResponseForCheck = {
  success: boolean
  result?: ProductionFormulaDetailForCheck
  message?: string
}

interface RawMaterialForStockCheck {
  id?: number
  name?: string
  internalCode?: string | null
}

type RawMaterialListResponseForCheck = {
  success: boolean
  result?: RawMaterialForStockCheck[]
  message?: string
}

type ProductionSupportApiForCheck = {
  productionFormula?: {
    getById: (args: { id: number }) => Promise<ProductionFormulaDetailResponseForCheck>
  }
  rawMaterial?: {
    list: () => Promise<RawMaterialListResponseForCheck>
  }
}

interface InventoryStockItemForCheck {
  kodeItem: string
  namaItem: string
  unit: string
  stockIn: number
  stockOut: number
  availableStock: number
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

  const updateStatusMutation = useMutation({
    mutationKey: ['productionRequest', 'updateStatus', record.id],
    mutationFn: (data: ProductionRequestAttributes & { id: number }) => {
      const fn = api?.update
      if (!fn) throw new Error('API permintaan produksi tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionRequest', 'list'] })
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error)
      message.error(msg || 'Gagal memperbarui status permintaan produksi')
    }
  })

  const canStart = record.status === 'approved'
  const canComplete = record.status === 'in_progress'

  const handleStart = () => {
    if (!canStart || typeof record.id !== 'number') return
    const nowIso = new Date().toISOString()
    updateStatusMutation.mutate({
      ...record,
      id: record.id,
      status: 'in_progress',
      actualStartDate: record.actualStartDate ?? nowIso
    })
  }

  const handleComplete = async () => {
    if (!canComplete || typeof record.id !== 'number') return

    const productionFormulaId = record.productionFormulaId
    const qtyPlanned = record.qtyPlanned

    if (typeof productionFormulaId !== 'number' || typeof qtyPlanned !== 'number') {
      message.error('Data formula atau qty rencana tidak lengkap.')
      return
    }

    const supportApi = window.api?.query as ProductionSupportApiForCheck
    const formulaApi = supportApi?.productionFormula
    const rawMaterialApi = supportApi?.rawMaterial

    if (!formulaApi?.getById || !rawMaterialApi?.list) {
      message.error('API formula produksi atau bahan baku tidak tersedia.')
      return
    }

    let formulaDetail: ProductionFormulaDetailForCheck | undefined

    try {
      const res = await formulaApi.getById({ id: productionFormulaId })
      if (!res.success || !res.result) {
        message.error(res.message || 'Gagal mengambil formula produksi.')
        return
      }
      formulaDetail = res.result
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      message.error(errorMessage || 'Gagal mengambil formula produksi.')
      return
    }

    const items: ProductionFormulaItemForCheck[] = Array.isArray(formulaDetail.items)
      ? formulaDetail.items
      : []

    if (items.length === 0) {
      message.error('Formula produksi belum memiliki komposisi bahan.')
      return
    }

    let rawMaterials: RawMaterialForStockCheck[] = []

    try {
      const rawRes = await rawMaterialApi.list()
      if (!rawRes.success || !Array.isArray(rawRes.result)) {
        message.error(rawRes.message || 'Gagal mengambil data bahan baku.')
        return
      }
      rawMaterials = rawRes.result
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      message.error(errorMessage || 'Gagal mengambil data bahan baku.')
      return
    }

    let inventoryStockMap = new Map<string, number>()

    try {
      const inventoryApi = window.api?.query as {
        inventoryStock?: {
          list: (args?: { itemType?: 'item' | 'substance' | 'medicine' }) => Promise<{
            success: boolean
            result?: InventoryStockItemForCheck[]
            message?: string
          }>
        }
      }
      const inventoryFn = inventoryApi?.inventoryStock?.list
      if (!inventoryFn) {
        message.error('API stok inventory tidak tersedia.')
        return
      }

      const inventoryRes = await inventoryFn({ itemType: 'substance' })
      const stockList: InventoryStockItemForCheck[] = Array.isArray(inventoryRes.result)
        ? inventoryRes.result
        : []

      inventoryStockMap = new Map<string, number>()
      stockList.forEach((stockItem) => {
        const kode = stockItem.kodeItem.trim().toUpperCase()
        if (!kode) return
        if (!inventoryStockMap.has(kode)) {
          const availableStock =
            typeof stockItem.availableStock === 'number' ? stockItem.availableStock : 0
          inventoryStockMap.set(kode, availableStock)
        }
      })
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      message.error(errorMessage || 'Gagal mengambil data stok inventory bahan baku.')
      return
    }

    for (const item of items) {
      const material = rawMaterials.find((rm) => rm.id === item.rawMaterialId)
      const rawInternalCode = typeof material?.internalCode === 'string' ? material.internalCode : ''
      const kode = rawInternalCode.trim().toUpperCase()

      const stockFromInventory = kode ? inventoryStockMap.get(kode) : undefined
      const stockValue =
        typeof stockFromInventory === 'number'
          ? stockFromInventory
          : 0
      const requiredQty = item.qty * qtyPlanned

      if (stockValue < requiredQty) {
        const name = material?.name || `ID ${item.rawMaterialId}`
        message.error(
          `Stok bahan baku "${name}" tidak cukup. Dibutuhkan ${requiredQty}, stok tersedia ${stockValue}.`
        )
        return
      }
    }

    const nowIso = new Date().toISOString()
    updateStatusMutation.mutate({
      ...record,
      id: record.id,
      status: 'completed',
      actualStartDate: record.actualStartDate ?? nowIso,
      actualEndDate: nowIso
    })
  }

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
    {
      key: 'start',
      label: 'Mulai Produksi',
      disabled: !canStart,
      onClick: handleStart
    },
    {
      key: 'complete',
      label: 'Tandai Selesai',
      disabled: !canComplete,
      onClick: handleComplete
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
      title: 'Mulai Real',
      dataIndex: 'actualStartDate',
      key: 'actualStartDate',
      render: (value: string | null | undefined) => formatDate(value)
    },
    {
      title: 'Selesai Real',
      dataIndex: 'actualEndDate',
      key: 'actualEndDate',
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
