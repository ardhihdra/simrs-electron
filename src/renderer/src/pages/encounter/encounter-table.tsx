import { Button, DatePicker, Input, Select, Table } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import type { EncounterAttributes } from '@shared/encounter'
import { EncounterStatus } from '@shared/encounter'
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

export type EncounterListResult = {
    success: boolean
    data?: EncounterRow[]
    error?: string
}
type EncounterRow = Omit<EncounterAttributes, 'visitDate' | 'status'> & {
  visitDate: string | Date
  status: EncounterStatus | 'scheduled' | 'in_progress' | 'completed'
  patient?: { name?: string }
}

type Row = EncounterRow & { no: number }

const columns: ColumnsType<Row> = [
  { title: 'No.', dataIndex: 'no', key: 'no', width: 60 },
  { title: 'Tanggal Kunjungan', dataIndex: 'visitDate', key: 'visitDate', render: (v: string | Date) => (v ? dayjs(v).format('DD MMMM YYYY HH:mm') : '-') },
  { title: 'Pasien', dataIndex: ['patient', 'name'], key: 'patient' },
  { title: 'Layanan', dataIndex: 'serviceType', key: 'serviceType' },
  { title: 'Alasan', dataIndex: 'reason', key: 'reason' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
  { title: 'Catatan', dataIndex: 'note', key: 'note' },
  {
    title: 'Action',
    key: 'action',
    width: 100,
    render: (_: Row, record: Row) => (
      <RowActions record={record} />
    )
  }
]

function RowActions({ record }: { record: Row }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['encounter', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.encounter?.deleteById
      if (!fn) throw new Error('API encounter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounter', 'list'] })
    }
  })
  return (
    <div className="flex gap-2">
      <EyeOutlined onClick={() => { if (typeof record.id === 'number') navigate(`/dashboard/encounter/edit/${record.id}`) }} />
      <EditOutlined onClick={() => { if (typeof record.id === 'number') navigate(`/dashboard/encounter/edit/${record.id}`) }} />
      <DeleteOutlined onClick={() => { if (typeof record.id === 'number') deleteMutation.mutate(record.id) }} />
    </div>
  )
}

export function EncounterTable() {
  const navigate = useNavigate()
  const [searchPatient, setSearchPatient] = useState('')
  const [searchService, setSearchService] = useState('')
  const [searchReason, setSearchReason] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [visitDate, setVisitDate] = useState<string | null>(null)
  type EncounterListResult = {
    success: boolean
    data?: EncounterRow[]
    error?: string
  }
  const [search, setSearch] = useState('')

  const { data, refetch, isError } = useQuery<EncounterListResult>({
    queryKey: ['encounter', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn() as Promise<EncounterListResult>
    }
  })

  const filtered = useMemo(() => {
    const source: EncounterRow[] = Array.isArray(data?.data) ? (data!.data as EncounterRow[]) : []
    const rows: Row[] = source.map((e, idx) => ({ ...e, no: idx + 1 }))
    return rows.filter((r) => {
      const matchPatient = searchPatient ? String(r.patient?.name || '').toLowerCase().includes(searchPatient.toLowerCase()) : true
      const matchService = searchService ? String(r.serviceType || '').toLowerCase().includes(searchService.toLowerCase()) : true
      const matchReason = searchReason ? String(r.reason || '').toLowerCase().includes(searchReason.toLowerCase()) : true
      const matchStatus = status ? String(r.status || '').toLowerCase() === status.toLowerCase() : true
      const matchDate = visitDate ? dayjs(r.visitDate).isSame(dayjs(visitDate), 'day') : true
      return matchPatient && matchService && matchReason && matchStatus && matchDate
    })
  }, [data?.data, searchPatient, searchService, searchReason, status, visitDate])

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Daftar Kunjungan</h2>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/encounter/create')}>Tambah</Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3 mb-3">
        <Input placeholder="Pasien" value={searchPatient} onChange={(e) => setSearchPatient(e.target.value)} />
        <Input placeholder="Layanan" value={searchService} onChange={(e) => setSearchService(e.target.value)} />
        <Input placeholder="Alasan" value={searchReason} onChange={(e) => setSearchReason(e.target.value)} />
        <Select
          allowClear
          placeholder="SEMUA STATUS"
          value={status}
          onChange={(v) => setStatus(v)}
          options={[
            { label: 'Planned', value: 'planned' },
            { label: 'Arrived', value: 'arrived' },
            { label: 'Triaged', value: 'triaged' },
            { label: 'In Progress', value: 'in-progress' },
            { label: 'On Hold', value: 'onhold' },
            { label: 'Finished', value: 'finished' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Entered In Error', value: 'entered-in-error' },
            { label: 'Unknown', value: 'unknown' }
          ]}
        />
        <DatePicker
          placeholder="Tanggal Kunjungan"
          value={visitDate ? dayjs(visitDate) : null}
          onChange={(d) => setVisitDate(d ? d.toISOString() : null)}
          className="w-full"
        />
        <div />
        <div />
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.error}</div>)}
      <Table<Row>
        dataSource={filtered}
        columns={columns}
        rowKey={(r) => String(r.id ?? `${r.serviceType}-${r.patient?.name || ''}`)}
      />
    </div>
  )
}

export default EncounterTable

