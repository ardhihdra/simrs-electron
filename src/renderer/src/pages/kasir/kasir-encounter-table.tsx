import { FileTextOutlined, ReloadOutlined } from '@ant-design/icons'
import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import { formatEnum } from '@renderer/utils/formatters/enum-formatter'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { Button, DatePicker, Input, Select, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useEncounterList } from '@renderer/hooks/query/use-encounter'

interface EncounterRow {
  id: string
  encounterCode?: string | null
  no?: number
  queueTicket?: { queueNumber?: number; formattedQueueNumber?: string } | null
  visitDate?: string | Date
  startTime?: string | Date | null
  arrivalType?: string | null
  patient?: { name?: string; id?: string }
  serviceUnit?: { id?: string; name?: string; type?: string } | null
  serviceType?: string
  reason?: string
  status?: string
}

const columns: ColumnsType<EncounterRow> = [
  { title: 'No.', dataIndex: 'no', key: 'no', width: 55 },
  {
    title: 'No. Kunjungan',
    dataIndex: 'encounterCode',
    key: 'encounterCode',
    render: (v, record) => v ?? record.id ?? '-'
  },
  {
    title: 'Kode Antrian',
    dataIndex: 'queueTicket',
    key: 'queueTicket',
    render: (v: EncounterRow['queueTicket']) =>
      v?.formattedQueueNumber ?? (v?.queueNumber != null ? String(v.queueNumber) : '-')
  },
  {
    title: 'Tanggal Kunjungan',
    dataIndex: 'visitDate',
    key: 'visitDate',
    render: (v) => (v ? dayjs(v).format('DD MMM YYYY HH:mm') : '-')
  },
  {
    title: 'Jam Mulai',
    dataIndex: 'startTime',
    key: 'startTime',
    render: (v) => (v ? dayjs(v).format('HH:mm') : '-')
  },
  {
    title: 'Jenis Kedatangan',
    dataIndex: 'arrivalType',
    key: 'arrivalType',
    render: (v) => formatEnum(v)
  },
  { title: 'Pasien', dataIndex: ['patient', 'name'], key: 'patient' },
  {
    title: 'Unit Layanan',
    dataIndex: ['serviceUnit', 'name'],
    key: 'serviceUnit',
    render: (v) => v ?? '-'
  },
  { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => formatEnum(v) }
]

/**
 * This page should show all patients encounters, as by logic every encounters should be billable
 * @returns
 */
export default function KasirEncounterTable() {
  const navigate = useNavigate()

  const [searchPatient, setSearchPatient] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>('FINISHED')
  const [visitDate, setVisitDate] = useState<string | null>(null)
  const [serviceUnitId, setServiceUnitId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchPatient), 400)
    return () => clearTimeout(timer)
  }, [searchPatient])

  const { data, isLoading, isRefetching, refetch } = useEncounterList({
    q: debouncedSearch || undefined,
    status: status || undefined,
    startDate: visitDate ? dayjs(visitDate).startOf('day').toISOString() : undefined,
    endDate: visitDate ? dayjs(visitDate).endOf('day').toISOString() : undefined,
    serviceUnitId
  })
  console.log('cek data', data)

  const rows = useMemo<EncounterRow[]>(() => {
    const source: EncounterRow[] = Array.isArray((data as any)?.result)
      ? ((data as any).result as EncounterRow[])
      : []
    return source.map((r, idx) => ({ ...r, no: idx + 1 }))
  }, [data])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tagihan Pasien</h2>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isRefetching}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
        <Input
          placeholder="Cari Pasien"
          value={searchPatient}
          onChange={(e) => setSearchPatient(e.target.value)}
          allowClear
        />
        <Select
          allowClear
          placeholder="Semua Status"
          value={status}
          onChange={(v) => setStatus(v)}
          options={[
            { label: 'Planned', value: 'planned' },
            { label: 'Arrived', value: 'arrived' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Finished', value: 'finished' },
            { label: 'Cancelled', value: 'cancelled' }
          ]}
        />
        <DatePicker
          placeholder="Tanggal Kunjungan"
          value={visitDate ? dayjs(visitDate) : null}
          onChange={(d) => setVisitDate(d ? d.toISOString() : null)}
          className="w-full"
        />
        <SelectAsync
          entity="organization"
          placeHolder="Semua Unit Layanan"
          value={serviceUnitId}
          onChange={(v) => setServiceUnitId(v)}
          className="w-full"
        />
      </div>

      <GenericTable<EncounterRow>
        loading={isLoading || isRefetching}
        columns={columns}
        dataSource={rows}
        rowKey={(r) => String(r.id)}
        action={{
          title: 'Aksi',
          width: 80,
          align: 'center',
          fixedRight: true,
          render: (record) => (
            <Tooltip title="Lihat Invoice">
              <Button
                icon={<FileTextOutlined />}
                size="small"
                type="primary"
                onClick={() => {
                  const patientId = record.patient?.id ?? ''
                  navigate(`/dashboard/kasir/invoice/${record.id}?patientId=${patientId}`)
                }}
              />
            </Tooltip>
          )
        }}
      />
    </div>
  )
}
