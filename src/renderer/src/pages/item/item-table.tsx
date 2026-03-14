import {
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MedicineBoxOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { queryClient } from '@renderer/query-client'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { MenuProps } from 'antd'
import {
  Button,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  Tag,
  message,
  Card,
  Spin,
  theme
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'

type ItemKind = 'DEVICE' | 'CONSUMABLE' | 'NUTRITION' | 'GENERAL'

interface PriceRule {
  unitCode: string
  qty: number
  price: number
}

interface ItemAttributes {
  id?: number
  nama: string
  kode: string
  kodeUnit: string
  kfaCode?: string | null
  fhirId?: string | null
  kind?: ItemKind | null
  unit?: { nama?: string; kode?: string } | null
  stock?: number | null
  minimumStock?: number | null
  buyingPrice?: number | null
  sellingPrice?: number | null
  buyPriceRules?: PriceRule[] | null
  sellPriceRules?: PriceRule[] | null
  itemCategoryId?: number | null
  category?: {
    id?: number
    name?: string | null
  } | null
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

interface ItemCategoryAttributes {
  id?: number
  name?: string
  status?: boolean
  categoryType?: string | null
}

type ItemCategoryListResponse = {
  success: boolean
  result?: ItemCategoryAttributes[]
  message?: string
}

const formatRupiah = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '-'
  const raw = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9-]/g, ''))
  if (!Number.isFinite(raw)) return '-'
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(raw)
  return `Rp ${formatted}`
}

interface UnitPriceDisplay {
  unitCode: string
  value: number
}

const getBaseUnitCodeForItem = (item: ItemAttributes): string | null => {
  const all: { unitCode: string; qty: number }[] = []

  const collect = (rules: PriceRule[] | null | undefined) => {
    if (!Array.isArray(rules)) return
    for (const rule of rules) {
      const unitCodeRaw = typeof rule.unitCode === 'string' ? rule.unitCode : ''
      const unitCode = unitCodeRaw.trim().toUpperCase()
      const qtyRaw = rule.qty
      const qty = typeof qtyRaw === 'number' ? qtyRaw : Number(qtyRaw)
      if (!unitCode) continue
      if (!Number.isFinite(qty) || qty <= 0) continue
      all.push({ unitCode, qty })
    }
  }

  collect(item.buyPriceRules ?? null)
  collect(item.sellPriceRules ?? null)

  if (all.length === 0) {
    const kodeUnitRaw = typeof item.kodeUnit === 'string' ? item.kodeUnit : ''
    const kodeUnit = kodeUnitRaw.trim().toUpperCase()
    return kodeUnit || null
  }

  const sorted = [...all].sort((a, b) => a.qty - b.qty)
  return sorted[0]?.unitCode ?? null
}

const buildUnitPrices = (
  rules: PriceRule[] | null | undefined,
  baseUnitCodeRaw: string | null
): UnitPriceDisplay[] => {
  if (!Array.isArray(rules)) return []
  const baseUnitCode = baseUnitCodeRaw ? baseUnitCodeRaw.trim().toUpperCase() : ''
  const result: UnitPriceDisplay[] = []

  for (const rule of rules) {
    const unitCodeRaw = typeof rule.unitCode === 'string' ? rule.unitCode : ''
    const unitCode = unitCodeRaw.trim().toUpperCase()
    const qtyRaw = rule.qty
    const priceRaw = rule.price
    const qty = typeof qtyRaw === 'number' ? qtyRaw : Number(qtyRaw)
    const price = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw)

    if (!unitCode) continue
    if (!Number.isFinite(price)) continue

    const isBaseUnit = baseUnitCode !== '' && unitCode === baseUnitCode

    if (isBaseUnit) {
      result.push({ unitCode, value: price })
      continue
    }

    if (!Number.isFinite(qty) || qty <= 0) continue
    const unitPrice = price / qty
    if (!Number.isFinite(unitPrice)) continue
    result.push({ unitCode, value: unitPrice })
  }

  return result
}

interface ItemUpdatePayload {
  id: number
  nama: string
  kode: string
  kodeUnit: string
  kfaCode?: string | null
  kind?: ItemKind | null
  minimumStock?: number | null
}

type ItemApi = {
  update: (data: ItemUpdatePayload) => Promise<{
    success: boolean
    result?: ItemAttributes
    message?: string
    error?: string
  }>
}

