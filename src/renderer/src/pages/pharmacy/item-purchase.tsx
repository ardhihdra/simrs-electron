import { useMemo, useState } from 'react'
import { Button, Card, Input, InputNumber, Modal, Radio, Select, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface PriceRule {
	unitCode: string
	qty: number
	price: number
}

interface ItemLookup {
	id: number
	kode: string
	nama: string
	kodeUnit: string
	itemCategoryId?: number | null
	sellingPrice: number | null
	sellPriceRules?: PriceRule[] | null
	categoryName?: string | null
	currentStock?: number | null
}

interface ItemListResponse {
	success: boolean
	result?: ItemLookup[]
	message?: string
}

interface ItemCategoryAttributes {
	id?: number
	name: string
	status?: boolean
}

interface ItemCategoryListResponse {
	success: boolean
	result?: ItemCategoryAttributes[]
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

interface PurchaseItemRow {
	key: string
	kode: string
	nama: string
	harga: number
	qty: number
	satuan: string
	subTotal: number
}

interface ItemApi {
	list: () => Promise<ItemListResponse>
}

const formatRupiah = (value: number | null | undefined): string => {
	const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0
	}).format(safe)
}

const generateFakturNumber = (): string => {
	const now = new Date()
	const pad = (n: number, len: number): string => n.toString().padStart(len, '0')
	const parts = [
		pad(now.getFullYear() % 100, 2),
		pad(now.getMonth() + 1, 2),
		pad(now.getDate(), 2),
		pad(now.getHours(), 2),
		pad(now.getMinutes(), 2),
		pad(now.getSeconds(), 2)
	]
	return `PJ.${parts.join('')}`
}

