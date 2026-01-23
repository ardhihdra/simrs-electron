import { Button, Input, Table, Tag, message } from 'antd'
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
}

interface PerformerInfo {
	name?: string
}

interface MedicationDispenseAttributes {
	id?: number
	status: string
	medicationId: number
	patientId: string
	authorizingPrescriptionId?: number | null
	whenHandedOver?: string
	quantity?: QuantityInfo | null
	patient?: PatientInfo
	medication?: MedicationInfo
	performer?: PerformerInfo
	dosageInstruction?: DosageInstructionEntry[] | null
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
}

interface ParentRow {
	key: string
	patient?: PatientInfo
	status: string
	handedOverAt?: string
	items: DispenseItemRow[]
}

function RowActions({ record }: { record: DispenseItemRow }) {
	const updateMutation = useMutation({
		mutationKey: ['medicationDispense', 'update'],
		mutationFn: async () => {
			if (typeof record.id !== 'number') {
				throw new Error('ID MedicationDispense tidak valid.')
			}
			const fn = window.api?.query?.medicationDispense?.update
			if (!fn) throw new Error('API MedicationDispense tidak tersedia.')
			const payload = {
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

	const disabled =
		updateMutation.isPending ||
		record.status === 'completed' ||
		record.status === 'cancelled' ||
		record.status === 'declined' ||
		typeof record.id !== 'number'

	return (
		<Button
			type="primary"
			size="small"
			disabled={disabled}
			loading={updateMutation.isPending}
			onClick={() => updateMutation.mutate()}
		>
			Serahkan Obat
		</Button>
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
      const color = val === 'completed' ? 'green' : val === 'cancelled' ? 'red' : 'default'
      return <Tag color={color}>{val}</Tag>
    }
  },
  {
    title: 'Diserahkan',
    dataIndex: 'handedOverAt',
    key: 'handedOverAt'
  }
]

export function MedicationDispenseTable() {
	const navigate = useNavigate()
	const location = useLocation()
	const [search, setSearch] = useState('')
	const [showOnlyPending, setShowOnlyPending] = useState(false)

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

	const filtered = useMemo(() => {
		let source: MedicationDispenseAttributes[] = Array.isArray(data?.data)
			? data.data
			: []

		if (showOnlyPending) {
			source = source.filter((item) => item.status !== 'completed')
		}

		if (typeof prescriptionIdParam === 'number') {
			source = source.filter((item) => item.authorizingPrescriptionId === prescriptionIdParam)
		}

		const q = search.trim().toLowerCase()
		if (!q) return source

		return source.filter((item) => {
			const patientName = getPatientDisplayName(item.patient).toLowerCase()
			const medicineName = item.medication?.name?.toLowerCase() ?? ''
			return patientName.includes(q) || medicineName.includes(q)
		})
	}, [data?.data, search, showOnlyPending, prescriptionIdParam])

	const groupedData = useMemo<ParentRow[]>(() => {
		const groups = new Map<string, ParentRow>()

		filtered.forEach((item) => {
			const handedKey = item.whenHandedOver
				? dayjs(item.whenHandedOver).format('YYYY-MM-DD HH:mm')
				: 'pending'
			const key = `${item.patientId}-${handedKey}`

			const quantityValue = item.quantity?.value
			const quantityUnit = item.quantity?.unit
			const jenis = 'Obat Biasa'
			const instruksi = getInstructionText(item.dosageInstruction)

			const handedOverAt = item.whenHandedOver
				? dayjs(item.whenHandedOver).format('DD/MM/YYYY HH:mm')
				: '-'

			const rowItem: DispenseItemRow = {
				key: `${key}-${item.id ?? item.medicationId}`,
				id: item.id,
				jenis,
				medicineName: item.medication?.name,
				quantity: typeof quantityValue === 'number' ? quantityValue : undefined,
				unit: quantityUnit,
				status: item.status,
				performerName: item.performer?.name,
				instruksi
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
				<div className="flex gap-2 flex-wrap md:justify-end">
					<Button type={showOnlyPending ? 'primary' : 'default'} onClick={() => setShowOnlyPending((prev) => !prev)}>
						Belum diserahkan
					</Button>
					<Button onClick={() => refetch()}>Refresh</Button>
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
			{isError || (!data?.success && <div className="text-red-500">{data?.error}</div>)}
			<Table
				dataSource={groupedData}
				columns={columns}
				size="small"
				className="mt-4 rounded-xl shadow-sm"
				rowKey="key"
				scroll={{ x: 'max-content' }}
				expandable={{
					expandedRowRender: (record: ParentRow) => {
						const detailColumns = [
							{ title: 'Jenis Obat', dataIndex: 'jenis', key: 'jenis' },
							{ title: 'Nama Obat', dataIndex: 'medicineName', key: 'medicineName' },
							{ title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
							{ title: 'Satuan', dataIndex: 'unit', key: 'unit' },
							{ title: 'Instruksi', dataIndex: 'instruksi', key: 'instruksi' },
							{ title: 'Status', dataIndex: 'status', key: 'status' },
							{ title: 'Petugas', dataIndex: 'performerName', key: 'performerName' },
							{
									title: 'Aksi',
									key: 'action',
									render: (_: DispenseItemRow, row: DispenseItemRow) => <RowActions record={row} />
								}
						]

						return (
							<Table
								columns={detailColumns}
								dataSource={record.items}
								pagination={false}
								size="small"
								rowKey="key"
							/>
						)
					}
				}}
			/>
		</div>
	)
}

export default MedicationDispenseTable