interface AdjustItemStockResult {
  id?: number
  kode?: string
  stock?: number
}

interface AdjustItemStockArgs {
  itemId: number
  newStock: number
  adjustReason?: string
  note?: string
}

type InventoryStockApi = {
  adjustItemStock: (args: AdjustItemStockArgs) => Promise<{
    success: boolean
    result?: AdjustItemStockResult
    message?: string
    error?: string
  }>
  itemAdjustments: (args?: { itemId?: number }) => Promise<{
    success: boolean
    result?: ItemAdjustmentRow[]
    message?: string
  }>
}

interface ItemAdjustmentRow {
  id: number
  kodeItem: string
  type: number
  qty: number
  batchNumber: string | null
  expiryDate: string | null
  adjustReason: string | null
  note: string | null
  previousStock: number
  newStock: number
  createdAt: string
  createdBy: string | null
  createdByName?: string | null
  updatedAt: string | null
  updatedBy: string | null
}

interface StockAdjustmentFormValues {
  currentStock?: number
  physicalStock?: number
  reason?: string
  note?: string
}

function RowActions({ record }: { record: ItemAttributes }) {
  const navigate = useNavigate()
  const location = useLocation()
  const bpjsOnly = location.pathname.includes('/dashboard/medicine/items-bpjs')
  const [isEditStockOpen, setIsEditStockOpen] = useState(false)
  const [stockForm] = Form.useForm<StockAdjustmentFormValues>()

  const api = (window.api?.query as { item?: ItemApi }).item
  const inventoryApi = (window.api?.query as { inventoryStock?: InventoryStockApi }).inventoryStock
  const [syncingSatusehat, setSyncingSatusehat] = useState(false)

  const updateStockAndMinimumStockMutation = useMutation({
    mutationKey: ['item', 'update', 'stock-and-minimumStock', record.id],
    mutationFn: async (values: StockAdjustmentFormValues) => {
      if (typeof record.id !== 'number') {
        throw new Error('ID item tidak valid.')
      }

      const adjustFn = inventoryApi?.adjustItemStock
      const updateFn = api?.update

      if (!adjustFn) {
        throw new Error('API penyesuaian stok item tidak tersedia.')
      }

      if (!updateFn) {
        throw new Error('API item tidak tersedia.')
      }

      const rawStock = values.physicalStock
      if (rawStock === undefined || rawStock === null || Number.isNaN(rawStock)) {
        throw new Error('Stok baru harus diisi dengan angka yang valid.')
      }

      if (rawStock < 0) {
        throw new Error('Stok baru tidak boleh negatif.')
      }

      const roundedStock = Math.floor(rawStock)

      const normalizedMinimumStock =
        typeof record.minimumStock === 'number' && record.minimumStock >= 0
          ? record.minimumStock
          : null

      const adjustResult = await adjustFn({
        itemId: record.id,
        newStock: roundedStock,
        adjustReason: values.reason,
        note: values.note
      })

      if (!adjustResult?.success) {
        const msg = adjustResult?.message ?? adjustResult?.error ?? 'Gagal memperbarui stok item'
        throw new Error(msg)
      }

      const payload: ItemUpdatePayload = {
        id: record.id,
        nama: record.nama,
        kode: record.kode,
        kodeUnit: record.kodeUnit,
        kind: record.kind ?? null,
        minimumStock: normalizedMinimumStock
      }

      const updateResult = await updateFn(payload)

      if (!updateResult?.success) {
        const msg = updateResult?.message ?? updateResult?.error ?? 'Gagal memperbarui minimum stok'
        throw new Error(msg)
      }

      return { adjustResult, updateResult }
    },
    onSuccess: () => {
      message.success('Stok dan minimum stok berhasil diperbarui')
      queryClient.invalidateQueries({ queryKey: ['item', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['inventoryStock', 'list'] })
      setIsEditStockOpen(false)
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Gagal memperbarui stok dan minimum stok'
      message.error(msg)
    }
  })
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
        if (typeof record.id === 'number') {
          if (bpjsOnly) navigate(`/dashboard/medicine/items-bpjs/edit/${record.id}`)
          else navigate(`/dashboard/medicine/items/edit/${record.id}`)
        }
      }
    },
    {
      key: 'sync-satusehat',
      label: syncingSatusehat ? 'Sinkronisasi Satu Sehat...' : 'Sinkronisasi Satu Sehat',
      icon: <SyncOutlined />,
      disabled: syncingSatusehat,
      onClick: async () => {
        if (typeof record.id !== 'number') return
        const fn = window.api?.query?.item?.syncSatusehat
        if (!fn) {
          message.error('API sinkronisasi tidak tersedia. Silakan refresh/restart aplikasi.')
          return
        }
        setSyncingSatusehat(true)
        try {
          const res = await fn({ id: record.id })
          if (res && (res as { success?: boolean }).success) {
            const msg = (res as { message?: string }).message || ''
            if (msg.toLowerCase().includes('already')) {
              message.info('Sudah tersinkron ke SATUSEHAT')
            } else {
              message.success('Sinkronisasi Satu Sehat berhasil')
            }
            queryClient.invalidateQueries({ queryKey: ['item', 'list'] })
          } else {
            const errMsg =
              (res as { error?: string; message?: string }).error ||
              (res as { error?: string; message?: string }).message ||
              'Sinkronisasi Satu Sehat gagal'
            message.error(errMsg)
          }
        } catch {
          message.error('Sinkronisasi Satu Sehat gagal')
        } finally {
          setSyncingSatusehat(false)
        }
      }
    },
    {
      key: 'edit-stock',
      label: 'Penyesuaian Stok',
      icon: <EditOutlined />,
      onClick: () => {
        const currentStock =
          typeof record.stock === 'number' && Number.isFinite(record.stock) ? record.stock : 0
        stockForm.setFieldsValue({
          currentStock,
          physicalStock: currentStock,
          reason: '',
          note: ''
        })
        setIsEditStockOpen(true)
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
    <>
      <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
        <button
          aria-label="Actions"
          className="p-1 rounded text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <MoreOutlined />
        </button>
      </Dropdown>
      <Modal
        title="Penyesuaian Stok Fisik Item"
        open={isEditStockOpen}
        onCancel={() => {
          if (!updateStockAndMinimumStockMutation.isPending) {
            setIsEditStockOpen(false)
          }
        }}
        onOk={() => {
          stockForm
            .validateFields()
            .then((values) => {
              updateStockAndMinimumStockMutation.mutate(values)
            })
            .catch(() => undefined)
        }}
        confirmLoading={updateStockAndMinimumStockMutation.isPending}
        okText="Simpan"
        cancelText="Batal"
        destroyOnClose
      >
        <Form
          form={stockForm}
          layout="vertical"
          initialValues={{
            currentStock:
              typeof record.stock === 'number' && Number.isFinite(record.stock) ? record.stock : 0,
            physicalStock:
              typeof record.stock === 'number' && Number.isFinite(record.stock) ? record.stock : 0,
            reason: '',
            note: ''
          }}
        >
          <Form.Item label="Stok Sekarang" name="currentStock">
            <InputNumber<number> disabled className="w-full" />
          </Form.Item>
          <Form.Item
            label="Stok Fisik"
            name="physicalStock"
            rules={[
              {
                validator: (_rule, value) => {
                  if (value === undefined || value === null || value === '') {
                    return Promise.reject(new Error('Stok fisik harus diisi'))
                  }
                  if (typeof value !== 'number' || Number.isNaN(value)) {
                    return Promise.reject(new Error('Nilai stok fisik harus berupa angka'))
                  }
                  if (value < 0) {
                    return Promise.reject(new Error('Stok fisik tidak boleh bernilai negatif'))
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <InputNumber<number> min={0} className="w-full" />
          </Form.Item>

          <Form.Item label="Alasan Penyesuaian" name="reason">
            <Select
              placeholder="Pilih alasan"
              options={[
                { value: 'hilang', label: 'Hilang' },
                { value: 'rusak', label: 'Rusak' },
                { value: 'dipakai', label: 'Dipakai' },
                { value: 'lebih', label: 'Lebih' }
              ]}
            />
          </Form.Item>
          <Form.Item label="Catatan" name="note">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export function ItemTable() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const bpjsOnly = location.pathname.includes('/dashboard/medicine/items-bpjs')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyRows, setHistoryRows] = useState<ItemAdjustmentRow[]>([])

  const { data, refetch, isError, isLoading } = useQuery<ItemListResponse>({
    queryKey: ['item', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.item?.list
      if (!fn) throw new Error('API item tidak tersedia.')
      return fn()
    }
  })

  const itemCategoryApi = window.api?.query as
    | { medicineCategory?: { list: () => Promise<ItemCategoryListResponse> } }
    | undefined

  const { data: itemCategorySource } = useQuery<ItemCategoryListResponse>({
    queryKey: ['itemCategory', 'list', 'for-item-table'],
    queryFn: () => {
      const fn = itemCategoryApi?.medicineCategory?.list
      if (!fn) throw new Error('API kategori item tidak tersedia.')
      return fn()
    }
  })

  const categoryMapById = useMemo(() => {
    const map = new Map<number, { name: string; categoryType?: string | null }>()
    const entries: ItemCategoryAttributes[] = Array.isArray(itemCategorySource?.result)
      ? itemCategorySource.result
      : []
    for (const cat of entries) {
      const id = typeof cat.id === 'number' ? cat.id : undefined
      const rawName = typeof cat.name === 'string' ? cat.name : ''
      const name = rawName.trim()
      if (id === undefined || !name) continue
      if (!map.has(id)) {
        map.set(id, { name, categoryType: cat.categoryType ?? null })
      }
    }
    return map
  }, [itemCategorySource?.result])

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
      if (!kodeItem) continue
      if (!stockMap.has(kodeItem)) {
        stockMap.set(kodeItem, value)
      }
    }

    const withStock: ItemAttributes[] = source.map((item) => {
      const key = item.kode.trim().toUpperCase()
      const stockFromInventory = key ? stockMap.get(key) : undefined
      const stockValue = typeof stockFromInventory === 'number' ? stockFromInventory : 0
      return { ...item, stock: stockValue }
    })

    const bySearch = (() => {
      const q = search.trim().toLowerCase()
      if (!q) return withStock
      return withStock.filter((item) => {
        const unitName = item.unit?.nama ?? ''
        const stockText = typeof item.stock === 'number' ? String(item.stock) : ''
        return [item.nama, item.kode, unitName, stockText].join(' ').toLowerCase().includes(q)
      })
    })()

    const isBpjsByNameType = (
      nameRaw: string | null | undefined,
      categoryTypeRaw: string | null | undefined
    ): boolean => {
      const ct = (categoryTypeRaw || '').toLowerCase()
      if (ct === 'bpjs') return true
      const n = (nameRaw || '').toLowerCase()
      if (n.includes('non_bpjs') || n.includes('non bpjs')) return false
      return n.includes('bpjs')
    }
    if (bpjsOnly) {
      return bySearch.filter((item) => {
        const directName = typeof item.category?.name === 'string' ? item.category.name : null
        const catInfo =
          typeof item.itemCategoryId === 'number'
            ? categoryMapById.get(item.itemCategoryId)
            : undefined
        const name = directName ?? catInfo?.name ?? ''
        const categoryType = catInfo?.categoryType ?? null
        return isBpjsByNameType(name, categoryType)
      })
    }
    return bySearch.filter((item) => {
      const directName = typeof item.category?.name === 'string' ? item.category.name : null
      const catInfo =
        typeof item.itemCategoryId === 'number'
          ? categoryMapById.get(item.itemCategoryId)
          : undefined
      const name = directName ?? catInfo?.name ?? ''
      const categoryType = catInfo?.categoryType ?? null
      return !isBpjsByNameType(name, categoryType)
    })
  }, [data?.result, stockData?.result, search, bpjsOnly, categoryMapById])

  const handleOpenHistory = async () => {
    const inventoryApi = (window.api?.query as { inventoryStock?: InventoryStockApi })
      .inventoryStock
    const fn = inventoryApi?.itemAdjustments
    if (!fn) {
      message.error('API history penyesuaian stok tidak tersedia.')
      return
    }
    try {
      setHistoryLoading(true)
      const res = await fn()
      if (!res.success) {
        const msg = res.message ?? 'Gagal mengambil history penyesuaian stok'
        message.error(msg)
        setHistoryRows([])
      } else {
        setHistoryRows(Array.isArray(res.result) ? res.result : [])
        setIsHistoryOpen(true)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengambil history penyesuaian stok'
      message.error(msg)
    } finally {
      setHistoryLoading(false)
    }
  }

  const columns: ColumnsType<ItemAttributes> = [
    {
      title: 'Nama',
      dataIndex: 'nama',
      key: 'nama',
      width: 240,
      render: (text: string) => <span className="item-table-nama-cell">{text}</span>
    },
    { title: 'Kode', dataIndex: 'kode', key: 'kode', width: 120 },
    {
      title: 'Kode KFA',
      dataIndex: 'kfaCode',
      key: 'kfaCode',
      width: 120,
      render: (v: string | null) => v || '-'
    },
    {
      title: 'Satu Sehat',
      dataIndex: 'fhirId',
      key: 'fhirId',
      width: 140,
      render: (v: string | null | undefined) => {
        const ok = typeof v === 'string' && v.trim().length > 0
        return ok ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Tersinkron
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Belum
          </Tag>
        )
      }
    },
    {
      title: 'Stok',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (v: ItemAttributes['stock']) => (typeof v === 'number' ? v : 0)
    },
    {
      title: 'Minimum Stok',
      dataIndex: 'minimumStock',
      key: 'minimumStock',
      width: 140,
      render: (v: ItemAttributes['minimumStock']) => (typeof v === 'number' && v > 0 ? v : '-')
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: (v: ItemAttributes['unit']) => v?.nama || v?.kode || '-'
    },
    {
      title: 'Harga Beli Satuan',
      key: 'buyUnitPrice',
      render: (_: unknown, record: ItemAttributes) => {
        const baseUnitCode = getBaseUnitCodeForItem(record)
        const unitPrices = buildUnitPrices(record.buyPriceRules ?? null, baseUnitCode)
        if (unitPrices.length > 0) {
          return (
            <div className="flex flex-col">
              {unitPrices.map((p) => (
                <span key={`${p.unitCode}-${p.value}`}>
                  {formatRupiah(p.value)} / {p.unitCode}
                </span>
              ))}
            </div>
          )
        }
        const price = record.buyingPrice
        if (typeof price === 'number' && Number.isFinite(price)) {
          const unitLabel = record.kodeUnit || 'PCS'
          return (
            <span>
              {formatRupiah(price)} / {unitLabel}
            </span>
          )
        }
        return '-' as const
      }
    },
    {
      title: 'Harga Jual Satuan',
      key: 'sellUnitPrice',
      render: (_: unknown, record: ItemAttributes) => {
        const baseUnitCode = getBaseUnitCodeForItem(record)
        const unitPrices = buildUnitPrices(record.sellPriceRules ?? null, baseUnitCode)
        if (unitPrices.length > 0) {
          return (
            <div className="flex flex-col">
              {unitPrices.map((p) => (
                <span key={`${p.unitCode}-${p.value}`}>
                  {formatRupiah(p.value)} / {p.unitCode}
                </span>
              ))}
            </div>
          )
        }
        const price = record.sellingPrice
        if (typeof price === 'number' && Number.isFinite(price)) {
          const unitLabel = record.kodeUnit || 'PCS'
          return (
            <span>
              {formatRupiah(price)} / {unitLabel}
            </span>
          )
        }
        return '-' as const
      }
    },
    {
      title: 'Kategori',
      dataIndex: 'itemCategoryId',
      key: 'itemCategoryId',
      render: (_: ItemAttributes['itemCategoryId'], record: ItemAttributes) => {
        const directName =
          typeof record.category?.name === 'string' ? record.category.name.trim() : ''
        if (directName.length > 0) return directName
        const idFromRecord =
          typeof record.itemCategoryId === 'number' ? record.itemCategoryId : undefined
        if (typeof idFromRecord === 'number') {
          const mapped = categoryMapById.get(idFromRecord)?.name
          if (typeof mapped === 'string' && mapped.length > 0) return mapped
        }
        return '-'
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      align: 'center',
      fixed: 'right',
      render: (_: unknown, record: ItemAttributes) => <RowActions record={record} />
    }
  ]

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 1. Header Card */}
      <Card
        styles={{ body: { padding: '20px 24px' } }}
        variant="borderless"
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
        }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <MedicineBoxOutlined style={{ color: token.colorSuccessBg, fontSize: 16 }} />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">Data Master Item</h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Manajemen data obat, alat pelayan kesehatan, bahan medis, dan umum
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
                ghost
              >
                Refresh
              </Button>
              <Button
                icon={<HistoryOutlined />}
                onClick={handleOpenHistory}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
                ghost
              >
                History Penyesuaian
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={() =>
                  bpjsOnly
                    ? navigate('/dashboard/medicine/items-bpjs/create')
                    : navigate('/dashboard/medicine/items/create')
                }
                style={{
                  background: '#fff',
                  borderColor: '#fff',
                  color: token.colorPrimaryActive
                }}
              >
                Tambah
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <MedicineBoxOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {filtered.length}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Total Data
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Search Filter Card */}
      <Card styles={{ body: { padding: '16px 20px' } }} variant="borderless">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Pencarian
            </div>
            <Input
              placeholder="Cari item, kode, satuan..."
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>
        </div>
      </Card>

      {/* 3. Main Data Table Card */}
      <Card className="flex-1 overflow-hidden flex flex-col" variant="borderless">
        <Spin spinning={isLoading}>
          <div className="flex-1" style={{ background: token.colorBgContainer }}>
            {(isError || data?.success === false) && (
              <div style={{ color: token.colorErrorText }} className="p-4">
                {typeof data?.message === 'string' && data.message.length > 0
                  ? data.message
                  : 'Gagal memuat data item'}
              </div>
            )}

            <style>{`
              .item-table-nama-cell {
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
                word-break: break-word;
              }
            `}</style>

            <Modal
              title="History Penyesuaian Stok"
              open={isHistoryOpen}
              onCancel={() => setIsHistoryOpen(false)}
              footer={null}
              width={800}
            >
              <Table
                dataSource={historyRows}
                loading={historyLoading}
                rowKey={(row) => row.id}
                size="small"
                pagination={{ pageSize: 10 }}
                columns={[
                  {
                    title: 'Tanggal',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    render: (value: string) => {
                      const date = new Date(value)
                      if (Number.isNaN(date.getTime())) return value
                      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
                    }
                  },
                  {
                    title: 'Jenis',
                    dataIndex: 'type',
                    key: 'type',
                    render: (value: number) => (value === 1 ? 'Masuk' : 'Keluar')
                  },
                  {
                    title: 'Stok Sebelum',
                    dataIndex: 'previousStock',
                    key: 'previousStock'
                  },
                  {
                    title: 'Stok Adjustment',
                    dataIndex: 'qty',
                    key: 'stockAdjustment',
                    render: (_: number, row: ItemAdjustmentRow) => {
                      const base = typeof row.qty === 'number' ? row.qty : 0
                      const signed = row.type === 1 ? base : -base
                      const colorClass =
                        signed > 0 ? 'text-green-600' : signed < 0 ? 'text-red-600' : ''
                      const label = signed > 0 ? `+${signed}` : signed < 0 ? String(signed) : '0'
                      return <span className={colorClass}>{label}</span>
                    }
                  },
                  {
                    title: 'Stok Sesudah',
                    dataIndex: 'newStock',
                    key: 'newStock'
                  },
                  {
                    title: 'Alasan',
                    dataIndex: 'adjustReason',
                    key: 'adjustReason',
                    render: (value: string | null) => value ?? '-'
                  },
                  {
                    title: 'Catatan',
                    dataIndex: 'note',
                    key: 'note',
                    render: (value: string | null) => value ?? '-'
                  },
                  {
                    title: 'User',
                    dataIndex: 'createdByName',
                    key: 'createdByName',
                    render: (_: string | null, row: ItemAdjustmentRow) => {
                      if (row.createdByName && row.createdByName.length > 0) {
                        return row.createdByName
                      }
                      if (row.createdBy && row.createdBy.length > 0) {
                        return row.createdBy
                      }
                      return '-'
                    }
                  }
                ]}
              />
            </Modal>

            <Table
              dataSource={filtered}
              columns={columns}
              size="middle"
              className="flex-1 h-full"
              rowKey={(r) => String(r.id ?? r.kode)}
              scroll={{ x: 800, y: 'calc(100vh - 460px)' }}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} data`,
                showSizeChanger: true
              }}
            />
          </div>

          <div className="mt-3 text-xs" style={{ color: token.colorTextTertiary }}>
            Catatan: Item selain obat tidak memerlukan sinkronisasi Satu Sehat maupun Kode KFA.
          </div>
        </Spin>
      </Card>
    </div>
  )
}

export default ItemTable
