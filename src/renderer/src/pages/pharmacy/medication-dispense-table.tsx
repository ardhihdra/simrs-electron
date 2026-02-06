import { Button, Input, Table, Tag, Modal, Segmented, App as AntdApp } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import dayjs from 'dayjs'
import { queryClient } from '@renderer/query-client'

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

interface DosageInstructionEntry {
	text?: string
}

interface MedicationInfo {
	name?: string
	stock?: number
	uom?: string
}

interface PerformerInfo {
	name?: string
}

interface CategoryEntryInfo {
	text?: string
	code?: string
}

interface AuthorizingPrescriptionInfo {
	id?: number
	note?: string | null
	category?: CategoryEntryInfo[] | null
	medication?: MedicationInfo
	item?: {
		nama?: string
		itemCategoryId?: number | null
	} | null
	dosageInstruction?: DosageInstructionEntry[] | null
}

interface MedicationDispenseAttributes {
	id?: number
	status: string
	medicationId?: number | null
	itemId?: number | null
	patientId: string
	authorizingPrescriptionId?: number | null
	whenHandedOver?: string
	quantity?: QuantityInfo | null
	patient?: PatientInfo
	medication?: MedicationInfo
	performer?: PerformerInfo
	dosageInstruction?: DosageInstructionEntry[] | null
	authorizingPrescription?: AuthorizingPrescriptionInfo | null
}

interface MedicationDispenseListArgs {
  patientId?: string
  page?: number
  limit?: number
}

interface MedicationDispenseListResult {
  success: boolean
  data?: MedicationDispenseAttributes[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  error?: string
}

interface MedicationRequestQuantityInfo {
	value?: number
	unit?: string
}

interface MedicationRequestDispenseRequestInfo {
	quantity?: MedicationRequestQuantityInfo
}

interface MedicationRequestDetailForSummary {
	id?: number
	medication?: MedicationInfo
	dispenseRequest?: MedicationRequestDispenseRequestInfo | null
}

interface MedicationRequestDetailResult {
	success: boolean
	data?: MedicationRequestDetailForSummary
	error?: string
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
	nama?: string
	kode?: string
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

interface DispenseItemRow {
	key: string
	id?: number
	jenis: string
	medicineName?: string
	quantity?: number
	unit?: string
	status: string
	performerName?: string
	instruksi?: string
	availableStock?: number
}

interface ParentRow {
	key: string
	patient?: PatientInfo
	status: string
	handedOverAt?: string
	items: DispenseItemRow[]
}

type StatusFilter = 'all' | 'completed' | 'return'

function getStatusLabel(status: string): string {
	if (status === 'entered-in-error') return 'return'
	if (status === 'cancelled' || status === 'stopped' || status === 'declined') return 'cancel'
	if (status === 'preparation' || status === 'in-progress') return 'pending'
	if (status === 'on-hold') return 'hold'
	return status
}

function RowActions({ record, patient }: { record: DispenseItemRow; patient?: PatientInfo }) {
	const { message } = AntdApp.useApp()

	const updateMutation = useMutation({
		mutationKey: ['medicationDispense', 'update', 'complete'],
		mutationFn: async () => {
			if (typeof record.id !== 'number') {
				throw new Error('ID MedicationDispense tidak valid.')
			}
			const fn = window.api?.query?.medicationDispense?.update
			if (!fn) throw new Error('API MedicationDispense tidak tersedia.')
			const payload: { id: number; status: 'completed'; whenHandedOver: string } = {
				id: record.id,
				status: 'completed',
				whenHandedOver: new Date().toISOString()
			}
			const res = await fn(payload as never)
			if (!res.success) {
				throw new Error(res.error || 'Gagal memperbarui MedicationDispense')
			}
			return res
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['medicationDispense', 'list'] })
			message.success('Obat berhasil diserahkan')
		},
		onError: (error) => {
			const msg = error instanceof Error ? error.message : String(error)
			message.error(msg || 'Gagal menyerahkan obat')
		}
	})

