import { Button, Dropdown, Input, Table, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'
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

interface GroupIdentifier {
  system?: string
  value?: string
}

interface CategoryEntry {
  text?: string
  code?: string
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

interface PatientInfo {
  name?: string | PatientNameEntry[]
  identifier?: PatientIdentifier[]
  mrNo?: string
}

interface MedicationRequestAttributes {
  id?: number
  status: string
  intent: string
  priority?: string
  medicationId?: number | null
	itemId?: number | null
  patientId: string
  authoredOn?: string
  patient?: PatientInfo
  medication?: { name?: string }
	item?: { nama?: string }
	note?: string | null
  encounter?: { id: string }
  requester?: { name: string }
  groupIdentifier?: GroupIdentifier | null
  category?: CategoryEntry[] | null
  dosageInstruction?: DosageInstructionEntry[] | null
  dispenseRequest?: DispenseRequestInfo | null
}

interface MedicationItemRow {
	key: string
	jenis: string
	namaObat: string
	quantity?: number
	unit?: string
	instruksi?: string
}

interface ParentRow {
	key: string
	baseId?: number
	patient?: PatientInfo
	status: string
	intent: string
	priority?: string
	authoredOn?: string
	isPartial?: boolean
	items: MedicationItemRow[]
}

interface MedicationDispenseQuantityInfo {
	value?: number
	unit?: string
}

interface MedicationDispenseForFilter {
	id?: number
	authorizingPrescriptionId?: number | null
	status?: string
	quantity?: MedicationDispenseQuantityInfo | null
}

interface MedicationDispenseListResultForFilter {
	success: boolean
	data?: MedicationDispenseForFilter[]
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

function isCompound(record: MedicationRequestAttributes): boolean {
  const categories = record.category ?? []
  return categories.some((category) => {
    const code = category.code?.toLowerCase()
    const text = category.text?.toLowerCase()
    return code === 'compound' || text === 'racikan'
  })
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
		render: (val: string, record: ParentRow) => {
			if (val === 'active' && record.isPartial) {
				return <Tag color="gold">active (parsial)</Tag>
			}
			return <Tag color={val === 'active' ? 'green' : 'default'}>{val}</Tag>
		}
  },
  {
    title: 'Tujuan',
    dataIndex: 'intent',
    key: 'intent'
  },
  {
    title: 'Prioritas',
    dataIndex: 'priority',
    key: 'priority',
    render: (val: string) =>
      val ? (
        <Tag color={val === 'urgent' || val === 'stat' ? 'red' : 'blue'}>{val}</Tag>
      ) : (
        '-'
      )
  },
  {
    title: 'Tanggal',
    dataIndex: 'authoredOn',
    key: 'authoredOn',
    render: (val: string) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-')
  },
  {
    title: 'Aksi',
    key: 'action',
    width: 60,
    align: 'center' as const,
    render: (_: ParentRow, r: ParentRow) => <RowActions record={r} />
  }
]

function RowActions({ record }: { record: ParentRow }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['medicationRequest', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.medicationRequest?.deleteById
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    {
      key: 'process-dispense',
      label: 'Proses Dispense',
      onClick: () => {
        if (typeof record.baseId === 'number') {
          navigate(`/dashboard/medicine/medication-requests/dispense/${record.baseId}`)
        }
      }
    },
		{
			key: 'history',
			label: 'Riwayat Dispense',
			onClick: () => {
				if (typeof record.baseId === 'number') {
					navigate(
						`/dashboard/medicine/medication-dispenses?authorizingPrescriptionId=${record.baseId}`
					)
				}
			}
		},
    { type: 'divider' },
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () =>
        typeof record.baseId === 'number' &&
        navigate(`/dashboard/medicine/medication-requests/edit/${record.baseId}`)
    },
    { type: 'divider' },
    {
      key: 'delete',
      danger: true,
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () =>
        typeof record.baseId === 'number' && deleteMutation.mutate(record.baseId)
    }
  ]
  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button aria-label="Actions" className="p-1 rounded hover:bg-gray-100">
        <MoreOutlined />
      </button>
    </Dropdown>
  )
}

