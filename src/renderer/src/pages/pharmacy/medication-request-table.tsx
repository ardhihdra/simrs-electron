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
  patientId: string
  authoredOn?: string
  patient?: PatientInfo
  medication?: { name: string }
  encounter?: { id: string }
  requester?: { name: string }
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
    title: 'Obat', 
    dataIndex: 'medication', 
    key: 'medication', 
    render: (val: any) => val ? val.name : '-' 
  },
  { 
    title: 'Status', 
    dataIndex: 'status', 
    key: 'status',
    render: (val: string) => <Tag color={val === 'active' ? 'green' : 'default'}>{val}</Tag>
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
    render: (val: string) => val ? <Tag color={val === 'urgent' || val === 'stat' ? 'red' : 'blue'}>{val}</Tag> : '-'
  },
  { 
    title: 'Tanggal', 
    dataIndex: 'authoredOn', 
    key: 'authoredOn',
    render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-'
  },
  { 
    title: 'Aksi', 
    key: 'action', 
    width: 60, 
    align: 'center' as const, 
    render: (_: MedicationRequestAttributes, r: MedicationRequestAttributes) => <RowActions record={r} /> 
  }
]

function RowActions({ record }: { record: MedicationRequestAttributes }) {
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
    { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => typeof record.id === 'number' && navigate(`/dashboard/medicine/medication-requests/edit/${record.id}`) },
    { type: 'divider' },
    { key: 'delete', danger: true, label: 'Delete', icon: <DeleteOutlined />, onClick: () => typeof record.id === 'number' && deleteMutation.mutate(record.id) }
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
      const res = await fn({})
      console.log('MedicationRequest List Response (Renderer):', res)
      return res
    }
  })

  const filtered = useMemo(() => {
    const source: MedicationRequestAttributes[] = Array.isArray(data?.data)
      ? (data.data as MedicationRequestAttributes[])
      : []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => 
      getPatientDisplayName(p.patient).toLowerCase().includes(q) || 
      p.medication?.name?.toLowerCase().includes(q)
    )
  }, [data?.data, search])

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
      <Table dataSource={filtered} columns={columns} size="small" className="mt-4 rounded-xl shadow-sm" rowKey="id" scroll={{ x: 'max-content' }} />
    </div>
  )
}

export default MedicationRequestTable