	const voidMutation = useMutation({
		mutationKey: ['medicationDispense', 'update', 'void'],
		mutationFn: async () => {
			if (typeof record.id !== 'number') {
				throw new Error('ID MedicationDispense tidak valid.')
			}
			const fn = window.api?.query?.medicationDispense?.update
			if (!fn) throw new Error('API MedicationDispense tidak tersedia.')
			const payload: { id: number; status: 'entered-in-error' } = {
				id: record.id,
				status: 'entered-in-error'
			}
			const res = await fn(payload as never)
			if (!res.success) {
				throw new Error(res.error || 'Gagal melakukan Return/Void MedicationDispense')
			}
			return res
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['medicationDispense', 'list'] })
			message.success('Dispense berhasil di-void / dikembalikan')
		},
		onError: (error) => {
			const msg = error instanceof Error ? error.message : String(error)
			message.error(msg || 'Gagal melakukan Return/Void MedicationDispense')
		}
	})

	const isCompleted = record.status === 'completed'
	const isTerminal =
		record.status === 'cancelled' ||
		record.status === 'declined' ||
		record.status === 'entered-in-error'
	const quantityToDispense = typeof record.quantity === 'number' ? record.quantity : 0
	const hasStockInfo = typeof record.availableStock === 'number'
	const isStockInsufficient =
		hasStockInfo && quantityToDispense > (record.availableStock as number)
	const canComplete =
		!isCompleted && !isTerminal && typeof record.id === 'number' && !isStockInsufficient
	const canVoid = isCompleted && typeof record.id === 'number'

	const handlePrintLabel = () => {
		const patientLabel = getPatientDisplayName(patient)
		const name = record.medicineName ?? 'Obat'
		const quantityValue = typeof record.quantity === 'number' ? record.quantity : 0
		const unitLabel = record.unit ?? ''
		const instructionText = record.instruksi ?? ''

		const parts: string[] = []
		if (patientLabel.trim().length > 0) {
			parts.push(`Pasien: ${patientLabel}`)
		}
		parts.push(`Nama Obat: ${name}`)
		parts.push(`Qty: ${quantityValue} ${unitLabel}`.trim())
		if (instructionText.trim().length > 0) {
			parts.push(`Instruksi: ${instructionText}`)
		}

		if (parts.length === 0) {
			message.info('Data label obat tidak tersedia')
			return
		}

		const htmlLines = parts
			.map((line) => `<div class="line">${line}</div>`)
			.join('')
		const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Label Obat</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; margin: 8px; }
    .label { border: 1px solid #000; padding: 4px 8px; max-width: 320px; }
    .line { margin-bottom: 2px; }
  </style>
</head>
<body>
  <div class="label">
    ${htmlLines}
  </div>
</body>
</html>`

		const iframe = document.createElement('iframe')
		iframe.style.position = 'fixed'
		iframe.style.right = '0'
		iframe.style.bottom = '0'
		iframe.style.width = '0'
		iframe.style.height = '0'
		iframe.style.border = '0'
		document.body.appendChild(iframe)

		const iframeWindow = iframe.contentWindow
		if (!iframeWindow) {
			message.info('Gagal menyiapkan tampilan cetak label')
			iframe.remove()
			return
		}

		const doc = iframeWindow.document
		doc.open()
		doc.write(html)
		doc.close()

		iframeWindow.focus()
		iframeWindow.print()

		setTimeout(() => {
			iframe.remove()
		}, 1000)
	}

		return (
			<div className="flex flex-col items-start gap-1">
				<div className="flex gap-2">
					{canComplete && (
						<Button
							type="primary"
							size="small"
							disabled={updateMutation.isPending || isStockInsufficient}
							loading={updateMutation.isPending}
							onClick={() => updateMutation.mutate()}
						>
							Serahkan Obat
						</Button>
					)}
					{canVoid && (
						<Button
							type="default"
							size="small"
							danger
							disabled={voidMutation.isPending}
							loading={voidMutation.isPending}
							onClick={() => {
								Modal.confirm({
									title: 'Konfirmasi Return / Void',
									content:
										'Yakin ingin melakukan Return / Void dispense ini? Stok obat akan dikembalikan.',
									okText: 'Ya, Return / Void',
									cancelText: 'Batal',
									okButtonProps: { danger: true },
									onOk: () => voidMutation.mutate()
								})
							}}
						>
							Return / Void
						</Button>
					)}
					<Button type="default" size="small" onClick={handlePrintLabel}>
						Cetak Label
					</Button>
				</div>
				{isStockInsufficient && (
					<div className="text-xs text-red-500">
						Stok obat kosong / tidak cukup, tidak dapat menyerahkan obat.
					</div>
				)}
			</div>
		)
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

const columns = [
  {
    title: 'Pasien',
		dataIndex: 'patient',
    key: 'patient',
    render: (val: PatientInfo | undefined) => {
      const name = getPatientDisplayName(val)
      return name || '-'
    }
  },
  {
    title: 'Status',
		dataIndex: 'status',
    key: 'status',
    render: (val: string) => {
	      const color =
	        val === 'completed'
	          ? 'green'
	          : val === 'cancelled' || val === 'entered-in-error'
	          ? 'red'
	          : 'default'
	      return <Tag color={color}>{getStatusLabel(val)}</Tag>
    }
  },
  {
    title: 'Diserahkan',
    dataIndex: 'handedOverAt',
    key: 'handedOverAt'
  }
]

export function MedicationDispenseTable() {
	const { message } = AntdApp.useApp()

	const navigate = useNavigate()
	const location = useLocation()
	const [search, setSearch] = useState('')
	const [showOnlyPending, setShowOnlyPending] = useState(false)
		const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

	const prescriptionIdParam = useMemo(() => {
		const params = new URLSearchParams(location.search)
		const raw = params.get('authorizingPrescriptionId')
		if (!raw) return undefined
		const parsed = Number(raw)
		if (Number.isNaN(parsed)) return undefined
		return parsed
	}, [location.search])

	const { data, refetch, isError } = useQuery({
		queryKey: ['medicationDispense', 'list'],
		queryFn: async () => {
			const api = window.api?.query as {
				medicationDispense?: {
					list: (args: MedicationDispenseListArgs) => Promise<MedicationDispenseListResult>
				}
			}

			const fn = api?.medicationDispense?.list
			if (!fn) throw new Error('API MedicationDispense tidak tersedia.')

			const res = await fn({})
			return res
		}
	})

	const { data: itemCategorySource } = useQuery<ItemCategoryListResponse>({
		queryKey: ['itemCategory', 'list', 'for-medication-dispense-table'],
		queryFn: () => {
			const api = window.api?.query as {
				medicineCategory?: { list: () => Promise<ItemCategoryListResponse> }
			}
			const fn = api?.medicineCategory?.list
			if (!fn) throw new Error('API kategori item tidak tersedia.')
			return fn()
		}
	})

	const itemApi = (window.api?.query as {
		item?: { list: () => Promise<ItemListResponse> }
	}).item

	const { data: itemSource } = useQuery<ItemListResponse>({
		queryKey: ['item', 'list', 'for-medication-dispense'],
		queryFn: () => {
			const fn = itemApi?.list
			if (!fn) throw new Error('API item tidak tersedia.')
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

	const { data: prescriptionDetailData } = useQuery({
		queryKey: ['medicationRequest', 'detailForDispenseSummary', prescriptionIdParam],
		enabled: typeof prescriptionIdParam === 'number',
		queryFn: async () => {
			if (typeof prescriptionIdParam !== 'number') {
				throw new Error('Prescription ID tidak valid.')
			}
			const api = window.api?.query as {
				medicationRequest?: {
					getById: (args: { id: number }) => Promise<MedicationRequestDetailResult>
				}
			}
			const fn = api?.medicationRequest?.getById
			if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
			return fn({ id: prescriptionIdParam })
		}
	})

	const filtered = useMemo(() => {
		let source: MedicationDispenseAttributes[] = Array.isArray(data?.data)
			? data.data
			: []

		if (typeof prescriptionIdParam === 'number') {
			source = source.filter((item) => item.authorizingPrescriptionId === prescriptionIdParam)
		}

			if (statusFilter === 'completed') {
				source = source.filter((item) => item.status === 'completed')
			} else if (statusFilter === 'return') {
				source = source.filter((item) => item.status === 'entered-in-error')
			}

		const q = search.trim().toLowerCase()
		if (!q) return source

		return source.filter((item) => {
			const patientName = getPatientDisplayName(item.patient).toLowerCase()
			const medicineName = item.medication?.name?.toLowerCase() ?? ''
			return patientName.includes(q) || medicineName.includes(q)
		})
		}, [data?.data, search, prescriptionIdParam, statusFilter])

	const summaryForPrescription = useMemo(() => {
		if (typeof prescriptionIdParam !== 'number') return undefined

		const source: MedicationDispenseAttributes[] = Array.isArray(data?.data)
			? data.data
			: []

		let totalCompleted = 0

		source.forEach((item) => {
			if (item.authorizingPrescriptionId !== prescriptionIdParam) return
			const qty = item.quantity?.value
			if (typeof qty !== 'number') return
			if (item.status === 'completed') {
				totalCompleted += qty
			}
		})

		const prescribedQuantity =
			prescriptionDetailData?.data?.dispenseRequest?.quantity?.value
		const quantityUnit =
			prescriptionDetailData?.data?.dispenseRequest?.quantity?.unit

		let remaining: number | undefined
		if (typeof prescribedQuantity === 'number') {
			remaining = prescribedQuantity - totalCompleted
			if (remaining < 0) {
				remaining = 0
			}
		}

		const medicationName = prescriptionDetailData?.data?.medication?.name
		const isFulfilled =
			typeof prescribedQuantity === 'number' && typeof remaining === 'number' && remaining === 0

		return {
			prescribedQuantity,
			totalCompleted,
			remaining,
			unit: quantityUnit,
			medicationName,
			isFulfilled
		}
	}, [data?.data, prescriptionDetailData, prescriptionIdParam])

	const groupedData = useMemo<ParentRow[]>(() => {
		const groups = new Map<string, ParentRow>()

		filtered.forEach((item) => {
			const handedKey = item.whenHandedOver
				? dayjs(item.whenHandedOver).format('YYYY-MM-DD HH:mm')
				: 'pending'
			const key = `${item.patientId}-${handedKey}`

			const quantityValue = item.quantity?.value
			const quantityUnit = item.quantity?.unit
			const instruksi = getInstructionText(item.dosageInstruction)
			const isItem = typeof item.itemId === 'number' && item.itemId > 0
			const prescription = item.authorizingPrescription
			const categories = Array.isArray(prescription?.category) ? prescription?.category : []
			const hasRacikanCategory = categories.some((cat) => {
				const text = cat.text?.toLowerCase() ?? ''
				const code = cat.code?.toLowerCase() ?? ''
				return text.includes('racikan') || code === 'compound'
			})
			const noteText = (prescription?.note ?? '').toLowerCase()
			const isRacikan = hasRacikanCategory || noteText.includes('racikan')

			let jenis: string
			if (isItem) {
				const itemIdForRow =
					typeof item.itemId === 'number' && item.itemId > 0
						? item.itemId
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
						typeof prescription?.item?.itemCategoryId === 'number'
							? prescription.item.itemCategoryId
							: undefined
					if (typeof rawCategoryId === 'number') {
						const fallbackName = itemCategoryNameById.get(rawCategoryId)
						if (fallbackName && fallbackName.length > 0) {
							resolvedCategoryName = fallbackName
						}
					}
				}
				jenis = resolvedCategoryName && resolvedCategoryName.length > 0 ? resolvedCategoryName : 'Item'
			} else if (isRacikan) {
				jenis = 'Obat Racikan'
			} else {
				jenis = 'Obat Biasa'
			}

			let medicineName: string | undefined
			if (isItem) {
				const itemNameFromPrescription = prescription?.item?.nama
				medicineName = itemNameFromPrescription ?? item.medication?.name
			} else if (isRacikan) {
				const baseName = item.medication?.name ?? prescription?.medication?.name
				const rawNote = prescription?.note ?? ''
				const note = rawNote.trim()
				if (note.length > 0 && baseName) {
					medicineName = `${baseName} - ${note}`
				} else if (baseName) {
					medicineName = baseName
				} else if (note.length > 0) {
					medicineName = note
				} else {
					medicineName = undefined
				}
			} else {
				medicineName = item.medication?.name ?? prescription?.medication?.name
			}

			const handedOverAt = item.whenHandedOver
				? dayjs(item.whenHandedOver).format('DD/MM/YYYY HH:mm')
				: '-'

			const rowItem: DispenseItemRow = {
				key: `${key}-${item.id ?? item.medicationId ?? item.itemId ?? ''}`,
				id: item.id,
				jenis,
				medicineName,
				quantity: typeof quantityValue === 'number' ? quantityValue : undefined,
				unit: quantityUnit,
				status: item.status,
				performerName: item.performer?.name,
				instruksi,
				availableStock: typeof item.medication?.stock === 'number' ? item.medication.stock : undefined
			}

			const existing = groups.get(key)
			if (!existing) {
				groups.set(key, {
					key,
					patient: item.patient,
					status: item.status,
					handedOverAt,
					items: [rowItem]
				})
			} else {
				existing.items.push(rowItem)
			}
		})

		return Array.from(groups.values())
	}, [filtered])

	const groupedDataForTable = useMemo<ParentRow[]>(() => {
		if (!showOnlyPending) return groupedData
		return groupedData.filter((group) =>
			group.items.some((item) => item.status !== 'completed')
		)
	}, [groupedData, showOnlyPending])

		return (
			<div>
				<h2 className="text-4xl font-bold mb-4 justify-center flex">Penyerahan Obat (Dispensing)</h2>
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
					<Input
						type="text"
						placeholder="Cari Pasien atau Obat"
						className="w-full md:max-w-sm"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<div className="flex gap-2 flex-wrap md:justify-end items-center">
						<Segmented
							options={[
								{ label: 'Semua', value: 'all' },
								{ label: 'Selesai', value: 'completed' },
								{ label: 'Return', value: 'return' }
							]}
							value={statusFilter}
							onChange={(val) => setStatusFilter(val as StatusFilter)}
						/>
						<Button type={showOnlyPending ? 'primary' : 'default'} onClick={() => setShowOnlyPending((prev) => !prev)}>
							Belum diserahkan
						</Button>
						<Button onClick={() => refetch()}>Refresh</Button>
						<Button onClick={() => navigate('/dashboard/medicine/medication-dispenses/report')}>
							Laporan Harian
						</Button>
						<Button onClick={() => navigate('/dashboard/medicine/medication-requests')}>
							Ke Daftar Resep
						</Button>
					</div>
				</div>
			{typeof prescriptionIdParam === 'number' && (
				<div className="mt-2 text-sm text-gray-500">
					Menampilkan riwayat dispense untuk resep ID {prescriptionIdParam}
				</div>
			)}
			{summaryForPrescription && (
				<div className="mt-2 text-sm bg-gray-50 rounded-md p-2 inline-block">
					{summaryForPrescription.medicationName && (
						<div className="font-semibold">
							Resep: {summaryForPrescription.medicationName}
						</div>
					)}
					<div>
						Diresepkan:{' '}
						{typeof summaryForPrescription.prescribedQuantity === 'number'
							? `${summaryForPrescription.prescribedQuantity} ${summaryForPrescription.unit ?? ''}`.trim()
							: '-'}
					</div>
					<div>
						Sudah diambil:{' '}
						{`${summaryForPrescription.totalCompleted} ${summaryForPrescription.unit ?? ''}`.trim()}
					</div>
					{typeof summaryForPrescription.prescribedQuantity === 'number' && (
						<div>
							Sisa:{' '}
							{`${summaryForPrescription.remaining ?? 0} ${summaryForPrescription.unit ?? ''}`.trim()}
						</div>
					)}
					{summaryForPrescription.isFulfilled && (
						<div className="mt-1 text-green-600 font-semibold">
							Permintaan sudah terpenuhi
						</div>
					)}
				</div>
			)}
			{isError || (!data?.success && <div className="text-red-500">{data?.error}</div>)}
			<Table
				dataSource={groupedDataForTable}
				columns={columns}
				size="small"
				className="mt-4 rounded-xl shadow-sm"
				rowKey="key"
				scroll={{ x: 'max-content' }}
				expandable={{
					expandedRowRender: (record: ParentRow) => {
						const patientLabel = getPatientDisplayName(record.patient)
						const handlePrintAllLabels = () => {
							const labelLinesList: string[][] = record.items
								.map((item) => {
									const name = item.medicineName ?? 'Obat'
									const quantityValue = typeof item.quantity === 'number' ? item.quantity : 0
									const unitLabel = item.unit ?? ''
									const instructionText = item.instruksi ?? ''

									const lines: string[] = []
									if (patientLabel.trim().length > 0) {
										lines.push(`Pasien: ${patientLabel}`)
									}
									lines.push(`Nama Obat: ${name}`)
									lines.push(`Qty: ${quantityValue} ${unitLabel}`.trim())
									if (instructionText.trim().length > 0) {
										lines.push(`Instruksi: ${instructionText}`)
									}
									return lines
								})
								.filter((lines) => lines.length > 0)

							if (labelLinesList.length === 0) {
								message.info('Data label obat tidak tersedia')
								return
							}

							const labelBlocks = labelLinesList
								.map((lines) => {
									const inner = lines
										.map((line) => `<div class="line">${line}</div>`)
										.join('')
									return `<div class="label">${inner}</div>`
								})
								.join('')

							const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Label Obat</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; margin: 8px; }
    .label { border: 1px solid #000; padding: 4px 8px; max-width: 320px; margin-bottom: 8px; }
    .line { margin-bottom: 2px; }
  </style>
</head>
<body>
  ${labelBlocks}
</body>
</html>`

							const iframe = document.createElement('iframe')
							iframe.style.position = 'fixed'
							iframe.style.right = '0'
							iframe.style.bottom = '0'
							iframe.style.width = '0'
							iframe.style.height = '0'
							iframe.style.border = '0'
							document.body.appendChild(iframe)

							const iframeWindow = iframe.contentWindow
							if (!iframeWindow) {
								message.info('Gagal menyiapkan tampilan cetak semua label')
								iframe.remove()
								return
							}

							const doc = iframeWindow.document
							doc.open()
							doc.write(html)
							doc.close()

							iframeWindow.focus()
							iframeWindow.print()

							setTimeout(() => {
								iframe.remove()
							}, 1000)
						}
					const detailColumns = [
						{ title: 'Kategori Item', dataIndex: 'jenis', key: 'jenis' },
						{ title: 'Item', dataIndex: 'medicineName', key: 'medicineName' },
						{ title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
						{ title: 'Satuan', dataIndex: 'unit', key: 'unit' },
						{ title: 'Instruksi', dataIndex: 'instruksi', key: 'instruksi' },
						{
							title: 'Status',
							dataIndex: 'status',
							key: 'status',
							render: (val: string) => getStatusLabel(val)
						},
							{ title: 'Petugas', dataIndex: 'performerName', key: 'performerName' },
						{
							title: 'Aksi',
							key: 'action',
							render: (_: DispenseItemRow, row: DispenseItemRow) => (
								<RowActions record={row} patient={record.patient} />
							)
						}
						]

						return (
							<div>
								<div className="mb-2 flex justify-end">
									<Button size="small" onClick={handlePrintAllLabels}>
										Cetak Semua Label
									</Button>
								</div>
								<Table
									columns={detailColumns}
									dataSource={record.items}
									pagination={false}
									size="small"
									rowKey="key"
								/>
							</div>
						)
					}
				}}
			/>
		</div>
	)
}

export default MedicationDispenseTable
