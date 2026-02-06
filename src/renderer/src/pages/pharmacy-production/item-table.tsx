import { Button, Dropdown, Form, Input, InputNumber, Modal, Select, Table, message } from 'antd'
import type { MenuProps } from 'antd'
import { DeleteOutlined, EditOutlined, HistoryOutlined, MoreOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import GenericTable from '@renderer/components/GenericTable'
import { queryClient } from '@renderer/query-client'

type ItemKind = 'DEVICE' | 'CONSUMABLE' | 'NUTRITION' | 'GENERAL'

interface PriceRule {
	unitCode: string
	qty: number
	price: number
}

interface ItemCategoryAttributes {
	id?: number
	name?: string | null
}

interface ItemAttributes {
	id?: number
	nama: string
	kode: string
	kodeUnit: string
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

type ItemCategoryListResponse = {
	success: boolean
	result?: ItemCategoryAttributes[]
	message?: string
}

const kindLabels: Record<ItemKind, string> = {
  DEVICE: 'Alat Kesehatan',
  CONSUMABLE: 'BMHP / Habis Pakai',
  NUTRITION: 'Makanan / Minuman',
  GENERAL: 'Barang Umum'
}

const formatRupiah = (value: number | string | null | undefined): string => {
	if (value === null || value === undefined) return '-'
	const raw =
		typeof value === 'number' ? value : Number(String(value).replace(/[^0-9-]/g, ''))
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
  const [isEditStockOpen, setIsEditStockOpen] = useState(false)
	const [stockForm] = Form.useForm<StockAdjustmentFormValues>()

  const api = (window.api?.query as { item?: ItemApi }).item
  const inventoryApi = (window.api?.query as { inventoryStock?: InventoryStockApi })
    .inventoryStock

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
        if (typeof record.id === 'number') navigate(`/dashboard/farmasi/items/edit/${record.id}`)
      }
    },
    {
      key: 'edit-stock',
      label: 'Penyesuaian Stok',
      icon: <EditOutlined />,
      onClick: () => {
        const currentStock =
          typeof record.stock === 'number' && Number.isFinite(record.stock)
            ? record.stock
            : 0
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
        <Button type="text" icon={<MoreOutlined />} />
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
			  typeof record.stock === 'number' && Number.isFinite(record.stock)
				? record.stock
				: 0,
			physicalStock:
			  typeof record.stock === 'number' && Number.isFinite(record.stock)
				? record.stock
				: 0,
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
					return Promise.reject(
					  new Error('Stok fisik tidak boleh bernilai negatif')
					)
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
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
	const [isHistoryOpen, setIsHistoryOpen] = useState(false)
	const [historyLoading, setHistoryLoading] = useState(false)
	const [historyRows, setHistoryRows] = useState<ItemAdjustmentRow[]>([])

  const { data, refetch, isError } = useQuery<ItemListResponse>({
    queryKey: ['item', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.item?.list
      if (!fn) throw new Error('API item tidak tersedia.')
      return fn()
    }
  })

	const { data: categorySource } = useQuery<ItemCategoryListResponse>({
		queryKey: ['itemCategory', 'list', 'for-item-table'],
		queryFn: () => {
			const api = window.api?.query as {
				medicineCategory?: { list: () => Promise<ItemCategoryListResponse> }
			}
			const fn = api.medicineCategory?.list
			if (!fn) throw new Error('API kategori item tidak tersedia.')
			return fn()
		}
	})

	const itemCategoryNameById = useMemo(() => {
		const entries: ItemCategoryAttributes[] = Array.isArray(categorySource?.result)
			? categorySource.result
			: []
		const map = new Map<number, string>()
		for (const cat of entries) {
			if (typeof cat.id !== 'number') continue
			const rawName = typeof cat.name === 'string' ? cat.name : ''
			const name = rawName.trim()
			if (!name) continue
			map.set(cat.id, name)
		}
		return map
	}, [categorySource?.result])

  const { data: stockData } = useQuery<InventoryStockResponse>({
    queryKey: ['inventoryStock', 'list'],
    queryFn: () => {
      const api = (window.api?.query as {
        inventoryStock?: { list: () => Promise<InventoryStockResponse> }
      }).inventoryStock
      const fn = api?.list
      if (!fn) throw new Error('API stok inventory tidak tersedia.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: ItemAttributes[] = Array.isArray(data?.result) ? data.result : []
    const stockList: InventoryStockItem[] = Array.isArray(stockData?.result)
      ? stockData.result
      : []

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

    const q = search.trim().toLowerCase()
    if (!q) return withStock
    return withStock.filter((item) => {
      const unitName = item.unit?.nama ?? ''
      const stockText = typeof item.stock === 'number' ? String(item.stock) : ''
      return [item.nama, item.kode, unitName, stockText]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [data?.result, stockData?.result, search])

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
				<Button icon={<HistoryOutlined />} onClick={handleOpenHistory}>
					History Penyesuaian
				</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/farmasi/items/create')}>
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
									const label =
										signed > 0 ? `+${signed}` : signed < 0 ? String(signed) : '0'
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
              title: 'Minimum Stok',
              dataIndex: 'minimumStock',
              key: 'minimumStock',
              width: 140,
              render: (v: ItemAttributes['minimumStock']) =>
                typeof v === 'number' && v > 0 ? v : '-'
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
	                 typeof record.category?.name === 'string'
	                   ? record.category.name.trim()
	                   : ''

	               if (directName.length > 0) {
	                 return directName
	               }

	               const idFromRecord =
	                 typeof record.itemCategoryId === 'number' ? record.itemCategoryId : undefined
	               if (typeof idFromRecord === 'number') {
	                 const mapped = itemCategoryNameById.get(idFromRecord)
	                 if (typeof mapped === 'string' && mapped.length > 0) {
	                   return mapped
	                 }
	               }

	               return '-'
	             }
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
