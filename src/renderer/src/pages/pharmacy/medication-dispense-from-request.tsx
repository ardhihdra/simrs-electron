import { Button, Card, Descriptions, InputNumber, Popconfirm, Table, Tooltip, message } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import dayjs from 'dayjs'

type PatientNameEntry = {
	text?: string
	given?: string[]
	family?: string
}

type PatientIdentifier = {
	system?: string
	value?: string
}

interface PatientInfo {
	name?: string | PatientNameEntry[]
	identifier?: PatientIdentifier[]
	mrNo?: string
}

interface QuantityInfo {
	value?: number
	unit?: string
}

interface DispenseRequestInfo {
	quantity?: QuantityInfo
}

interface DosageInstructionEntry {
	text?: string
}

interface MedicationInfo {
	id?: number
	name?: string
	stock?: number
	uom?: string | null
}

interface GroupIdentifierInfo {
	system?: string
	value?: string
}

interface CategoryInfo {
	text?: string
	code?: string
}

interface MedicationRequestDetail {
	id?: number
	status: string
	intent: string
	priority?: string
	patientId: string
	authoredOn?: string
	patient?: PatientInfo
	medication?: MedicationInfo
	item?: { nama?: string; kode?: string; itemCategoryId?: number | null } | null
	itemId?: number | null
	groupIdentifier?: GroupIdentifierInfo | null
	category?: CategoryInfo[] | null
	note?: string | null
	dosageInstruction?: DosageInstructionEntry[] | null
	dispenseRequest?: DispenseRequestInfo | null
}

interface BackendDetailResult {
	success: boolean
	data?: MedicationRequestDetail
	error?: string
}

interface DispenseCreateResult {
	success: boolean
	data?: unknown
	error?: string
}

interface TableRow {
	key: string
	jenis: string
	namaObat: string
	quantityDiminta?: number
	unitDiminta?: string
	instruksi?: string
	stokSaatIni?: number
	unitStok?: string | null
	quantityDiambil?: number
	medicationRequestId?: number
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
}

