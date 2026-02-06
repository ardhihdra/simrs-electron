import { Button, Card, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'

interface QuantityInfo {
	value?: number
	unit?: string
}

interface DispenseRequestInfo {
	quantity?: QuantityInfo
}

interface MedicationRequestAttributes {
	id?: number
	status: string
	dispenseRequest?: DispenseRequestInfo | null
}

interface MedicationRequestListResult {
	success: boolean
	data?: MedicationRequestAttributes[]
	error?: string
}

interface MedicationDispenseQuantityInfo {
	value?: number
	unit?: string
}

interface MedicationDispenseForSummary {
	id?: number
	authorizingPrescriptionId?: number | null
	status?: string
	quantity?: MedicationDispenseQuantityInfo | null
  medication?: { name?: string } | null
}

interface MedicationDispenseListResultForSummary {
	success: boolean
	data?: MedicationDispenseForSummary[]
	error?: string
}

interface StatusPieSlice {
	key: string
	label: string
	value: number
	color: string
}

interface StatusSummaryRow {
	key: string
	statusLabel: string
	count: number
	totalQuantity: number
}

interface ItemStatusRow {
	key: string
	statusLabel: string
	medicineName: string
	unit?: string
	totalQuantity: number
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

interface MedicineSalesRow {
	key: string
	medicineName: string
	unit?: string
	totalQuantity: number
	transactionCount: number
}

interface MedicineExpiryRow {
	key: string
	kodeItem: string
	namaItem: string
	unit: string
	availableStock: number
	earliestExpiryDate: string
}

function mapStatusForSummary(rawStatus?: string): string {
	if (!rawStatus) return 'other'
	if (rawStatus === 'completed') return 'completed'
	if (rawStatus === 'entered-in-error') return 'return'
	if (rawStatus === 'cancelled' || rawStatus === 'stopped' || rawStatus === 'declined') {
		return 'cancel'
	}
	if (rawStatus === 'preparation' || rawStatus === 'in-progress') return 'pending'
	if (rawStatus === 'on-hold') return 'hold'
	return 'other'
}

function getStatusLabel(statusKey: string): string {
	if (statusKey === 'completed') return 'Completed'
	if (statusKey === 'return') return 'Return'
	if (statusKey === 'cancel') return 'Cancel'
	if (statusKey === 'pending') return 'Pending'
	if (statusKey === 'hold') return 'Hold'
	return 'Lainnya'
}

function getStatusColor(statusKey: string): string {
	if (statusKey === 'completed') return '#22c55e'
	if (statusKey === 'return') return '#ef4444'
	if (statusKey === 'cancel') return '#f97316'
	if (statusKey === 'pending') return '#3b82f6'
	if (statusKey === 'hold') return '#eab308'
	return '#6b7280'
}

function StatusPie({ slices }: { slices: StatusPieSlice[] }) {
	const total = slices.reduce((acc, s) => acc + s.value, 0)
	if (total <= 0) {
		return (
			<div className="flex items-center justify-center h-40 text-gray-400 text-sm">
				Belum ada data penyerahan
			</div>
		)
	}
	const circumference = 2 * Math.PI * 16
	let offset = 0
	return (
		<svg viewBox="0 0 40 40" className="w-40 h-40">
			<circle
				cx="20"
				cy="20"
				r="16"
				fill="transparent"
				stroke="#e5e7eb"
				strokeWidth="8"
			/>
			{total > 0 &&
				slices.map((slice) => {
					const valueLength = (slice.value / total) * circumference
					const dashArray = `${valueLength} ${circumference}`
					const dashOffset = -offset
					offset += valueLength
					return (
						<circle
							key={slice.key}
							cx="20"
							cy="20"
							r="16"
							fill="transparent"
							stroke={slice.color}
							strokeWidth="8"
							strokeDasharray={dashArray}
							strokeDashoffset={dashOffset}
							strokeLinecap="butt"
						/>
					)
				})}
		</svg>
	)
}

function PharmacyDashboard() {
	const navigate = useNavigate()

	const { data: requestListData } = useQuery<MedicationRequestListResult>({
		queryKey: ['medicationRequest', 'list', 'dashboard'],
		queryFn: async () => {
			const fn = window.api?.query?.medicationRequest?.list
			if (!fn) {
				throw new Error('API MedicationRequest tidak tersedia.')
			}
			return fn({}) as Promise<MedicationRequestListResult>
		}
	})

	const { data: dispenseListData } = useQuery<MedicationDispenseListResultForSummary>({
		queryKey: ['medicationDispense', 'list', 'dashboard'],
		queryFn: async () => {
			const api = window.api?.query as {
				medicationDispense?: {
					list: (args?: { limit?: number }) => Promise<MedicationDispenseListResultForSummary>
				}
			}
			const fn = api?.medicationDispense?.list
			if (!fn) {
				throw new Error('API MedicationDispense tidak tersedia.')
			}
			return fn({ limit: 1000 })
		}
	})

	const { data: medicineExpiryData } = useQuery<InventoryExpiryResponse>({
		queryKey: ['inventoryStock', 'expiry', 'medicine', 'dashboard-pharmacy'],
		queryFn: async () => {
			const inventoryApi = window.api?.query?.inventoryStock as
				| {
						expirySummary?: (args?: {
							itemType?: 'item' | 'substance' | 'medicine'
							limit?: number
						}) => Promise<InventoryExpiryResponse>
				  }
				| undefined
			const fn = inventoryApi?.expirySummary
			if (!fn) {
				throw new Error('API ringkasan expired stok obat tidak tersedia.')
			}
			return fn({ itemType: 'medicine', limit: 10 })
		}
	})

	const dispensedSummaryByRequestId = useMemo(() => {
		const source: MedicationDispenseForSummary[] = Array.isArray(dispenseListData?.data)
			? dispenseListData.data ?? []
			: []

		const map = new Map<number, { totalCompleted: number }>()

		source.forEach((item) => {
			const reqId = item.authorizingPrescriptionId
			if (typeof reqId !== 'number') return
			if (item.status !== 'completed') return
			const qty = item.quantity?.value
			if (typeof qty !== 'number') return
			const prev = map.get(reqId) ?? { totalCompleted: 0 }
			map.set(reqId, {
				totalCompleted: prev.totalCompleted + qty
			})
		})

		return map
	}, [dispenseListData?.data])

	const stats = useMemo(() => {
		const source: MedicationRequestAttributes[] = Array.isArray(requestListData?.data)
			? requestListData.data ?? []
			: []

		const activeRequests = source.filter((req) => req.status === 'active')

		let totalActive = 0
		let totalActivePartial = 0
		let totalActiveFulfilled = 0

		activeRequests.forEach((req) => {
			const prescribed = req.dispenseRequest?.quantity?.value
			if (typeof prescribed !== 'number') {
				return
			}
			totalActive += 1
			const summary =
				typeof req.id === 'number' ? dispensedSummaryByRequestId.get(req.id) : undefined
			const completed = summary?.totalCompleted ?? 0
			if (completed <= 0) {
				return
			}
			if (completed < prescribed) {
				totalActivePartial += 1
			} else if (completed >= prescribed) {
				totalActiveFulfilled += 1
			}
		})

		return {
			totalActive,
			totalActivePartial,
			totalActiveFulfilled
		}
	}, [requestListData?.data, dispensedSummaryByRequestId])

	const statusSummary = useMemo(() => {
		const source: MedicationDispenseForSummary[] = Array.isArray(dispenseListData?.data)
			? dispenseListData.data ?? []
			: []

		const map = new Map<string, { count: number; totalQuantity: number }>()

		source.forEach((item) => {
			const key = mapStatusForSummary(item.status)
			const qty = item.quantity?.value
			if (typeof qty !== 'number') return
			const prev = map.get(key) ?? { count: 0, totalQuantity: 0 }
			map.set(key, {
				count: prev.count + 1,
				totalQuantity: prev.totalQuantity + qty
			})
		})

		const rows: StatusSummaryRow[] = []
		map.forEach((value, key) => {
			rows.push({
				key,
				statusLabel: getStatusLabel(key),
				count: value.count,
				totalQuantity: value.totalQuantity
			})
		})

		const totalQuantityAll = rows.reduce((acc, row) => acc + row.totalQuantity, 0)
		const slices: StatusPieSlice[] = rows
			.filter((row) => row.totalQuantity > 0)
			.map((row) => ({
				key: row.key,
				label: row.statusLabel,
				value: row.totalQuantity,
				color: getStatusColor(row.key)
			}))

		return { rows, slices, totalQuantityAll }
	}, [dispenseListData?.data])

	const itemStatusRows = useMemo(() => {
		const source: MedicationDispenseForSummary[] = Array.isArray(dispenseListData?.data)
			? dispenseListData.data ?? []
			: []

		const map = new Map<string, ItemStatusRow>()

		source.forEach((item) => {
			const statusKey = mapStatusForSummary(item.status)
			const statusLabel = getStatusLabel(statusKey)
			const medicineName = item.medication?.name ?? 'Tidak diketahui'
			const unit = item.quantity?.unit
			const qty = item.quantity?.value
			if (typeof qty !== 'number') return
			const mapKey = `${statusKey}|${medicineName}|${unit ?? ''}`
			const prev = map.get(mapKey)
			if (prev) {
				prev.totalQuantity += qty
			} else {
				map.set(mapKey, {
					key: mapKey,
					statusLabel,
					medicineName,
					unit,
					totalQuantity: qty
				})
			}
		})

		return Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 10)
	}, [dispenseListData?.data])

	const medicineExpiryRows = useMemo<MedicineExpiryRow[]>(() => {
		const list: InventoryExpiryItem[] = Array.isArray(medicineExpiryData?.result)
			? medicineExpiryData.result ?? []
			: []

		return list.map((item) => ({
			key: item.kodeItem,
			kodeItem: item.kodeItem,
			namaItem: item.namaItem,
			unit: item.unit,
			availableStock: item.availableStock,
			earliestExpiryDate: item.earliestExpiryDate
		}))
	}, [medicineExpiryData?.result])

	const { bestSellingRows, leastSellingRows } = useMemo(() => {
		const source: MedicationDispenseForSummary[] = Array.isArray(dispenseListData?.data)
			? dispenseListData.data ?? []
			: []

		const salesMap = new Map<string, MedicineSalesRow>()

		source.forEach((item) => {
			if (item.status !== 'completed') return
			const qty = item.quantity?.value
			if (typeof qty !== 'number') return
			const medicineName = item.medication?.name ?? 'Tidak diketahui'
			const unit = item.quantity?.unit
			const mapKey = `${medicineName}|${unit ?? ''}`
			const previous = salesMap.get(mapKey)
			if (previous) {
				previous.totalQuantity += qty
				previous.transactionCount += 1
			} else {
				salesMap.set(mapKey, {
					key: mapKey,
					medicineName,
					unit,
					totalQuantity: qty,
					transactionCount: 1
				})
			}
		})

		const allRows = Array.from(salesMap.values())
		const sortedDesc = [...allRows].sort((a, b) => b.totalQuantity - a.totalQuantity)
		const sortedAsc = [...allRows].sort((a, b) => a.totalQuantity - b.totalQuantity)

		return {
			bestSellingRows: sortedDesc.slice(0, 10),
			leastSellingRows: sortedAsc.slice(0, 10)
		}
	}, [dispenseListData?.data])

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between flex-wrap gap-3">
				<h2 className="text-3xl font-bold">Dashboard Farmasi</h2>
				<div className="flex gap-2 flex-wrap">
					<Button onClick={() => navigate('/dashboard/medicine/medication-requests')}>
						Ke Permintaan Obat
					</Button>
					<Button onClick={() => navigate('/dashboard/medicine/medication-dispenses')}>
						Ke Penyerahan Obat
					</Button>
					<Button onClick={() => navigate('/dashboard/medicine/medication-dispenses/report')}>
						Laporan Penyerahan Obat
					</Button>
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<div className="text-sm text-gray-500">Resep aktif</div>
					<div className="text-3xl font-bold">{stats.totalActive}</div>
				</Card>
				<Card>
					<div className="text-sm text-gray-500">Resep aktif parsial</div>
					<div className="text-3xl font-bold">{stats.totalActivePartial}</div>
				</Card>
				<Card>
					<div className="text-sm text-gray-500">Resep aktif terpenuhi</div>
					<div className="text-3xl font-bold">{stats.totalActiveFulfilled}</div>
				</Card>
			</div>
			<Card title="Distribusi Penyerahan Obat per Status">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
					<div className="flex justify-center">
						<StatusPie slices={statusSummary.slices} />
					</div>
					<div className="md:col-span-2">
						<Table<StatusSummaryRow>
							dataSource={statusSummary.rows}
							columns={[
								{ title: 'Status', dataIndex: 'statusLabel', key: 'statusLabel' },
								{ title: 'Jumlah Transaksi', dataIndex: 'count', key: 'count' },
								{ title: 'Total Qty', dataIndex: 'totalQuantity', key: 'totalQuantity' }
							]}
							pagination={false}
							rowKey="key"
							size="small"
						/>
					</div>
				</div>
			</Card>
			<Card title="Top 10 Obat per Status (berdasarkan Qty)">
				<Table<ItemStatusRow>
					dataSource={itemStatusRows}
					columns={[
						{ title: 'Status', dataIndex: 'statusLabel', key: 'statusLabel' },
						{ title: 'Nama Obat', dataIndex: 'medicineName', key: 'medicineName' },
						{ title: 'Qty', dataIndex: 'totalQuantity', key: 'totalQuantity' },
						{ title: 'Satuan', dataIndex: 'unit', key: 'unit' }
					] as ColumnsType<ItemStatusRow>}
					pagination={false}
					rowKey="key"
					size="small"
				/>
			</Card>
			<Card title="Top 10 Obat Expired Terdekat">
				<Table<MedicineExpiryRow>
					dataSource={medicineExpiryRows}
					columns={[
						{ title: 'Kode', dataIndex: 'kodeItem', key: 'kodeItem' },
						{ title: 'Nama Obat', dataIndex: 'namaItem', key: 'namaItem' },
						{ title: 'Qty Tersedia', dataIndex: 'availableStock', key: 'availableStock' },
						{ title: 'Satuan', dataIndex: 'unit', key: 'unit' },
						{
							title: 'Tgl Expired Terdekat',
							dataIndex: 'earliestExpiryDate',
							key: 'earliestExpiryDate'
						}
					] as ColumnsType<MedicineExpiryRow>}
					pagination={false}
					rowKey="key"
					size="small"
				/>
			</Card>
			<Card title="Obat Paling Laku">
				<Table<MedicineSalesRow>
					dataSource={bestSellingRows}
					columns={[
						{ title: 'Nama Obat', dataIndex: 'medicineName', key: 'medicineName' },
						{ title: 'Qty Terjual', dataIndex: 'totalQuantity', key: 'totalQuantity' },
						{ title: 'Jumlah Transaksi', dataIndex: 'transactionCount', key: 'transactionCount' },
						{ title: 'Satuan', dataIndex: 'unit', key: 'unit' }
					] as ColumnsType<MedicineSalesRow>}
					pagination={false}
					rowKey="key"
					size="small"
				/>
			</Card>
			<Card title="Obat Paling Tidak Laku">
				<Table<MedicineSalesRow>
					dataSource={leastSellingRows}
					columns={[
						{ title: 'Nama Obat', dataIndex: 'medicineName', key: 'medicineName' },
						{ title: 'Qty Terjual', dataIndex: 'totalQuantity', key: 'totalQuantity' },
						{ title: 'Jumlah Transaksi', dataIndex: 'transactionCount', key: 'transactionCount' },
						{ title: 'Satuan', dataIndex: 'unit', key: 'unit' }
					] as ColumnsType<MedicineSalesRow>}
					pagination={false}
					rowKey="key"
					size="small"
				/>
			</Card>
		</div>
	)
}

export default PharmacyDashboard