function ItemPurchasePage() {
	const [jumlah, setJumlah] = useState<number>(1)
	const [rows, setRows] = useState<PurchaseItemRow[]>([])
	const [selectedItem, setSelectedItem] = useState<ItemLookup | null>(null)
	const [isSearchOpen, setIsSearchOpen] = useState(false)
	const [searchKeyword, setSearchKeyword] = useState('')
	const [itemList, setItemList] = useState<ItemLookup[]>([])
	const [isLoadingItems, setIsLoadingItems] = useState(false)
	const [selectedPriceRule, setSelectedPriceRule] = useState<PriceRule | null>(null)
	const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
	const [fakturNumber] = useState<string>(() => generateFakturNumber())
	const [isPaymentOpen, setIsPaymentOpen] = useState(false)
	const [paymentMethod, setPaymentMethod] = useState<'cash' | 'noncash'>('cash')
	const [compoundingFee, setCompoundingFee] = useState<number>(0)
	const [otherFee, setOtherFee] = useState<number>(0)
	const [discountPercent, setDiscountPercent] = useState<number>(0)
	const [taxPercent, setTaxPercent] = useState<number>(0)
	const [paidAmount, setPaidAmount] = useState<number>(0)

	const paymentMethodForBackend: 'CASH' | 'NONCASH' | 'CREDIT' = paymentMethod === 'cash' ? 'CASH' : 'NONCASH'

	const total = useMemo(() => {
		return rows.reduce((sum, row) => sum + row.subTotal, 0)
	}, [rows])

	const paymentSummary = useMemo(() => {
		const base = total + compoundingFee + otherFee
		const safeBase = Number.isFinite(base) && base > 0 ? base : 0
		const safeDiscount = Number.isFinite(discountPercent) && discountPercent > 0 ? discountPercent : 0
		const safeTax = Number.isFinite(taxPercent) && taxPercent > 0 ? taxPercent : 0
		const discountValue = (safeBase * safeDiscount) / 100
		const taxValue = (safeBase * safeTax) / 100
		const grandTotal = safeBase - discountValue + taxValue
		const safePaid = Number.isFinite(paidAmount) && paidAmount > 0 ? paidAmount : 0
		const change = safePaid - grandTotal
		return {
			base: safeBase,
			discountValue,
			taxValue,
			grandTotal,
			change: change > 0 ? change : 0
		}
	}, [total, compoundingFee, otherFee, discountPercent, taxPercent, paidAmount])

	const handleOpenSearch = async () => {
		try {
			setIsLoadingItems(true)
			const api = (window.api?.query as { item?: ItemApi })?.item
			const categoryApi = (window.api?.query as {
				medicineCategory?: {
					list: () => Promise<ItemCategoryListResponse>
				}
			}).medicineCategory
			const inventoryApi = window.api?.query as {
				inventoryStock?: {
					list: (args?: { itemType?: 'item' | 'substance' | 'medicine' }) => Promise<InventoryStockResponse>
				}
			}
			if (!api || typeof api.list !== 'function') {
				message.error('API master item tidak tersedia.')
				return
			}
			const res = await api.list()
			if (!res.success) {
				message.error(res.message || 'Gagal mengambil data item')
				return
			}

			let categoryMap = new Map<number, string>()
			if (categoryApi && typeof categoryApi.list === 'function') {
				try {
					const categoryRes = await categoryApi.list()
					const categoryList: ItemCategoryAttributes[] = Array.isArray(categoryRes.result)
						? categoryRes.result
						: []
					for (const cat of categoryList) {
						const id = typeof cat.id === 'number' ? cat.id : undefined
						const name = cat.name
						if (id === undefined) continue
						if (!name || name.trim().length === 0) continue
						categoryMap.set(id, name)
					}
				} catch {
					categoryMap = new Map<number, string>()
				}
			}

			let stockMap = new Map<string, number>()
			if (inventoryApi && inventoryApi.inventoryStock && typeof inventoryApi.inventoryStock.list === 'function') {
				try {
					const stockRes = await inventoryApi.inventoryStock.list({ itemType: 'item' })
					const stockList: InventoryStockItem[] = Array.isArray(stockRes.result)
						? stockRes.result ?? []
						: []
					stockMap = new Map<string, number>()
					for (const stockItem of stockList) {
						const kodeItem = stockItem.kodeItem.trim().toUpperCase()
						if (!kodeItem) continue
						if (!stockMap.has(kodeItem)) {
							const value = typeof stockItem.availableStock === 'number' && Number.isFinite(stockItem.availableStock)
								? stockItem.availableStock
								: 0
							stockMap.set(kodeItem, value)
						}
					}
				} catch {
					stockMap = new Map<string, number>()
				}
			}

			const rawList: ItemLookup[] = Array.isArray(res.result) ? (res.result as ItemLookup[]) : []
			const safeList: ItemLookup[] = rawList.map((item) => {
				const rawCategoryId = (item as { itemCategoryId?: number | null }).itemCategoryId
				const itemCategoryId = typeof rawCategoryId === 'number' ? rawCategoryId : null
				const directCategoryName =
					item &&
					typeof (item as { categoryName?: string | null; category?: { name?: string | null } | null }).categoryName === 'string'
						? (item as { categoryName?: string | null }).categoryName
						: (item as { category?: { name?: string | null } | null }).category &&
								typeof (item as { category?: { name?: string | null } | null }).category?.name === 'string'
									? (item as { category?: { name?: string | null } | null }).category?.name ?? null
									: null
				const categoryNameFromMap = itemCategoryId !== null ? categoryMap.get(itemCategoryId) ?? null : null
				const finalCategoryName =
					categoryNameFromMap && categoryNameFromMap.trim().length > 0
						? categoryNameFromMap
						: directCategoryName

				const kodeText = String(item.kode ?? '')
				const kodeUpper = kodeText.trim().toUpperCase()
				const stockValue = kodeUpper && stockMap.size > 0 ? stockMap.get(kodeUpper) ?? null : null
				return {
					id: Number(item.id),
					kode: kodeText,
					nama: String(item.nama ?? ''),
					kodeUnit: String(item.kodeUnit ?? ''),
					itemCategoryId,
					sellingPrice:
						typeof item.sellingPrice === 'number' && Number.isFinite(item.sellingPrice)
							? item.sellingPrice
							: null,
					sellPriceRules: Array.isArray((item as ItemLookup).sellPriceRules)
						? (item as ItemLookup).sellPriceRules
						: undefined,
					categoryName: finalCategoryName,
					currentStock:
						typeof stockValue === 'number' && Number.isFinite(stockValue) && stockValue >= 0
							? stockValue
							: null
				}
			})
			setItemList(safeList)
			setIsSearchOpen(true)
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err)
			message.error(msg || 'Terjadi kesalahan saat mengambil data item')
		} finally {
			setIsLoadingItems(false)
		}
	}

	const filteredItemList = useMemo(() => {
		const q = searchKeyword.trim().toLowerCase()
		let base = itemList
		if (categoryFilter !== 'ALL') {
			const target = categoryFilter.trim().toLowerCase()
			base = base.filter((item) => {
				const name = (item.categoryName ?? '').trim().toLowerCase()
				return name === target
			})
		}
		if (!q) return base
		return base.filter((item) => {
			const kode = item.kode.toLowerCase()
			const nama = item.nama.toLowerCase()
			return kode.includes(q) || nama.includes(q)
		})
	}, [itemList, searchKeyword, categoryFilter])

	const handleSelectItem = (record: ItemLookup) => {
		setSelectedItem(record)
		setSelectedPriceRule(null)
		setIsSearchOpen(false)
	}

	const handleTambah = () => {
		if (!selectedItem) {
			message.warning('Silakan pilih Kode Barang terlebih dahulu.')
			return
		}
		const effectivePriceRule = selectedPriceRule
		const rawHarga = effectivePriceRule?.price ?? selectedItem.sellingPrice
		if (rawHarga === null || rawHarga === undefined || !Number.isFinite(rawHarga)) {
			message.warning('Silakan pilih harga jual terlebih dahulu.')
			return
		}
		const safeQty = Number.isFinite(jumlah) && jumlah > 0 ? jumlah : 1
		const harga = rawHarga
		const subTotal = harga * safeQty
		const kode = selectedItem.kode.trim().toUpperCase()
		const nama = selectedItem.nama
		const baseUnitCode =
			effectivePriceRule && typeof effectivePriceRule.unitCode === 'string'
				? effectivePriceRule.unitCode.trim().toUpperCase()
				: selectedItem.kodeUnit || 'PCS'
		const satuan = baseUnitCode
		const rowKey = `${kode}__${satuan}`

		setRows((prev) => {
			const existingIndex = prev.findIndex((row) => row.kode === kode && row.satuan === satuan)
			if (existingIndex >= 0) {
				const updated = [...prev]
				const existing = updated[existingIndex]
				const newQty = existing.qty + safeQty
				updated[existingIndex] = {
					...existing,
					qty: newQty,
					subTotal: newQty * harga
				}
				return updated
			}
			return [
				...prev,
				{
					key: rowKey,
					kode,
					nama,
					harga,
					qty: safeQty,
					satuan,
					subTotal
				}
			]
		})
	}

	const handleRemoveRow = (key: string) => {
		setRows((prev) => prev.filter((row) => row.key !== key))
	}

	const handleSelesai = () => {
		if (rows.length === 0) {
			message.warning('Belum ada item yang ditambahkan.')
			return
		}
		setIsPaymentOpen(true)
	}

	const columns: ColumnsType<PurchaseItemRow> = [
		{ title: 'Kode', dataIndex: 'kode', key: 'kode', width: 120 },
		{ title: 'Nama Barang', dataIndex: 'nama', key: 'nama' },
		{
			title: 'Harga',
			dataIndex: 'harga',
			key: 'harga',
			align: 'right',
			render: (value: number) => formatRupiah(value)
		},
		{
			title: 'Qty',
			dataIndex: 'qty',
			key: 'qty',
			align: 'right'
		},
		{ title: 'Satuan', dataIndex: 'satuan', key: 'satuan', width: 100 },
		{
			title: 'Sub Total',
			dataIndex: 'subTotal',
			key: 'subTotal',
			align: 'right',
			render: (value: number) => formatRupiah(value)
		},
		{
			title: 'Action',
			key: 'action',
			align: 'center',
			width: 80,
			render: (_value, record) => (
				<Button danger type="link" onClick={() => handleRemoveRow(record.key)}>
					Hapus
				</Button>
			)
		}
	]

	const modalColumns: ColumnsType<ItemLookup> = [
		{
			title: 'Kategori Item',
			dataIndex: 'categoryName',
			key: 'categoryName',
			render: (value: string | null | undefined) => (value && value.trim().length > 0 ? value : '-')
		},
		{ title: 'Kode Item', dataIndex: 'kode', key: 'kode', width: 120 },
		{ title: 'Nama Item', dataIndex: 'nama', key: 'nama' },
		{
			title: 'Stok Saat Ini',
			dataIndex: 'currentStock',
			key: 'currentStock',
			align: 'right',
			render: (value: number | null | undefined) => {
				const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 0
				return numeric
			}
		},
		{
			title: 'Action',
			key: 'action',
			align: 'center',
			width: 100,
			render: (_value, record) => (
				<Button type="link" onClick={() => handleSelectItem(record)}>
					Pilih
				</Button>
			)
		}
	]

	return (
		<div className="flex flex-col md:flex-row gap-4">
			<div className="w-full md:w-1/3">
				<Card>
					<div className="space-y-2">
						<div className="flex gap-2 items-center">
							<Input
									placeholder="Kode Barang"
									value={selectedItem?.kode ?? ''}
									readOnly
							/>
							<Button onClick={handleOpenSearch}>Pilih Obat [F1]</Button>
						</div>
						<div>
							<label className="block text-xs text-gray-500 mb-1">Harga Jual Satuan</label>
							<Select
									placeholder={selectedItem ? 'Pilih harga jual' : 'Pilih obat terlebih dahulu'}
									value={selectedPriceRule ? `${selectedPriceRule.unitCode}|${selectedPriceRule.qty}|${selectedPriceRule.price}` : undefined}
									onChange={(value) => {
										const [unitCode, qtyStr, priceStr] = value.split('|')
										const qty = Number(qtyStr)
										const price = Number(priceStr)
										if (!Number.isFinite(qty) || !Number.isFinite(price)) {
											setSelectedPriceRule(null)
											return
										}
										setSelectedPriceRule({ unitCode, qty, price })
									}}
									className="w-full"
									disabled={!selectedItem}
							>
								{selectedItem && Array.isArray(selectedItem.sellPriceRules) && selectedItem.sellPriceRules.length > 0 ? (
									selectedItem.sellPriceRules.map((rule, index) => {
										const unitCode = rule.unitCode.trim().toUpperCase()
										const qty = rule.qty
										const price = rule.price
										const key = `${unitCode}|${qty}|${price}|${index}`
										return (
											<Select.Option key={key} value={`${unitCode}|${qty}|${price}`}>
												{unitCode} - {qty} x {formatRupiah(price)}
											</Select.Option>
										)
									})
								) : selectedItem && selectedItem.sellingPrice !== null ? (
									<Select.Option value={`DEFAULT|1|${selectedItem.sellingPrice}`}>
										Default - {formatRupiah(selectedItem.sellingPrice)}
									</Select.Option>
								) : null}
							</Select>
						</div>
						<div className="flex items-center gap-2">
							<label className="w-24 text-sm">Jumlah</label>
							<InputNumber
									min={1}
									value={jumlah}
									onChange={(value) => {
										const numeric = typeof value === 'number' ? value : Number(value)
										setJumlah(Number.isFinite(numeric) && numeric > 0 ? numeric : 1)
									}}
									className="w-24"
							/>
							<Button type="primary" onClick={handleTambah}>
								Tambah
							</Button>
						</div>
						<div className="flex items-center gap-2">
							<label className="w-24 text-sm">Faktur</label>
							<div className="flex-1 h-8 flex items-center px-2 bg-gray-100 rounded border border-gray-200 text-sm">
								{fakturNumber}
							</div>
						</div>
						<div className="pt-3">
							<Button type="primary" block onClick={handleSelesai}>
								Selesai
							</Button>
						</div>
					</div>
				</Card>
			</div>
			<div className="w-full md:w-2/3 flex flex-col gap-2">
				<Card>
					<div className="flex items-center justify-between">
						<div className="text-3xl font-bold">TOTAL</div>
						<div className="text-4xl font-bold bg-yellow-200 px-4 py-2 rounded">
							{formatRupiah(total)}
						</div>
					</div>
				</Card>
				<Card>
					<Table<PurchaseItemRow>
							columns={columns}
							dataSource={rows}
							pagination={false}
							size="small"
						/>
				</Card>
			</div>
			<Modal
					open={isSearchOpen}
					title="Pilih Barang"
					onCancel={() => setIsSearchOpen(false)}
					footer={null}
					width={800}
			>
				<div className="mb-2 flex gap-2">
					<Input
							placeholder="Cari kode / nama"
							value={searchKeyword}
							onChange={(e) => setSearchKeyword(e.target.value)}
						/>
					<Select
							allowClear
							placeholder="Filter kategori"
							className="w-48"
							value={categoryFilter === 'ALL' ? undefined : categoryFilter}
							onChange={(value) => {
								if (typeof value !== 'string' || value.length === 0) {
									setCategoryFilter('ALL')
									return
								}
								setCategoryFilter(value)
							}}
						>
							{Array.from(
								new Map(
									itemList
										.map((item) => (item.categoryName ?? '').trim())
										.filter((name) => name.length > 0)
										.map((name) => [name.toLowerCase(), name] as [string, string])
									).values()
							).map((name) => (
								<Select.Option key={name} value={name}>
									{name}
								</Select.Option>
							))}
						</Select>
				</div>
				<Table<ItemLookup>
						rowKey={(record) => String(record.id)}
						columns={modalColumns}
						dataSource={filteredItemList}
						loading={isLoadingItems}
						pagination={{ pageSize: 10 }}
						onRow={(record) => ({
							onDoubleClick: () => handleSelectItem(record)
						})}
				/>
			</Modal>
			<Modal
					open={isPaymentOpen}
					title="Bayar"
					width={900}
					onCancel={() => setIsPaymentOpen(false)}
					footer={null}
			>
				<div className="flex flex-col md:flex-row gap-6 mt-2">
					<div className="flex-1 space-y-4">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<label className="w-24 text-sm">Kasir</label>
								<Input value="Kasir" disabled className="flex-1" />
							</div>
							<div className="flex items-center gap-2">
								<label className="w-24 text-sm">Tanggal</label>
								<Input
										value={new Date().toLocaleDateString('id-ID')}
										disabled
										className="flex-1"
								/>
							</div>
							<div className="flex items-center gap-2">
								<label className="w-24 text-sm">Pelanggan</label>
								<Input disabled className="flex-1" />
							</div>
						</div>
						<div className="space-y-3 mt-4">
							<div className="text-sm font-semibold">Metode Pembayaran</div>
							<Radio.Group
									value={paymentMethod}
									onChange={(e) =>
										setPaymentMethod(e.target.value === 'noncash' ? 'noncash' : 'cash')
									}
							>
								<Radio value="cash">Tunai</Radio>
								<Radio value="noncash">Non Tunai / Kredit</Radio>
							</Radio.Group>
						</div>
						<div className="mt-4 border rounded p-3">
							<div className="font-semibold mb-2">Biaya Peracikan</div>
							<div className="flex items-center gap-2 mb-2">
								<label className="w-24 text-sm">Peracik</label>
								<Select
										className="flex-1"
										allowClear
										placeholder="--pilih--"
										onChange={() => {}}
								/>
							</div>
							<div className="flex items-center gap-2">
								<label className="w-24 text-sm">Biaya Jasa</label>
								<InputNumber
										className="flex-1"
										min={0}
										value={compoundingFee}
										onChange={(value) => {
											const numeric = typeof value === 'number' ? value : Number(value)
											setCompoundingFee(Number.isFinite(numeric) && numeric >= 0 ? numeric : 0)
										}}
										formatter={(val) =>
											val !== undefined ? String(val).replace(/[^0-9]/g, '') : ''
										}
										parser={(val) => (val ? Number(val.replace(/[^0-9]/g, '')) : 0)}
								/>
							</div>
						</div>
					</div>
					<div className="flex-1 space-y-3">
						<div className="flex items-center gap-2">
							<label className="w-32 text-sm">Total</label>
							<div className="flex-1 flex items-center gap-2">
								<span className="w-10 text-right text-sm">Rp.</span>
								<Input value={formatRupiah(total).replace('Rp', '').trim()} disabled />
							</div>
						</div>
						<div className="flex items-center gap-2">
							<label className="w-32 text-sm">Biaya Lainnya</label>
							<div className="flex-1 flex items-center gap-2">
								<span className="w-10 text-right text-sm">Rp.</span>
								<InputNumber
										className="flex-1"
										min={0}
										value={otherFee}
										onChange={(value) => {
											const numeric = typeof value === 'number' ? value : Number(value)
											setOtherFee(Number.isFinite(numeric) && numeric >= 0 ? numeric : 0)
										}}
										formatter={(val) =>
											val !== undefined ? String(val).replace(/[^0-9]/g, '') : ''
										}
										parser={(val) => (val ? Number(val.replace(/[^0-9]/g, '')) : 0)}
								/>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<label className="w-32 text-sm">Diskon</label>
							<div className="flex-1 flex items-center gap-2">
								<InputNumber
										className="flex-1"
										min={0}
										max={100}
										value={discountPercent}
										onChange={(value) => {
											const numeric = typeof value === 'number' ? value : Number(value)
											setDiscountPercent(
												Number.isFinite(numeric) && numeric >= 0 && numeric <= 100
													? numeric
													: 0
											)
										}}
								/>
								<span className="w-8 text-sm">%</span>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<label className="w-32 text-sm">Pajak</label>
							<div className="flex-1 flex items-center gap-2">
								<InputNumber
										className="flex-1"
										min={0}
										max={100}
										value={taxPercent}
										onChange={(value) => {
											const numeric = typeof value === 'number' ? value : Number(value)
											setTaxPercent(
												Number.isFinite(numeric) && numeric >= 0 && numeric <= 100
													? numeric
													: 0
											)
										}}
								/>
								<span className="w-8 text-sm">%</span>
							</div>
						</div>
						<div className="mt-2 bg-yellow-100 border border-yellow-300 rounded p-3 flex items-center justify-between">
							<div className="text-lg font-semibold">Grand Total</div>
							<div className="text-2xl font-bold">{formatRupiah(paymentSummary.grandTotal)}</div>
						</div>
						<div className="flex items-center gap-2 mt-2">
							<label className="w-32 text-sm">Dibayar</label>
							<div className="flex-1 flex items-center gap-2">
								<span className="w-10 text-right text-sm">Rp.</span>
								<InputNumber
										className="flex-1"
										min={0}
										value={paidAmount}
										onChange={(value) => {
											const numeric = typeof value === 'number' ? value : Number(value)
											setPaidAmount(Number.isFinite(numeric) && numeric >= 0 ? numeric : 0)
										}}
										formatter={(val) =>
											val !== undefined ? String(val).replace(/[^0-9]/g, '') : ''
										}
										parser={(val) => (val ? Number(val.replace(/[^0-9]/g, '')) : 0)}
								/>
							</div>
						</div>
						<div className="flex items-center gap-2 mt-1">
							<label className="w-32 text-sm">Kembali</label>
							<div className="flex-1 flex items-center gap-2">
								<span className="font-semibold">{formatRupiah(paymentSummary.change)}</span>
							</div>
						</div>
						<div className="flex justify-end gap-2 mt-4">
						<Button onClick={() => setIsPaymentOpen(false)}>Batal</Button>
						<Button
								type="primary"
								onClick={async () => {
								console.log('[ItemPurchase] Simpan clicked', {
									total,
									paymentSummary,
									paidAmount,
									rowsCount: rows.length,
									fakturNumber
								})
									try {
										if (paymentSummary.grandTotal <= 0) {
											message.error('Grand total harus lebih dari 0.')
											return
										}
										if (paidAmount < paymentSummary.grandTotal) {
											message.error('Nominal dibayar kurang dari grand total.')
											return
										}

										const api = window.api?.query as {
											pharmacyTransaction?: {
												create: (args: {
													fakturNumber: string
													transactionDate: string
													cashierName?: string | null
													patientId?: string | null
													paymentMethod: 'CASH' | 'NONCASH' | 'CREDIT'
													compoundingFee?: number | null
													otherFee?: number | null
													discountPercent?: number | null
													taxPercent?: number | null
													totalAmount: number
													grandTotal: number
													paidAmount: number
													changeAmount: number
													notes?: string | null
												}) => Promise<{
													success: boolean
													result?: {
														id: number
														fakturNumber: string
													} | null
													message?: string
												}>
											}
										}
									const fn = api?.pharmacyTransaction?.create
									if (!fn) {
										message.error('API transaksi farmasi tidak tersedia.')
										setIsPaymentOpen(false)
										setRows([])
										setPaidAmount(0)
										setCompoundingFee(0)
										setOtherFee(0)
										setDiscountPercent(0)
										setTaxPercent(0)
										return
									}

										const now = new Date()
										const isoDate = now.toISOString()
										const payload = {
											fakturNumber,
											transactionDate: isoDate,
											cashierName: 'Kasir',
											patientId: null,
											paymentMethod: paymentMethodForBackend,
											compoundingFee,
											otherFee,
											discountPercent,
											taxPercent,
											totalAmount: total,
											grandTotal: paymentSummary.grandTotal,
											paidAmount,
											changeAmount: paymentSummary.change,
											notes: null
										}
									console.log('[ItemPurchase] Calling pharmacyTransaction.create', payload)
									const res = await fn(payload)
									console.log('[ItemPurchase] Result from pharmacyTransaction.create', res)
									if (!res.success) {
										message.error(res.message || 'Gagal menyimpan transaksi farmasi')
									} else {
										message.success('Transaksi farmasi berhasil disimpan')
									}
									setIsPaymentOpen(false)
									setRows([])
									setPaidAmount(0)
									setCompoundingFee(0)
									setOtherFee(0)
									setDiscountPercent(0)
									setTaxPercent(0)
									} catch (error) {
										const text = error instanceof Error ? error.message : String(error)
										message.error(text || 'Terjadi kesalahan saat menyimpan transaksi')
									}
							}}
						>
							Simpan
						</Button>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	)
}

export default ItemPurchasePage
