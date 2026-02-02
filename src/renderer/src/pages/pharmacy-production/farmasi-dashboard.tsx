import { Button, Card, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'

type MaterialType = 'active' | 'excipient' | 'solvent'

interface RawMaterialAttributes {
	id?: number
	name: string
	materialType: MaterialType
	stock?: number
	minimumStock?: number | null
}

interface RawMaterialListResponse {
	success: boolean
	result?: RawMaterialAttributes[]
	message?: string
}

type ItemKind = 'DEVICE' | 'CONSUMABLE' | 'NUTRITION' | 'GENERAL'

interface ItemAttributes {
	id?: number
	nama: string
	kode: string
	kind?: ItemKind | null
	stock?: number
}

interface ItemListResponse {
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

interface InventoryStockResponse {
	success: boolean
	result?: InventoryStockItem[]
	message?: string
}

interface InventoryExpiryItem {
	kodeItem: string
	namaItem: string
	unit: string
	availableStock: number
	earliestExpiryDate: string
}

interface InventoryExpiryResponse {
	success: boolean
	result?: InventoryExpiryItem[]
	message?: string
}

interface StockSummaryRow {
	key: string
	name: string
	stock: number
	expiryDate?: string
}

interface MaterialTypeSummaryRow {
	key: string
	materialType: string
	count: number
	totalStock: number
}

interface ItemKindSummaryRow {
	key: string
	kindLabel: string
	count: number
	totalStock: number
}

const materialTypeLabels: Record<MaterialType, string> = {
	active: 'Aktif',
	excipient: 'Eksipien',
	solvent: 'Solvent'
}

const itemKindLabels: Record<ItemKind, string> = {
	DEVICE: 'Alat Kesehatan',
	CONSUMABLE: 'BMHP / Habis Pakai',
	NUTRITION: 'Makanan / Minuman',
	GENERAL: 'Barang Umum'
}

function FarmasiDashboard() {
	const navigate = useNavigate()

	const { data: rawMaterialData } = useQuery<RawMaterialListResponse>({
		queryKey: ['rawMaterial', 'list', 'dashboard'],
		queryFn: async () => {
			const api = window.api?.query as {
				rawMaterial?: {
					list: () => Promise<RawMaterialListResponse>
				}
			}
			const fn = api?.rawMaterial?.list
			if (!fn) {
				throw new Error('API bahan baku tidak tersedia.')
			}
			return fn()
		}
	})

	const { data: itemData } = useQuery<ItemListResponse>({
		queryKey: ['item', 'list', 'dashboard'],
		queryFn: async () => {
			const fn = window.api?.query?.item?.list
			if (!fn) {
				throw new Error('API item tidak tersedia.')
			}
			return fn()
		}
	})

	const { data: inventoryStockData } = useQuery<InventoryStockResponse>({
		queryKey: ['inventoryStock', 'list', 'dashboard'],
		queryFn: async () => {
			const inventoryApi = window.api?.query as {
				inventoryStock?: { list: () => Promise<InventoryStockResponse> }
			}
			const fn = inventoryApi.inventoryStock?.list
			if (!fn) {
				throw new Error('API stok inventory tidak tersedia.')
			}
			return fn()
		}
	})

	const { data: rawMaterialExpiryData } = useQuery<InventoryExpiryResponse>({
		queryKey: ['inventoryStock', 'expiry', 'raw-material'],
		queryFn: async () => {
			const inventoryApi = window.api?.query?.inventoryStock as
				| {
						list?: (args?: { itemType?: 'item' | 'substance' | 'medicine' }) => Promise<InventoryStockResponse>
						expirySummary?: (args?: {
							itemType?: 'item' | 'substance' | 'medicine'
							limit?: number
						}) => Promise<InventoryExpiryResponse>
				  }
				| undefined
			const fn = inventoryApi?.expirySummary
			if (!fn) {
				throw new Error('API ringkasan expired stok bahan baku tidak tersedia.')
			}
			return fn({ itemType: 'substance', limit: 20 })
		}
	})

	const { data: itemExpiryData } = useQuery<InventoryExpiryResponse>({
		queryKey: ['inventoryStock', 'expiry', 'item'],
		queryFn: async () => {
			const inventoryApi = window.api?.query?.inventoryStock as
				| {
						list?: (args?: { itemType?: 'item' | 'substance' | 'medicine' }) => Promise<InventoryStockResponse>
						expirySummary?: (args?: {
							itemType?: 'item' | 'substance' | 'medicine'
							limit?: number
						}) => Promise<InventoryExpiryResponse>
				  }
				| undefined
			const fn = inventoryApi?.expirySummary
			if (!fn) {
				throw new Error('API ringkasan expired stok item tidak tersedia.')
			}
			return fn({ itemType: 'item', limit: 20 })
		}
	})

	const rawMaterials: RawMaterialAttributes[] = useMemo(() => {
		return Array.isArray(rawMaterialData?.result) ? rawMaterialData.result ?? [] : []
	}, [rawMaterialData?.result])

	const items: ItemAttributes[] = useMemo(() => {
		const baseItems: ItemAttributes[] = Array.isArray(itemData?.result) ? itemData.result ?? [] : []
		const stockList: InventoryStockItem[] = Array.isArray(inventoryStockData?.result)
			? inventoryStockData.result ?? []
			: []

		const stockMap = new Map<string, InventoryStockItem>()
		stockList.forEach((stockItem) => {
			const kodeItem = stockItem.kodeItem.trim().toUpperCase()
			if (!stockMap.has(kodeItem)) {
				stockMap.set(kodeItem, stockItem)
			}
		})

		return baseItems.map((item) => {
			const key = item.kode.trim().toUpperCase()
			const stockEntry = stockMap.get(key)
			const stockValue = typeof stockEntry?.availableStock === 'number' ? stockEntry.availableStock : item.stock
			return { ...item, stock: stockValue }
		})
	}, [itemData?.result, inventoryStockData?.result])

	const rawMaterialStats = useMemo(() => {
		let total = 0
		let totalStock = 0
		let lowStock = 0
		let zeroStock = 0

		rawMaterials.forEach((rm) => {
			const stockValue = typeof rm.stock === 'number' ? rm.stock : 0
			const minimumStockValue =
				typeof rm.minimumStock === 'number' && rm.minimumStock > 0
					? rm.minimumStock
					: 50
			total += 1
			totalStock += stockValue
			if (stockValue === 0) zeroStock += 1
			else if (stockValue > 0 && stockValue <= minimumStockValue) lowStock += 1
		})

		return { total, totalStock, lowStock, zeroStock }
	}, [rawMaterials])

	const itemStats = useMemo(() => {
		let total = 0
		let totalStock = 0
		let zeroStock = 0
		let totalStockUsed = 0

		items.forEach((it) => {
			const stockValue = typeof it.stock === 'number' ? it.stock : 0
			total += 1
			totalStock += stockValue
			if (stockValue === 0) {
				zeroStock += 1
			}
		})

		const stockList: InventoryStockItem[] = Array.isArray(inventoryStockData?.result)
			? inventoryStockData.result ?? []
			: []

		stockList.forEach((stockItem) => {
			const usedValue = typeof stockItem.stockOut === 'number' ? stockItem.stockOut : 0
			totalStockUsed += usedValue
		})

		return { total, totalStock, zeroStock, totalStockUsed }
	}, [items, inventoryStockData?.result])

	const materialTypeSummary = useMemo<MaterialTypeSummaryRow[]>(() => {
		const map = new Map<MaterialType, { count: number; totalStock: number }>()

		rawMaterials.forEach((rm) => {
			const key = rm.materialType
			const stockValue = typeof rm.stock === 'number' ? rm.stock : 0
			const prev = map.get(key) ?? { count: 0, totalStock: 0 }
			map.set(key, {
				count: prev.count + 1,
				totalStock: prev.totalStock + stockValue
			})
		})

		const rows: MaterialTypeSummaryRow[] = []
		map.forEach((value, key) => {
			rows.push({
				key,
				materialType: materialTypeLabels[key],
				count: value.count,
				totalStock: value.totalStock
			})
		})

		return rows
	}, [rawMaterials])

	const itemKindSummary = useMemo<ItemKindSummaryRow[]>(() => {
		const map = new Map<ItemKind, { count: number; totalStock: number }>()

		items.forEach((it) => {
			if (!it.kind) return
			const key = it.kind
			const stockValue = typeof it.stock === 'number' ? it.stock : 0
			const prev = map.get(key) ?? { count: 0, totalStock: 0 }
			map.set(key, {
				count: prev.count + 1,
				totalStock: prev.totalStock + stockValue
			})
		})

		const rows: ItemKindSummaryRow[] = []
		map.forEach((value, key) => {
			rows.push({
				key,
				kindLabel: itemKindLabels[key],
				count: value.count,
				totalStock: value.totalStock
			})
		})

		return rows
	}, [items])

	const lowStockMaterials = useMemo<StockSummaryRow[]>(() => {
		const withThreshold = rawMaterials.map((rm) => {
			const stockValue = typeof rm.stock === 'number' ? rm.stock : 0
			const minimumStockValue =
				typeof rm.minimumStock === 'number' && rm.minimumStock > 0
					? rm.minimumStock
					: 50
			return {
				key: String(rm.id ?? rm.name),
				name: rm.name,
				stock: stockValue,
				threshold: minimumStockValue
			}
		})

		const filtered = withThreshold
			.filter((row) => row.stock > 0 && row.stock <= row.threshold)
			.sort((a, b) => a.stock - b.stock)
			.slice(0, 10)

		return filtered.map((row) => ({ key: row.key, name: row.name, stock: row.stock }))
	}, [rawMaterials])

	const itemStockRows = useMemo<StockSummaryRow[]>(() => {
		return items
			.map((it) => ({
				key: String(it.id ?? it.kode),
				name: it.nama,
				stock: typeof it.stock === 'number' ? it.stock : 0
			}))
			.sort((a, b) => b.stock - a.stock)
			.slice(0, 10)
	}, [items])

	const rawMaterialExpiryRows = useMemo(() => {
		const list: InventoryExpiryItem[] = Array.isArray(rawMaterialExpiryData?.result)
			? rawMaterialExpiryData.result ?? []
			: []

		return list.map((item): StockSummaryRow => ({
			key: item.kodeItem,
			name: `${item.namaItem} (${item.unit})`,
			stock: item.availableStock,
			expiryDate: item.earliestExpiryDate
		}))
	}, [rawMaterialExpiryData?.result])

	const itemExpiryRows = useMemo(() => {
		const list: InventoryExpiryItem[] = Array.isArray(itemExpiryData?.result)
			? itemExpiryData.result ?? []
			: []

		return list.map((item): StockSummaryRow => ({
			key: item.kodeItem,
			name: `${item.namaItem} (${item.unit})`,
			stock: item.availableStock,
			expiryDate: item.earliestExpiryDate
		}))
	}, [itemExpiryData?.result])

	const stockColumns: ColumnsType<StockSummaryRow> = [
		{ title: 'Nama', dataIndex: 'name', key: 'name' },
		{ title: 'Stok', dataIndex: 'stock', key: 'stock' }
	]

	const expiryColumns: ColumnsType<StockSummaryRow> = [
		{ title: 'Nama', dataIndex: 'name', key: 'name' },
		{ title: 'Expired', dataIndex: 'expiryDate', key: 'expiryDate' },
		{ title: 'Stok', dataIndex: 'stock', key: 'stock' }
	]

	const materialTypeColumns: ColumnsType<MaterialTypeSummaryRow> = [
		{ title: 'Tipe', dataIndex: 'materialType', key: 'materialType' },
		{ title: 'Jumlah Bahan', dataIndex: 'count', key: 'count' },
		{ title: 'Total Stok', dataIndex: 'totalStock', key: 'totalStock' }
	]

	const itemKindColumns: ColumnsType<ItemKindSummaryRow> = [
		{ title: 'Kategori', dataIndex: 'kindLabel', key: 'kindLabel' },
		{ title: 'Jumlah Item', dataIndex: 'count', key: 'count' },
		{ title: 'Total Stok', dataIndex: 'totalStock', key: 'totalStock' }
	]

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between flex-wrap gap-3">
				<h2 className="text-3xl font-bold">Dashboard Farmasi (Produksi)</h2>
				<div className="flex gap-2 flex-wrap">
					<Button onClick={() => navigate('/dashboard/farmasi/raw-materials')}>
						Data Bahan Baku
					</Button>
					<Button onClick={() => navigate('/dashboard/farmasi/items')}>
						Data Item
					</Button>
					<Button onClick={() => navigate('/dashboard/farmasi/production-requests')}>
						Permintaan Produksi
					</Button>
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<div className="text-sm text-gray-500">Total Bahan Baku</div>
					<div className="text-3xl font-bold">{rawMaterialStats.total}</div>
					<div className="text-xs text-gray-500 mt-1">
						Total stok: {rawMaterialStats.totalStock}
					</div>
				</Card>
				<Card>
					<div className="text-sm text-gray-500">Bahan Baku Hampir Habis</div>
					<div className="text-3xl font-bold">{rawMaterialStats.lowStock}</div>
					<div className="text-xs text-gray-500 mt-1">Stok &gt; 0 dan ≤ 50</div>
				</Card>
				<Card>
					<div className="text-sm text-gray-500">Bahan Baku Stok 0</div>
					<div className="text-3xl font-bold">{rawMaterialStats.zeroStock}</div>
				</Card>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<div className="text-sm text-gray-500">Total Item</div>
					<div className="text-3xl font-bold">{itemStats.total}</div>
					<div className="text-xs text-gray-500 mt-1">
						Total stok: {itemStats.totalStock}
					</div>
				</Card>
				<Card>
					<div className="text-sm text-gray-500">Item Stok 0</div>
					<div className="text-3xl font-bold">{itemStats.zeroStock}</div>
				</Card>
				<Card>
					<div className="text-sm text-gray-500">Stok Item Digunakan</div>
					<div className="text-3xl font-bold">{itemStats.totalStockUsed}</div>
				</Card>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card title="Ringkasan Bahan Baku per Tipe">
					<Table<MaterialTypeSummaryRow>
						dataSource={materialTypeSummary}
						columns={materialTypeColumns}
						pagination={false}
						rowKey="key"
						size="small"
					/>
				</Card>
				<Card title="Ringkasan Item per Kategori">
					<Table<ItemKindSummaryRow>
						dataSource={itemKindSummary}
						columns={itemKindColumns}
						pagination={false}
						rowKey="key"
						size="small"
					/>
				</Card>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card title="Top 10 Bahan Baku Hampir Habis">
					<Table<StockSummaryRow>
						dataSource={lowStockMaterials}
						columns={stockColumns}
						pagination={false}
						rowKey="key"
						size="small"
					/>
				</Card>
				<Card title="Top 10 Item dengan Stok Terbanyak">
					<Table<StockSummaryRow>
						dataSource={itemStockRows}
						columns={stockColumns}
						pagination={false}
						rowKey="key"
						size="small"
					/>
				</Card>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card title="Top Expired Terdekat - Bahan Baku">
					<Table<StockSummaryRow>
						dataSource={rawMaterialExpiryRows}
						columns={expiryColumns}
						pagination={false}
						rowKey="key"
						size="small"
					/>
				</Card>
				<Card title="Top Expired Terdekat - Item">
					<Table<StockSummaryRow>
						dataSource={itemExpiryRows}
						columns={expiryColumns}
						pagination={false}
						rowKey="key"
						size="small"
					/>
				</Card>
			</div>
		</div>
	)
}

export default FarmasiDashboard
