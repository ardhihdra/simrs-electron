import { Button, Card, Input, InputNumber, Select, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { HistoryModal } from './component/HistoryModal'
import { ItemSearchModal } from './component/ItemSearchModal'
import { PaymentModal } from './component/PaymentModal'
import {
	formatRupiah,
	generateFakturNumber,
	type InventoryStockItem,
	type ItemLookup,
	type PharmacyTransactionRecord,
	type PriceRule,
	type PurchaseItemRow
} from './types'

interface ItemListResponse {
	success: boolean
	result?: ItemLookup[]
	message?: string
}

interface InventoryStockResponse {
	success: boolean
	result?: InventoryStockItem[]
	message?: string
}

interface PharmacyTransactionListResponse {
	success: boolean
	result?: PharmacyTransactionRecord[]
	data?: PharmacyTransactionRecord[]
	error?: string
	message?: string
}

function ItemPurchasePage() {
	// --- Cart state ---
	const [rows, setRows] = useState<PurchaseItemRow[]>([])
	const [jumlah, setJumlah] = useState<number>(1)
	const [selectedItem, setSelectedItem] = useState<ItemLookup | null>(null)
	const [selectedPriceRule, setSelectedPriceRule] = useState<PriceRule | null>(null)
	const [fakturNumber] = useState<string>(() => generateFakturNumber())

	// --- Modal states ---
	const [isSearchOpen, setIsSearchOpen] = useState(false)
	const [isLoadingItems, setIsLoadingItems] = useState(false)
	const [itemList, setItemList] = useState<ItemLookup[]>([])

	const [isHistoryOpen, setIsHistoryOpen] = useState(false)
	const [isLoadingHistory, setIsLoadingHistory] = useState(false)
	const [historyRows, setHistoryRows] = useState<PharmacyTransactionRecord[]>([])

	const [isPaymentOpen, setIsPaymentOpen] = useState(false)

	// --- Payment state ---
	const [paymentMethod, setPaymentMethod] = useState<'cash' | 'noncash'>('cash')
	const [compoundingFee, setCompoundingFee] = useState(0)
	const [otherFee, setOtherFee] = useState(0)
	const [discountPercent, setDiscountPercent] = useState(0)
	const [taxPercent, setTaxPercent] = useState(0)
	const [paidAmount, setPaidAmount] = useState(0)

	const paymentMethodForBackend: 'CASH' | 'NONCASH' | 'CREDIT' =
		paymentMethod === 'cash' ? 'CASH' : 'NONCASH'

	// --- Computed totals ---
	const total = useMemo(() => rows.reduce((s, r) => s + r.subTotal, 0), [rows])

	const paymentSummary = useMemo(() => {
		const base = total + compoundingFee + otherFee
		const safeBase = Number.isFinite(base) && base > 0 ? base : 0
		const discountValue = (safeBase * (discountPercent > 0 ? discountPercent : 0)) / 100
		const taxValue = (safeBase * (taxPercent > 0 ? taxPercent : 0)) / 100
		const grandTotal = safeBase - discountValue + taxValue
		const safePaid = paidAmount > 0 ? paidAmount : 0
		return {
			base: safeBase,
			discountValue,
			taxValue,
			grandTotal,
			change: safePaid > grandTotal ? safePaid - grandTotal : 0
		}
	}, [total, compoundingFee, otherFee, discountPercent, taxPercent, paidAmount])

	// --- Print ---
	const handlePrintReceipt = (tx: PharmacyTransactionRecord, items: PurchaseItemRow[]) => {
		const lines: string[] = [
			'APOTEK / FARMASI',
			'',
			`No. Faktur : ${tx.fakturNumber}`,
			`Tanggal    : ${new Date(tx.transactionDate).toLocaleString('id-ID')}`,
			...(tx.cashierName?.trim() ? [`Kasir     : ${tx.cashierName}`] : []),
			'----------------------------------------',
			...items.flatMap((r) => [
				r.nama,
				`${r.qty} ${r.satuan} x ${formatRupiah(r.harga)} = ${formatRupiah(r.subTotal)}`
			]),
			'----------------------------------------',
			`Subtotal   : ${formatRupiah(tx.totalAmount)}`,
			...(tx.compoundingFee && tx.compoundingFee > 0 ? [`Racikan    : ${formatRupiah(tx.compoundingFee)}`] : []),
			...(tx.otherFee && tx.otherFee > 0 ? [`Biaya lain : ${formatRupiah(tx.otherFee)}`] : []),
			...(tx.discountPercent && tx.discountPercent > 0 ? [`Diskon     : ${tx.discountPercent}%`] : []),
			...(tx.taxPercent && tx.taxPercent > 0 ? [`Pajak      : ${tx.taxPercent}%`] : []),
			`Grand total: ${formatRupiah(tx.grandTotal)}`,
			`Bayar      : ${formatRupiah(tx.paidAmount)}`,
			`Kembali    : ${formatRupiah(tx.changeAmount)}`,
			...(tx.notes?.trim() ? ['', tx.notes] : []),
			'',
			'Terima kasih'
		]
		const htmlLines = lines.map((l) => `<div class="line">${l}</div>`).join('')
		const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Struk</title><style>body{font-family:system-ui,sans-serif;font-size:12px;margin:8px}.receipt{max-width:320px}.line{margin-bottom:2px}</style></head><body><div class="receipt">${htmlLines}</div></body></html>`
		const iframe = document.createElement('iframe')
		Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' })
		document.body.appendChild(iframe)
		const iw = iframe.contentWindow
		if (!iw) { iframe.remove(); return }
		iw.document.open(); iw.document.write(html); iw.document.close()
		iw.focus(); iw.print()
		setTimeout(() => iframe.remove(), 1000)
	}

	// --- Load items ---
	const handleOpenSearch = async () => {
		setIsLoadingItems(true)
		try {
			const itemApi = (window.api?.query as { item?: { list: () => Promise<ItemListResponse> } })?.item
			const inventoryApi = window.api?.query as {
				inventoryStock?: { list: (args?: { itemType?: 'item' | 'substance' | 'medicine' }) => Promise<InventoryStockResponse> }
			}
			const medicineCategoryApi = window.api?.query as {
				medicineCategory?: { list: () => Promise<{ success: boolean; result?: Array<{ id: number; name: string | null }> }> }
			}
			if (!itemApi?.list) { message.error('API master item tidak tersedia.'); return }

			// Fetch item list + kategori + stok secara paralel
			const [res, categoryRes, stockRes] = await Promise.allSettled([
				itemApi.list(),
				medicineCategoryApi.medicineCategory?.list().catch(() => null),
				inventoryApi.inventoryStock?.list({ itemType: 'item' }).catch(() => null)
			])

			if (res.status === 'rejected' || (res.status === 'fulfilled' && !res.value.success)) {
				message.error('Gagal mengambil data item')
				return
			}

			// Build category map: id -> name
			const categoryMap = new Map<number, string>()
			if (categoryRes.status === 'fulfilled' && categoryRes.value) {
				const catList = (categoryRes.value as any)?.result ?? []
				for (const cat of catList) {
					if (typeof cat.id === 'number' && cat.name) {
						categoryMap.set(cat.id, String(cat.name))
					}
				}
			}

			// Build stock map: kodeUpper -> availableStock
			const stockMap = new Map<string, number>()
			if (stockRes.status === 'fulfilled' && stockRes.value?.result) {
				for (const s of stockRes.value.result) {
					const k = s.kodeItem.trim().toUpperCase()
					if (k) stockMap.set(k, s.availableStock)
				}
			}

			const safeList: ItemLookup[] = (res.value.result ?? []).map((item) => {
				const kodeUpper = String(item.kode ?? '').trim().toUpperCase()
				const catId = typeof (item as any).itemCategoryId === 'number' ? (item as any).itemCategoryId as number : null
				// Coba dari map kategori dulu, fallback ke field category.name jika ada
				const cat = (item as any).category
				const categoryName =
					(catId !== null && categoryMap.get(catId)) ||
					(typeof (item as any).categoryName === 'string' ? (item as any).categoryName : null) ||
					(typeof cat?.name === 'string' ? cat.name : null) ||
					null
				return {
					id: Number(item.id),
					kode: String(item.kode ?? ''),
					nama: String(item.nama ?? ''),
					kodeUnit: String((item as any).kodeUnit ?? ''),
					itemCategoryId: catId,
					sellingPrice: typeof item.sellingPrice === 'number' ? item.sellingPrice : null,
					sellPriceRules: Array.isArray(item.sellPriceRules) ? item.sellPriceRules : undefined,
					categoryName,
					currentStock: kodeUpper ? stockMap.get(kodeUpper) ?? null : null
				}
			})
			setItemList(safeList)
			setIsSearchOpen(true)
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
		} finally {
			setIsLoadingItems(false)
		}
	}

	// --- Load history ---
	const handleOpenHistory = async () => {
		setIsHistoryOpen(true)
		setHistoryRows([])
		setIsLoadingHistory(true)
		try {
			const api = window.api?.query as {
				pharmacyTransaction?: { list: (args?: { items?: number }) => Promise<PharmacyTransactionListResponse> }
			}
			const fn = api?.pharmacyTransaction?.list
			if (!fn) { message.error('API riwayat transaksi tidak tersedia.'); return }
			const res = await fn({ items: 50 })
			if (!res.success) { message.error(res.message || res.error || 'Gagal memuat riwayat'); return }
			// Support both result[] and data[]
			const source: PharmacyTransactionRecord[] =
				Array.isArray(res.result) ? res.result :
					Array.isArray(res.data) ? res.data : []
			setHistoryRows([...source].sort((a, b) =>
				new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
			))
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
		} finally {
			setIsLoadingHistory(false)
		}
	}

	// --- Select item from modal ---
	const handleSelectItem = (record: ItemLookup) => {
		setSelectedItem(record)
		setSelectedPriceRule(null)
		setIsSearchOpen(false)
	}

	// --- Add to cart ---
	const handleTambah = () => {
		if (!selectedItem) { message.warning('Pilih item terlebih dahulu.'); return }
		const rawHarga = selectedPriceRule?.price ?? selectedItem.sellingPrice
		if (rawHarga == null || !Number.isFinite(rawHarga)) {
			message.warning('Pilih harga jual terlebih dahulu.')
			return
		}
		const safeQty = Number.isFinite(jumlah) && jumlah > 0 ? jumlah : 1
		const kode = selectedItem.kode.trim().toUpperCase()
		const satuan = selectedPriceRule?.unitCode?.trim().toUpperCase() || selectedItem.kodeUnit || 'PCS'
		const rowKey = `${kode}__${satuan}`
		setRows((prev) => {
			const idx = prev.findIndex((r) => r.key === rowKey)
			if (idx >= 0) {
				return prev.map((r, i) => i === idx ? { ...r, qty: r.qty + safeQty, subTotal: (r.qty + safeQty) * rawHarga } : r)
			}
			return [...prev, { key: rowKey, kode, nama: selectedItem.nama, harga: rawHarga, qty: safeQty, satuan, subTotal: rawHarga * safeQty }]
		})
	}

	// --- Save transaction ---
	const handleSave = async () => {
		if (paymentSummary.grandTotal <= 0) { message.error('Grand total harus lebih dari 0.'); return }
		if (paymentMethod === 'cash' && paidAmount < paymentSummary.grandTotal) {
			message.error('Nominal dibayar kurang dari grand total.')
			return
		}
		try {
			const api = window.api?.query as { pharmacyTransaction?: { create: (args: any) => Promise<{ success: boolean; result?: { id: number; fakturNumber: string } | null; message?: string }> } }
			const fn = api?.pharmacyTransaction?.create
			if (!fn) { message.error('API transaksi farmasi tidak tersedia.'); return }

			const now = new Date()
			const payload = {
				fakturNumber,
				transactionDate: now.toISOString(),
				cashierName: 'Kasir',
				patientId: null,
				paymentMethod: paymentMethodForBackend,
				compoundingFee,
				otherFee,
				discountPercent,
				taxPercent,
				totalAmount: total,
				grandTotal: paymentSummary.grandTotal,
				paidAmount: paymentMethod === 'cash' ? paidAmount : paymentSummary.grandTotal,
				changeAmount: paymentSummary.change,
				notes: null,
				items: rows.map((r) => ({
					itemKode: r.kode,
					quantity: r.qty,
					unitPrice: r.harga,
					discountAmount: 0,
					taxAmount: 0
				}))
			}

			const res = await fn(payload)
			if (!res.success) {
				message.error(res.message || 'Gagal menyimpan transaksi')
				return
			}
			message.success('Transaksi berhasil disimpan!')
			const savedTx: PharmacyTransactionRecord = {
				id: res.result?.id ?? 0,
				fakturNumber: payload.fakturNumber,
				transactionDate: payload.transactionDate,
				cashierName: payload.cashierName,
				patientId: null,
				paymentMethod: payload.paymentMethod,
				compoundingFee: payload.compoundingFee,
				otherFee: payload.otherFee,
				discountPercent: payload.discountPercent,
				taxPercent: payload.taxPercent,
				totalAmount: payload.totalAmount,
				grandTotal: payload.grandTotal,
				paidAmount: payload.paidAmount,
				changeAmount: payload.changeAmount,
				notes: null
			}
			handlePrintReceipt(savedTx, rows)
		} catch (err) {
			message.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
		} finally {
			setIsPaymentOpen(false)
			setRows([])
			setPaidAmount(0)
			setCompoundingFee(0)
			setOtherFee(0)
			setDiscountPercent(0)
			setTaxPercent(0)
		}
	}

	// --- Table columns ---
	const columns: ColumnsType<PurchaseItemRow> = [
		{ title: 'Kode', dataIndex: 'kode', key: 'kode', width: 110 },
		{ title: 'Nama Barang', dataIndex: 'nama', key: 'nama' },
		{ title: 'Harga', dataIndex: 'harga', key: 'harga', align: 'right', width: 130, render: (v: number) => formatRupiah(v) },
		{ title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'right', width: 70 },
		{ title: 'Satuan', dataIndex: 'satuan', key: 'satuan', width: 90 },
		{ title: 'Sub Total', dataIndex: 'subTotal', key: 'subTotal', align: 'right', width: 140, render: (v: number) => formatRupiah(v) },
		{
			title: '', key: 'del', align: 'center', width: 70,
			render: (_: unknown, record: PurchaseItemRow) => (
				<Button danger type="link" size="small" onClick={() => setRows((p) => p.filter((r) => r.key !== record.key))}>
					Hapus
				</Button>
			)
		}
	]

	// --- Render ---
	return (
		<div className="flex flex-col lg:flex-row gap-4">
			{/* Left panel: Input */}
			<div className="w-full lg:w-80 shrink-0">
				<Card>
					<div className="space-y-3">
						<div className="flex gap-2">
							<Input
								placeholder="Kode Barang"
								value={selectedItem?.kode ?? ''}
								readOnly
								className="flex-1"
							/>
							<Button onClick={handleOpenSearch} loading={isLoadingItems}>
								Pilih [F1]
							</Button>
						</div>
						{selectedItem && (
							<div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
								{selectedItem.nama}
								{selectedItem.categoryName && (
									<span className="ml-2 text-xs text-blue-500">[{selectedItem.categoryName}]</span>
								)}
							</div>
						)}
						<div>
							<label className="block text-xs text-gray-500 mb-1">Harga Jual Satuan</label>
							<Select
								placeholder={selectedItem ? 'Pilih harga jual' : 'Pilih obat dulu'}
								value={selectedPriceRule ? `${selectedPriceRule.unitCode}|${selectedPriceRule.qty}|${selectedPriceRule.price}` : undefined}
								onChange={(v) => {
									const [unitCode, qtyStr, priceStr] = v.split('|')
									const qty = Number(qtyStr), price = Number(priceStr)
									setSelectedPriceRule(Number.isFinite(qty) && Number.isFinite(price) ? { unitCode, qty, price } : null)
								}}
								className="w-full"
								disabled={!selectedItem}
							>
								{selectedItem && Array.isArray(selectedItem.sellPriceRules) && selectedItem.sellPriceRules.length > 0
									? selectedItem.sellPriceRules.map((r, i) => (
										<Select.Option key={i} value={`${r.unitCode}|${r.qty}|${r.price}`}>
											{r.unitCode.toUpperCase()} – {formatRupiah(r.price)}
										</Select.Option>
									))
									: selectedItem?.sellingPrice != null
										? <Select.Option value={`DEFAULT|1|${selectedItem.sellingPrice}`}>
											Default – {formatRupiah(selectedItem.sellingPrice)}
										</Select.Option>
										: null
								}
							</Select>
						</div>
						<div className="flex items-center gap-2">
							<label className="text-sm w-20">Jumlah</label>
							<InputNumber
								min={1}
								value={jumlah}
								onChange={(v) => setJumlah(Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 1)}
								className="w-24"
							/>
							<Button type="primary" onClick={handleTambah}>Tambah</Button>
						</div>
						<div className="flex items-center gap-2">
							<label className="text-sm w-20">Faktur</label>
							<div className="flex-1 bg-gray-100 text-xs rounded px-2 py-1 font-mono">{fakturNumber}</div>
						</div>
						<div className="border-t pt-3 space-y-2">
							<Button type="primary" block onClick={() => {
								if (rows.length === 0) { message.warning('Belum ada item.'); return }
								setIsPaymentOpen(true)
							}}>
								Selesai / Bayar
							</Button>
							<Button block onClick={handleOpenHistory}>
								Riwayat Transaksi
							</Button>
						</div>
					</div>
				</Card>
			</div>

			{/* Right panel: Cart */}
			<div className="flex-1 flex flex-col gap-3">
				<Card>
					<div className="flex items-center justify-between mb-2">
						<div className="text-lg font-semibold">Total Belanja</div>
						<div className="text-3xl font-bold bg-yellow-100 px-4 py-1 rounded border border-yellow-300">
							{formatRupiah(total)}
						</div>
					</div>
					<Table<PurchaseItemRow>
						columns={columns}
						dataSource={rows}
						pagination={false}
						size="small"
						locale={{ emptyText: 'Belum ada item — klik "Pilih [F1]" untuk memulai' }}
					/>
				</Card>
			</div>

			{/* Modals */}
			<ItemSearchModal
				open={isSearchOpen}
				loading={isLoadingItems}
				itemList={itemList}
				onClose={() => setIsSearchOpen(false)}
				onSelect={handleSelectItem}
			/>

			<HistoryModal
				open={isHistoryOpen}
				loading={isLoadingHistory}
				rows={historyRows}
				onClose={() => setIsHistoryOpen(false)}
			/>

			<PaymentModal
				open={isPaymentOpen}
				rows={rows}
				fakturNumber={fakturNumber}
				paymentMethod={paymentMethod}
				compoundingFee={compoundingFee}
				otherFee={otherFee}
				discountPercent={discountPercent}
				taxPercent={taxPercent}
				paidAmount={paidAmount}
				paymentSummary={paymentSummary}
				onPaymentMethodChange={setPaymentMethod}
				onCompoundingFeeChange={setCompoundingFee}
				onOtherFeeChange={setOtherFee}
				onDiscountPercentChange={setDiscountPercent}
				onTaxPercentChange={setTaxPercent}
				onPaidAmountChange={setPaidAmount}
				onCancel={() => setIsPaymentOpen(false)}
				onSave={handleSave}
			/>
		</div>
	)
}

export default ItemPurchasePage
