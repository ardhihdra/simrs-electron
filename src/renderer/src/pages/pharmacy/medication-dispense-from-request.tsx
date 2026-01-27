import { Button, Card, Descriptions, InputNumber, Table, Tooltip, message } from 'antd'
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

interface MedicationRequestDetail {
	id?: number
	status: string
	intent: string
	priority?: string
	patientId: string
	authoredOn?: string
	patient?: PatientInfo
	medication?: MedicationInfo
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
	const [quantityOverride, setQuantityOverride] = useState<number | undefined>(undefined)

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
			const baseQuantity = detail.dispenseRequest?.quantity?.value
			const unit = detail.dispenseRequest?.quantity?.unit
			const valueToUse = typeof quantityOverride === 'number' ? quantityOverride : baseQuantity
			const stokSaatIni = typeof detail.medication?.stock === 'number' ? detail.medication.stock : undefined
			if (typeof valueToUse !== 'number' || valueToUse <= 0) {
				throw new Error('Qty Diambil harus lebih dari 0')
			}
			if (typeof stokSaatIni === 'number' && valueToUse > stokSaatIni) {
				throw new Error(
					`Qty Diambil tidak boleh melebihi stok yang tersedia (stok: ${stokSaatIni})`
				)
			}
			const args: {
				medicationRequestId: number
				quantity?: {
					value?: number
					unit?: string
				}
			} = {
				medicationRequestId: requestId
			}
			args.quantity = {
				value: valueToUse,
				unit
			}
			return fn(args)
		},
		onSuccess: (result) => {
			if (!result.success) {
				message.error(result.error || 'Gagal membuat MedicationDispense')
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

	const detail: MedicationRequestDetail | undefined = data?.data

	const remainingQuantityFromHistory = useMemo(() => {
		if (!detail || typeof detail.id !== 'number') return undefined
		const prescribed = detail.dispenseRequest?.quantity?.value
		if (typeof prescribed !== 'number') return undefined

		const source: MedicationDispenseForSummary[] = Array.isArray(dispenseListData?.data)
			? dispenseListData.data
			: []

		let totalCompleted = 0

		source.forEach((item) => {
			if (item.authorizingPrescriptionId !== detail.id) return
			const qty = item.quantity?.value
			if (typeof qty !== 'number') return
			if (item.status === 'completed') {
				totalCompleted += qty
			}
		})

		const remaining = prescribed - totalCompleted
		if (remaining <= 0) return 0
		return remaining
	}, [detail, dispenseListData?.data])

	const isOutOfStockForCurrentQuantity = useMemo(() => {
		if (!detail) return false
		const stokSaatIni =
			typeof detail.medication?.stock === 'number' ? detail.medication.stock : undefined
		const baseQuantity = detail.dispenseRequest?.quantity?.value
		const valueToUse =
			typeof quantityOverride === 'number' ? quantityOverride : baseQuantity
		if (typeof stokSaatIni !== 'number') return false
		if (typeof valueToUse !== 'number') return false
		return valueToUse > stokSaatIni
	}, [detail, quantityOverride])

	const tableData: TableRow[] = useMemo(() => {
		if (!detail) return []
		const quantityValue = detail.dispenseRequest?.quantity?.value
		const quantityUnit = detail.dispenseRequest?.quantity?.unit
		const instruksi = getInstructionText(detail.dosageInstruction)
		const stokSaatIni = typeof detail.medication?.stock === 'number' ? detail.medication.stock : undefined
		const unitStok = detail.medication?.uom ?? null

		return [
			{
				key: String(detail.id ?? detail.patientId),
				jenis: 'Obat Biasa',
				namaObat: detail.medication?.name ?? '-',
				quantityDiminta: typeof quantityValue === 'number' ? quantityValue : undefined,
				unitDiminta: quantityUnit,
				instruksi,
				stokSaatIni,
				unitStok,
				quantityDiambil: quantityOverride ?? (typeof quantityValue === 'number' ? quantityValue : undefined)
			}
		]
	}, [detail, quantityOverride])

	const isPrescriptionFulfilled = useMemo(() => {
		if (!detail) return false
		if (detail.status === 'completed') return true
		if (typeof remainingQuantityFromHistory === 'number') {
			return remainingQuantityFromHistory <= 0
		}
		return false
	}, [detail, remainingQuantityFromHistory])

	const isCreateDisabled = isPrescriptionFulfilled || isOutOfStockForCurrentQuantity

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
		{ title: 'Jenis Obat', dataIndex: 'jenis', key: 'jenis' },
		{ title: 'Nama Obat', dataIndex: 'namaObat', key: 'namaObat' },
		{ title: 'Qty Diminta', dataIndex: 'quantityDiminta', key: 'quantityDiminta' },
		{ title: 'Satuan', dataIndex: 'unitDiminta', key: 'unitDiminta' },
		{ title: 'Stok Saat Ini', dataIndex: 'stokSaatIni', key: 'stokSaatIni' },
		{ title: 'Instruksi', dataIndex: 'instruksi', key: 'instruksi' },
		{
			title: 'Qty Diambil',
			dataIndex: 'quantityDiambil',
			key: 'quantityDiambil',
			render: (_: number | undefined, row: TableRow) => {
				const current = quantityOverride ?? row.quantityDiminta
				return (
					<InputNumber
						min={0}
						value={current}
						onChange={(val) => {
							if (typeof val === 'number') {
								setQuantityOverride(val)
							} else {
								setQuantityOverride(undefined)
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
						<Button
							type="primary"
							loading={createDispenseMutation.isPending}
							disabled={isCreateDisabled}
							onClick={() => createDispenseMutation.mutate()}
						>
							Buat Dispense
						</Button>
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