export function MedicationRequestTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
	const { data, refetch, isError } = useQuery({
		queryKey: ['medicationRequest', 'list'],
		queryFn: async () => {
			const fn = window.api?.query?.medicationRequest?.list
			if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
			return fn({})
		}
	})

	const { data: dispenseListData } = useQuery({
		queryKey: ['medicationDispense', 'forStatus'],
		queryFn: async () => {
			const api = window.api?.query as {
				medicationDispense?: {
					list: (args?: { limit?: number }) => Promise<MedicationDispenseListResultForFilter>
				}
			}
			const fn = api?.medicationDispense?.list
			if (!fn) throw new Error('API MedicationDispense tidak tersedia.')
			return fn({ limit: 1000 })
		}
	})

	const dispensedSummaryByRequestId = useMemo(() => {
		const source: MedicationDispenseForFilter[] = Array.isArray(dispenseListData?.data)
			? dispenseListData.data
			: []

		const map = new Map<number, { totalCompleted: number }>()

		source.forEach((item) => {
			if (typeof item.authorizingPrescriptionId !== 'number') return
			if (item.status !== 'completed') return
			const qty = item.quantity?.value
			if (typeof qty !== 'number') return
			const prev = map.get(item.authorizingPrescriptionId) ?? { totalCompleted: 0 }
			map.set(item.authorizingPrescriptionId, {
				totalCompleted: prev.totalCompleted + qty
			})
		})

		return map
	}, [dispenseListData?.data])

	const filtered = useMemo(() => {
		const source: MedicationRequestAttributes[] = Array.isArray(data?.data)
			? (data.data as MedicationRequestAttributes[])
			: []

		const baseFiltered = source.filter((request) => request.status === 'active')

		const q = search.trim().toLowerCase()
		if (!q) return baseFiltered
		return baseFiltered.filter((p) => {
			const patientName = getPatientDisplayName(p.patient).toLowerCase()
			const medicineName = p.medication?.name?.toLowerCase() ?? ''
			const itemName = p.item?.nama?.toLowerCase() ?? ''
			return (
				patientName.includes(q) ||
				medicineName.includes(q) ||
				itemName.includes(q)
			)
		})
	}, [data?.data, search])

  const groupedData = useMemo<ParentRow[]>(() => {
		const groups = new Map<string, ParentRow>()

		filtered.forEach((record) => {
      const groupId = record.groupIdentifier?.value
      const key = groupId && groupId.trim().length > 0 ? groupId : `single-${record.id ?? ''}`

			const isItem = typeof record.itemId === 'number' && record.itemId > 0
			const compound = isCompound(record)
			const racikanTitleMatch = compound ? record.note?.match(/^\[Racikan:([^\]]+)\]/) : null
			const racikanName =
				racikanTitleMatch && racikanTitleMatch[1]
					? racikanTitleMatch[1].trim()
					: undefined

			let remainingQuantity: number | undefined
			const prescribedQuantity = record.dispenseRequest?.quantity?.value
			if (typeof record.id === 'number' && typeof prescribedQuantity === 'number') {
				const summary = dispensedSummaryByRequestId.get(record.id)
				const completed = summary?.totalCompleted ?? 0
				const diff = prescribedQuantity - completed
				remainingQuantity = diff > 0 ? diff : 0
			}

			const item: MedicationItemRow = {
				key: `${key}-${record.id ?? ''}`,
				jenis: isItem ? 'Item' : compound ? 'Racikan' : 'Obat Biasa',
				namaObat: isItem
					? record.item?.nama ?? '-'
					: compound
						? racikanName ?? record.medication?.name ?? '-'
						: record.medication?.name ?? '-',
				quantity:
					typeof remainingQuantity === 'number'
						? remainingQuantity
						: record.dispenseRequest?.quantity?.value,
				unit: record.dispenseRequest?.quantity?.unit,
				instruksi: getInstructionText(record.dosageInstruction)
			}

      const existing = groups.get(key)
      if (!existing) {
				let isPartial = false
				if (typeof record.id === 'number') {
					const summary = dispensedSummaryByRequestId.get(record.id)
					const prescribed = record.dispenseRequest?.quantity?.value
					const completed = summary?.totalCompleted ?? 0
					if (typeof prescribed === 'number' && completed > 0 && completed < prescribed) {
						isPartial = true
					}
				}
        groups.set(key, {
          key,
          baseId: record.id,
          patient: record.patient,
          status: record.status,
          intent: record.intent,
          priority: record.priority,
					authoredOn: record.authoredOn,
					isPartial,
          items: [item]
        })
      } else {
        existing.items.push(item)
      }
    })

		return Array.from(groups.values())
	}, [filtered, dispensedSummaryByRequestId])

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Permintaan Obat (Resep)</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input type="text" placeholder="Cari Pasien atau Obat" className="w-full md:max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" onClick={() => navigate('/dashboard/medicine/medication-requests/create')}>Tambah Permintaan</Button>
        </div>
      </div>
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
              { title: 'Jenis', dataIndex: 'jenis', key: 'jenis' },
              { title: 'Nama Obat', dataIndex: 'namaObat', key: 'namaObat' },
              { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
              { title: 'Satuan', dataIndex: 'unit', key: 'unit' },
              { title: 'Instruksi', dataIndex: 'instruksi', key: 'instruksi' }
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

export default MedicationRequestTable
