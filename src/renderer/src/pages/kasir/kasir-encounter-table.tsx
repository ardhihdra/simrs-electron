import { FileTextOutlined, ReloadOutlined } from '@ant-design/icons'
import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { Button, DatePicker, Input, Select, Tooltip, Tag, Divider } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useEncounterList } from '@renderer/hooks/query/use-encounter'
import KioskCallingWorkspace from './KioskCallingWorkspace'

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
  invoiceStatus?: string | null
}

const formatEnum = (val?: string) => {
  if (!val) return '-'
  return val
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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
    title: 'No. Kunjungan',
    dataIndex: 'encounterCode',
    key: 'encounterCode',
    render: (v, record) => v ?? record.id ?? '-'
  },
  {
    title: 'Kode Pemeriksaan',
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
  {
    title: 'Selesai Pemeriksaan',
    dataIndex: 'status',
    key: 'status',
    render: (v) => formatEnum(v)
  },
  {
    title: 'Status Tagihan',
    key: 'invoiceStatus',
    width: 140,
    render: (_: unknown, record: EncounterRow) => {
      const s = record.invoiceStatus
      if (!s) return <Tag color="default">Belum Ada</Tag>
      if (s === 'balanced') return <Tag color="green">Lunas</Tag>
      if (s === 'issued') return <Tag color="blue">Terkonfirmasi</Tag>
      if (s === 'draft') return <Tag color="orange">Draft</Tag>
      return <Tag>{formatEnum(s)}</Tag>
    }
  }
]

export default function KasirEncounterTable() {
  const navigate = useNavigate()

  const [searchPatient, setSearchPatient] = useState('')
  const [searchMrn, setSearchMrn] = useState('')
  const [searchQueueNumber, setSearchQueueNumber] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debouncedMrn, setDebouncedMrn] = useState('')
  const [debouncedQueueNumber, setDebouncedQueueNumber] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [visitDate, setVisitDate] = useState<string | null>(null)
  const [serviceUnitId, setServiceUnitId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchPatient)
      setDebouncedMrn(searchMrn)
      setDebouncedQueueNumber(searchQueueNumber)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchPatient, searchMrn, searchQueueNumber])

  // --- Encounter Query ---
  const {
    data: encounterData,
    isLoading: isEncounterLoading,
    isRefetching: isEncounterRefetching,
    refetch: refetchEncounter
  } = useEncounterList({
    q: debouncedSearch || undefined,
    mrn: debouncedMrn || undefined,
    queueNumber: debouncedQueueNumber || undefined,
    status: status || undefined,
    startDate: visitDate ? dayjs(visitDate).startOf('day').toISOString() : undefined,
    endDate: visitDate ? dayjs(visitDate).endOf('day').toISOString() : undefined,
    serviceUnitId
  })

  const encounterRows = useMemo<EncounterRow[]>(() => {
    const source: EncounterRow[] = Array.isArray((encounterData as any)?.result)
      ? ((encounterData as any).result as EncounterRow[])
      : []
    return source.map((r, idx) => ({ ...r, no: idx + 1 }))
  }, [encounterData])

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-6">Kasir & Billing</h2>

      {/* Kiosk Calling Section at the top */}
      <KioskCallingWorkspace />

      <Divider />

      {/* Encounter List Section at the bottom */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Daftar Tagihan Pasien</h3>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetchEncounter()}
            loading={isEncounterRefetching}
          >
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
          <Input
            placeholder="Nama Pasien"
            value={searchPatient}
            onChange={(e) => setSearchPatient(e.target.value)}
            allowClear
          />
          <Input
            placeholder="No. Rekam Medis"
            value={searchMrn}
            onChange={(e) => setSearchMrn(e.target.value)}
            allowClear
          />
          <Input
            placeholder="No. Antrian"
            value={searchQueueNumber}
            onChange={(e) => setSearchQueueNumber(e.target.value)}
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
          loading={isEncounterLoading || isEncounterRefetching}
          columns={columns}
          dataSource={encounterRows}
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
    </div>
  )
}
