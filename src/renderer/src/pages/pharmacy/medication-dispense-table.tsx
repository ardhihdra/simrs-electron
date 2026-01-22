import { Button, Input, Table, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
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
  whenHandedOver?: string
  quantity?: QuantityInfo | null
  patient?: PatientInfo
  medication?: MedicationInfo
  performer?: PerformerInfo
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

interface RowData {
  key: string
  id?: number
  patient?: PatientInfo
  status: string
  medicineName?: string
  quantityText?: string
  handedOverAt?: string
  performerName?: string
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
    title: 'Obat',
    dataIndex: 'medicineName',
    key: 'medicineName'
  },
  {
    title: 'Quantity',
    dataIndex: 'quantityText',
    key: 'quantityText'
  },
  {
    title: 'Diserahkan',
    dataIndex: 'handedOverAt',
    key: 'handedOverAt'
  },
  {
    title: 'Petugas',
    dataIndex: 'performerName',
    key: 'performerName'
  }
]

export function MedicationDispenseTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

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
      console.log('MedicationDispenseTable query result:', res)
      return res
    }
  })

  const filtered = useMemo(() => {
    const source: MedicationDispenseAttributes[] = Array.isArray(data?.data)
      ? data.data
      : []
    const q = search.trim().toLowerCase()
    if (!q) return source

    return source.filter((item) => {
      const patientName = getPatientDisplayName(item.patient).toLowerCase()
      const medicineName = item.medication?.name?.toLowerCase() ?? ''
      return patientName.includes(q) || medicineName.includes(q)
    })
  }, [data?.data, search])

  const tableData: RowData[] = useMemo(() => {
    return filtered.map((item) => {
      const quantityValue = item.quantity?.value
      const quantityUnit = item.quantity?.unit
      const quantityText = typeof quantityValue === 'number'
        ? `${quantityValue}${quantityUnit ? ` ${quantityUnit}` : ''}`
        : '-'

      const handedOverAt = item.whenHandedOver
        ? dayjs(item.whenHandedOver).format('DD/MM/YYYY HH:mm')
        : '-'

      return {
        key: String(item.id ?? `${item.patientId}-${item.medicationId}`),
        id: item.id,
        patient: item.patient,
        status: item.status,
        medicineName: item.medication?.name,
        quantityText,
        handedOverAt,
        performerName: item.performer?.name
      }
    })
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
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button onClick={() => navigate('/dashboard/medicine/medication-requests')}>
            Ke Daftar Resep
          </Button>
        </div>
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.error}</div>)}
      <Table
        dataSource={tableData}
        columns={columns}
        size="small"
        className="mt-4 rounded-xl shadow-sm"
        rowKey="key"
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default MedicationDispenseTable