interface MedicationDispenseListResultForSummary {
	success: boolean
	data?: MedicationDispenseForSummary[]
	pagination?: {
		page: number
		limit: number
		total: number
		pages: number
	}
	error?: string
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

interface ItemCategoryAttributes {
	id?: number
	name?: string | null
}

interface ItemCategoryListResponse {
	success: boolean
	result?: ItemCategoryAttributes[]
	message?: string
}

interface ItemAttributes {
	id?: number
	itemCategoryId?: number | null
	category?: {
		id?: number
		name?: string | null
	} | null
}

interface ItemListResponse {
	success: boolean
	result?: ItemAttributes[]
	message?: string
}

function getPatientDisplayName(patient?: PatientInfo): string {
	if (!patient) return ''

	if (typeof patient.name === 'string') {
		const trimmed = patient.name.trim()
		if (trimmed.length > 0) return trimmed
	}

	const firstName: PatientNameEntry | undefined = Array.isArray(patient.name) && patient.name.length > 0
		? patient.name[0]
		: undefined

	const nameFromText = firstName?.text?.trim() ?? ''
	const nameFromGivenFamily = [firstName?.given?.[0], firstName?.family]
		.filter((v) => typeof v === 'string' && v.trim().length > 0)
		.join(' ')
		.trim()

	const baseName = nameFromText || nameFromGivenFamily

	const identifiers = Array.isArray(patient.identifier) ? patient.identifier : []
	const localMrn = identifiers.find((id) => id.system === 'local-mrn')
	const mrn = patient.mrNo || localMrn?.value || ''

	if (baseName && mrn) return `${baseName} (${mrn})`
	if (baseName) return baseName
	if (mrn) return mrn
	return 'Tanpa nama'
}

function getInstructionText(dosage?: DosageInstructionEntry[] | null): string {
	if (!Array.isArray(dosage) || dosage.length === 0) return ''
	return dosage[0]?.text ?? ''
}

export default function MedicationDispenseFromRequest() {
	const params = useParams()
	const navigate = useNavigate()
	const idParam = params.id
	const requestId = typeof idParam === 'string' ? Number(idParam) : NaN
	const [quantityOverrides, setQuantityOverrides] = useState<Record<number, number>>({})

	const { data, isLoading } = useQuery({
		queryKey: ['medicationRequest', 'detail', requestId],
		queryFn: async (): Promise<BackendDetailResult> => {
			if (!Number.isFinite(requestId)) {
				throw new Error('ID resep tidak valid')
			}
			const fn = window.api?.query?.medicationRequest?.getById
			if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
			return fn({ id: requestId }) as Promise<BackendDetailResult>
		},
		enabled: Number.isFinite(requestId)
	})

	const baseDetail: MedicationRequestDetail | undefined = data?.data
	const detail: MedicationRequestDetail | undefined = baseDetail

	const { data: groupListData } = useQuery({
		queryKey: ['medicationRequest', 'groupListForDispense', requestId, baseDetail?.groupIdentifier?.value],
		enabled: Number.isFinite(requestId) && !!baseDetail?.groupIdentifier?.value,
		queryFn: async () => {
			if (!baseDetail || !baseDetail.groupIdentifier?.value) {
				return [] as MedicationRequestDetail[]
			}
			const api = window.api?.query as {
				medicationRequest?: {
					list: (args: { patientId?: string; limit?: number }) => Promise<{
						success: boolean
						data?: MedicationRequestDetail[]
						pagination?: unknown
						message?: string
					}>
				}
			}
			const fn = api?.medicationRequest?.list
			if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
			const res = await fn({ patientId: baseDetail.patientId, limit: 1000 })
			const list = Array.isArray(res.data) ? res.data : []
			return list.filter(
				(item) => item.groupIdentifier?.value === baseDetail.groupIdentifier?.value
			) as MedicationRequestDetail[]
		}
	})

	const { data: dispenseListData } = useQuery({
		queryKey: ['medicationDispense', 'forCreateFromRequest', requestId],
		enabled: Number.isFinite(requestId),
		queryFn: async () => {
			const api = window.api?.query as {
				medicationDispense?: {
					list: (args?: { limit?: number }) => Promise<MedicationDispenseListResultForSummary>
				}
			}
			const fn = api?.medicationDispense?.list
			if (!fn) throw new Error('API MedicationDispense tidak tersedia.')
			return fn({ limit: 1000 })
		}
	})

	const { data: inventoryStockData } = useQuery<InventoryStockResponse>({
		queryKey: ['inventoryStock', 'list'],
		queryFn: () => {
			const api = window.api?.query as {
				inventoryStock?: { list: () => Promise<InventoryStockResponse> }
			}
			const fn = api?.inventoryStock?.list
			if (!fn) throw new Error('API stok inventory tidak tersedia.')
			return fn()
		}
	})

	const itemApi = (window.api?.query as {
		item?: { list: () => Promise<ItemListResponse> }
	}).item

	const { data: itemSource } = useQuery<ItemListResponse>({
		queryKey: ['item', 'list', 'for-medication-dispense-from-request'],
		queryFn: () => {
			const fn = itemApi?.list
			if (!fn) throw new Error('API item tidak tersedia.')
			return fn()
		}
	})

	const { data: itemCategorySource } = useQuery<ItemCategoryListResponse>({
		queryKey: ['itemCategory', 'list', 'for-medication-dispense-from-request'],
		queryFn: () => {
			const api = window.api?.query as {
				medicineCategory?: { list: () => Promise<ItemCategoryListResponse> }
			}
			const fn = api?.medicineCategory?.list
			if (!fn) throw new Error('API kategori item tidak tersedia.')
			return fn()
		}
	})

	const itemCategoryNameById = useMemo(() => {
		const entries: ItemCategoryAttributes[] = Array.isArray(itemCategorySource?.result)
			? itemCategorySource.result
			: []
		const map = new Map<number, string>()
		for (const cat of entries) {
			if (typeof cat.id === 'number' && typeof cat.name === 'string' && cat.name.length > 0) {
				map.set(cat.id, cat.name)
			}
		}
		return map
	}, [itemCategorySource?.result])

	const itemCategoryIdByItemId = useMemo(() => {
		const source: ItemAttributes[] = Array.isArray(itemSource?.result)
			? itemSource.result
			: []
		const map = new Map<number, number>()
		for (const item of source) {
			if (typeof item.id !== 'number') continue
			const directId =
				typeof item.itemCategoryId === 'number'
					? item.itemCategoryId
					: typeof item.category?.id === 'number'
					? item.category.id
					: undefined
			if (typeof directId === 'number') {
				map.set(item.id, directId)
			}
		}
		return map
	}, [itemSource?.result])

	const stockMapFromInventory = useMemo(() => {
		const map = new Map<string, { availableStock: number; unit: string }>()
		const stockList: InventoryStockItem[] = Array.isArray(inventoryStockData?.result)
			? inventoryStockData.result
			: []
		for (const s of stockList) {
			const kodeItem = s.kodeItem.trim().toUpperCase()
			if (!kodeItem) continue
			const availableStock = typeof s.availableStock === 'number' ? s.availableStock : 0
			const unit = s.unit
			map.set(kodeItem, { availableStock, unit })
		}
		return map
	}, [inventoryStockData?.result])

	const createDispenseMutation = useMutation({
		mutationKey: ['medicationDispense', 'createFromRequest', requestId],
		mutationFn: async (): Promise<DispenseCreateResult> => {
			if (!Number.isFinite(requestId)) {
				throw new Error('ID resep tidak valid')
			}
			if (!detail) {
				throw new Error('Detail resep belum tersedia')
			}
			const api = window.api?.query as {
				medicationDispense?: {
					createFromRequest: (args: {
						medicationRequestId: number
						quantity?: {
							value?: number
							unit?: string
						}
					}) => Promise<DispenseCreateResult>
				}
			}
			const fn = api?.medicationDispense?.createFromRequest
			if (!fn) {
				throw new Error('API MedicationDispense tidak tersedia.')
			}
			const recordsForGroup: MedicationRequestDetail[] =
				Array.isArray(groupListData) && groupListData.length > 0
					? groupListData
					: [detail]
			const toProcess: { record: MedicationRequestDetail; quantityValue: number; unit?: string }[] = []
			for (const record of recordsForGroup) {
				if (!record) continue
				if (record.status === 'completed') continue
				if (typeof record.id !== 'number' || !Number.isFinite(record.id)) continue
				const quantityFromRequest = record.dispenseRequest?.quantity?.value
				const unitFromRequest = record.dispenseRequest?.quantity?.unit
				const overrideForRecord =
					typeof record.id === 'number' ? quantityOverrides[record.id] : undefined
				const resolvedQuantity =
					typeof overrideForRecord === 'number' ? overrideForRecord : quantityFromRequest
				if (typeof resolvedQuantity !== 'number' || resolvedQuantity <= 0) {
					throw new Error('Qty Diambil harus lebih dari 0')
				}
				toProcess.push({
					record,
					quantityValue: resolvedQuantity,
					unit: unitFromRequest
				})
			}
			if (toProcess.length === 0) {
				throw new Error('Tidak ada resep yang dapat diproses.')
			}
			let lastResult: DispenseCreateResult | undefined
			for (const item of toProcess) {
				const args = {
					medicationRequestId: item.record.id as number,
					quantity: {
						value: item.quantityValue,
						unit: item.unit
					}
				}
				const result = await fn(args)
				if (!result.success) {
					const errorMessage = result.error || 'Gagal membuat MedicationDispense'
					throw new Error(errorMessage)
				}
				lastResult = result
			}
			if (!lastResult) {
				throw new Error('Gagal membuat dispense dari resep.')
			}
			return lastResult
		},
		onSuccess: (result) => {
			if (!result.success) {
				message.error(result.error || 'Gagal membuat MedicationDispense')
				return
			}
			const recordsForGroup: MedicationRequestDetail[] =
				Array.isArray(groupListData) && groupListData.length > 0
					? groupListData
					: detail
						? [detail]
						: []
			const hasOnlyItemRequests =
				recordsForGroup.length > 0 &&
				recordsForGroup.every((record) => {
					const hasValidItemId = typeof record.itemId === 'number' && record.itemId > 0
					const hasMedicationLink = typeof record.medication?.id === 'number'
					return hasValidItemId && !hasMedicationLink
				})
			if (hasOnlyItemRequests) {
				message.success('Dispense item berhasil dibuat. Lanjutkan serahkan obat dari daftar Medication Dispense.')
				navigate('/dashboard/medicine/medication-dispenses')
				return
			}
			message.success('Dispense berhasil dibuat dari resep')
			navigate('/dashboard/medicine/medication-dispenses')
		},
		onError: (error) => {
			const msg = error instanceof Error ? error.message : String(error)
			message.error(msg || 'Gagal memproses dispense')
		}
	})

	const completedQuantityByRequestId = useMemo(() => {
		const map = new Map<number, number>()
		const source: MedicationDispenseForSummary[] = Array.isArray(dispenseListData?.data)
			? dispenseListData.data
			: []

		source.forEach((item) => {
			const reqId = item.authorizingPrescriptionId
			if (typeof reqId !== 'number') return
			if (item.status !== 'completed') return
			const qty = item.quantity?.value
			if (typeof qty !== 'number') return
			const prev = map.get(reqId) ?? 0
			map.set(reqId, prev + qty)
		})

		return map
	}, [dispenseListData?.data])

	const isOutOfStockForCurrentQuantity = useMemo(() => {
		return false
	}, [])

	const tableData: TableRow[] = useMemo(() => {
		if (!detail) return []

		const records: MedicationRequestDetail[] =
			Array.isArray(groupListData) && groupListData.length > 0
				? groupListData
				: [detail]

		const rows: TableRow[] = []

			records.forEach((record) => {
			const quantityValue = record.dispenseRequest?.quantity?.value
			const quantityUnit = record.dispenseRequest?.quantity?.unit
				const instruksi = getInstructionText(record.dosageInstruction)
				const isItem = typeof record.itemId === 'number' && record.itemId > 0
			let stokSaatIni: number | undefined
			let unitStok: string | null = null
			if (isItem) {
				const kodeRaw = typeof record.item?.kode === 'string' ? record.item.kode : ''
				const kode = kodeRaw.trim().toUpperCase()
				if (kode) {
					const stockInfo = stockMapFromInventory.get(kode)
					if (stockInfo) {
						stokSaatIni = stockInfo.availableStock
						unitStok = stockInfo.unit
					}
				}
			} else {
					stokSaatIni =
						typeof record.medication?.stock === 'number' ? record.medication.stock : undefined
					unitStok = record.medication?.uom ?? null
				}

				let jenis: string
				if (isItem) {
					const itemIdForRow =
						typeof record.itemId === 'number' && record.itemId > 0
							? record.itemId
							: undefined
					let resolvedCategoryName: string | undefined
					if (typeof itemIdForRow === 'number') {
						const mappedCategoryId = itemCategoryIdByItemId.get(itemIdForRow)
						if (typeof mappedCategoryId === 'number') {
							const mappedName = itemCategoryNameById.get(mappedCategoryId)
							if (mappedName && mappedName.length > 0) {
								resolvedCategoryName = mappedName
							}
						}
					}
					if (!resolvedCategoryName) {
						const rawCategoryId =
							typeof record.item?.itemCategoryId === 'number'
								? record.item.itemCategoryId
								: undefined
						if (typeof rawCategoryId === 'number') {
							const fallbackName = itemCategoryNameById.get(rawCategoryId)
							if (fallbackName && fallbackName.length > 0) {
								resolvedCategoryName = fallbackName
							}
						}
					}
					jenis = resolvedCategoryName && resolvedCategoryName.length > 0 ? resolvedCategoryName : 'Item'
				} else {
					jenis = 'Obat Biasa'
				}

				const namaObat = isItem
					? record.item?.nama ?? '-'
					: record.medication?.name ?? '-'

			const medicationRequestId =
				typeof record.id === 'number' && Number.isFinite(record.id) ? record.id : undefined
			const overrideForRecord =
				typeof medicationRequestId === 'number'
					? quantityOverrides[medicationRequestId]
					: undefined

			const prescribed = typeof quantityValue === 'number' ? quantityValue : undefined
			let remainingForRecord: number | undefined

			if (typeof prescribed === 'number' && typeof medicationRequestId === 'number') {
				const completed = completedQuantityByRequestId.get(medicationRequestId) ?? 0
				const remaining = prescribed - completed
				if (remaining <= 0) {
					return
				}
				remainingForRecord = remaining
			}

			rows.push({
				key: `${record.id ?? record.patientId}`,
				jenis,
				namaObat,
				quantityDiminta:
					typeof remainingForRecord === 'number' && remainingForRecord >= 0
						? remainingForRecord
						: prescribed,
				unitDiminta: quantityUnit,
				instruksi,
				stokSaatIni,
				unitStok,
				quantityDiambil:
					typeof overrideForRecord === 'number'
						? overrideForRecord
						: (() => {
							if (typeof remainingForRecord === 'number' && remainingForRecord > 0) {
								return remainingForRecord
							}
							return prescribed
						})(),
				medicationRequestId
			})
		})

		return rows
	}, [detail, groupListData, stockMapFromInventory, quantityOverrides, completedQuantityByRequestId])

	const isPrescriptionFulfilled = useMemo(() => {
		const records: MedicationRequestDetail[] =
			Array.isArray(groupListData) && groupListData.length > 0
				? groupListData
				: detail
					? [detail]
					: []

		if (records.length === 0) return false

		for (const record of records) {
			if (record.status === 'completed') {
				continue
			}
			const prescribed = record.dispenseRequest?.quantity?.value
			if (typeof prescribed !== 'number') {
				return false
			}
			const medicationRequestId =
				typeof record.id === 'number' && Number.isFinite(record.id) ? record.id : undefined
			const completed =
				typeof medicationRequestId === 'number'
					? completedQuantityByRequestId.get(medicationRequestId) ?? 0
					: 0
			if (completed < prescribed) {
				return false
			}
		}

		return true
	}, [detail, groupListData, completedQuantityByRequestId])

	const isCreateDisabled =
		isPrescriptionFulfilled || isOutOfStockForCurrentQuantity

	const createDisabledReason = (() => {
		if (isPrescriptionFulfilled) {
			return 'Resep ini sudah terpenuhi, tidak dapat membuat dispense baru.'
		}
		if (isOutOfStockForCurrentQuantity) {
			return 'Stok obat tidak cukup untuk Qty Diambil yang dipilih.'
		}
		return undefined
	})()

	const columns = [
		{ title: 'Kategori Item', dataIndex: 'jenis', key: 'jenis' },
		{ title: 'Item', dataIndex: 'namaObat', key: 'namaObat' },
		{ title: 'Qty Diminta', dataIndex: 'quantityDiminta', key: 'quantityDiminta' },
		{ title: 'Satuan', dataIndex: 'unitDiminta', key: 'unitDiminta' },
		{ title: 'Stok Saat Ini', dataIndex: 'stokSaatIni', key: 'stokSaatIni' },
		{ title: 'Instruksi', dataIndex: 'instruksi', key: 'instruksi' },
		{
			title: 'Qty Diambil',
			dataIndex: 'quantityDiambil',
			key: 'quantityDiambil',
			render: (_: number | undefined, row: TableRow) => {
				if (typeof row.medicationRequestId !== 'number') {
					return row.quantityDiambil ?? row.quantityDiminta ?? null
				}
				const currentOverride = quantityOverrides[row.medicationRequestId]
				const baseValue =
					typeof row.quantityDiambil === 'number'
						? row.quantityDiambil
						: row.quantityDiminta
				const current =
					typeof currentOverride === 'number' ? currentOverride : baseValue
				return (
					<InputNumber
						min={0}
						value={current}
						onChange={(val) => {
							if (typeof val === 'number') {
								setQuantityOverrides((prev) => ({
									...prev,
									[row.medicationRequestId as number]: val
								}))
							} else {
								setQuantityOverrides((prev) => {
									const next = { ...prev }
									delete next[row.medicationRequestId as number]
									return next
								})
							}
						}}
					/>
				)
			}
		}
	]

	const patientName = getPatientDisplayName(detail?.patient)
	const authoredOnText = detail?.authoredOn
		? dayjs(detail.authoredOn).format('DD/MM/YYYY HH:mm')
		: '-'

	return (
		<div className="p-4 space-y-4">
			<h2 className="text-3xl font-bold mb-2">Proses Dispense dari Resep</h2>
			<Card loading={isLoading}>
				<Descriptions column={1} size="small" bordered>
					<Descriptions.Item label="Pasien">{patientName || '-'}</Descriptions.Item>
					<Descriptions.Item label="Status Resep">{detail?.status ?? '-'}</Descriptions.Item>
					<Descriptions.Item label="Tanggal Resep">{authoredOnText}</Descriptions.Item>
				</Descriptions>
			</Card>
			<Card title="Obat dalam Resep">
				<Table<TableRow>
					dataSource={tableData}
					columns={columns}
					pagination={false}
					rowKey="key"
					size="small"
				/>
				<div className="mt-4 flex justify-end gap-2">
					<Button onClick={() => navigate('/dashboard/medicine/medication-requests')}>
						Kembali ke Daftar Resep
					</Button>
					<Tooltip title={createDisabledReason}>
						<Popconfirm
							title="Konfirmasi pembuatan dispense"
							okText="Ya"
							cancelText="Tidak"
							onConfirm={() => createDispenseMutation.mutate()}
							disabled={isCreateDisabled}
						>
							<Button
								type="primary"
								loading={createDispenseMutation.isPending}
								disabled={isCreateDisabled}
							>
								Buat Dispense
							</Button>
						</Popconfirm>
					</Tooltip>
				</div>
				{isPrescriptionFulfilled && (
					<div className="mt-2 text-sm text-green-600">
						Resep ini sudah terpenuhi, tidak dapat membuat dispense baru.
					</div>
				)}
			</Card>
		</div>
	)
}
