import { FileProtectOutlined, ReloadOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { Button, DatePicker, Input, Select, Tooltip, Tag, Divider, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { client } from '@renderer/utils/client'
import { RPCSelectAsync } from '@renderer/components/organisms/RPCSelectAsync'
import KioskCallingWorkspace from '../kasir/KioskCallingWorkspace'

interface BillingInvoiceRow {
  id: number
  kode: string
  encounterId: string
  patientId: string
  patientName: string
  mrn: string
  visitDate: string
  startTime: string | null
  endTime: string | null
  arrivalType: string | null
  unitName: string | null
  status: string
  total: number
  remaining: number
  allocationStatus: 'draft' | 'done'
  no?: number
  penjaminName?: string | null
}

const formatEnum = (val?: string) => {
  if (!val) return '-'
  return val
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

const columns: ColumnsType<BillingInvoiceRow> = [
  { title: 'No.', dataIndex: 'no', key: 'no', width: 55 },
  { title: 'Kode Pemeriksaan', dataIndex: 'encounterId', key: 'encounterId', width: 140 },
  {
    title: 'Tanggal Kunjungan',
    dataIndex: 'startTime',
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
  { title: 'Pasien', dataIndex: 'patientName', key: 'patientName' },
  {
    title: 'Unit Layanan',
    dataIndex: 'unitName',
    key: 'unitName',
    render: (v) => v ?? '-'
  },
  {
    title: 'Penjamin',
    dataIndex: 'penjaminName',
    key: 'penjaminName',
    render: (v) => <Tag color={v === 'UMUM (TUNAI)' ? 'default' : 'cyan'}>{v || '-'}</Tag>
  },
  {
    title: 'Selesai Pemeriksaan',
    dataIndex: 'status',
    key: 'status',
    render: (v) => formatEnum(v)
  },
  {
    title: 'Status Tagihan',
    dataIndex: 'status',
    key: 'status',
    render: (v) => {
      if (v === 'draft') return <Tag color="orange">Draft (Butuh Verifikasi)</Tag>
      if (v === 'issued') return <Tag color="blue">Terkonfirmasi</Tag>
      if (v === 'balanced') return <Tag color="green">Lunas</Tag>
      return <Tag>{v}</Tag>
    }
  },
  {
    title: 'Status Alokasi',
    dataIndex: 'allocationStatus',
    key: 'allocationStatus',
    width: 120,
    render: (v) => (
      <Tag color={v === 'done' ? 'green' : 'orange'}>{v === 'done' ? 'Done' : 'Draft'}</Tag>
    )
  }
]

export default function BillingPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [patientName, setPatientName] = useState('')
  const [mrn, setMrn] = useState('')
  const [queueNumber, setQueueNumber] = useState('')
  const [unitCode, setUnitCode] = useState<number | undefined>()

  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [mitraId, setMitraId] = useState<number | undefined>()
  const [visitDate, setVisitDate] = useState<dayjs.Dayjs | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search, patientName, mrn, queueNumber])

  const {
    data: billingData,
    isLoading,
    isRefetching,
    refetch
  } = client.billing.listInvoices.useQuery({
    search: debouncedSearch || undefined,
    patientName: patientName || undefined,
    mrn: mrn || undefined,
    queueNumber: queueNumber || undefined,
    unitCode: unitCode ? String(unitCode) : undefined,
    status: status || undefined,
    mitraId: mitraId || undefined,
    dateFrom: visitDate ? visitDate.startOf('day').toISOString() : undefined,
    dateTo: visitDate ? visitDate.endOf('day').toISOString() : undefined
  })

  const rows = useMemo<BillingInvoiceRow[]>(() => {
    const sourceArr = (billingData as any)?.result?.data || []
    return sourceArr.map((r: any, idx: number) => ({
      ...r,
      no: idx + 1
    }))
  }, [billingData])

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-6">Billing</h2>

      <KioskCallingWorkspace allowedTypes={['BILLING']} />

      <Divider />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Daftar Tagihan Pasien</h3>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isRefetching}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
        <Input
          placeholder="Nama Pasien"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          allowClear
        />
        <Input
          placeholder="No. Rekam Medis"
          value={mrn}
          onChange={(e) => setMrn(e.target.value)}
          allowClear
        />
        <Input
          placeholder="No. Antrian"
          value={queueNumber}
          onChange={(e) => setQueueNumber(e.target.value)}
          allowClear
        />
        <Select
          placeholder="Semua Status"
          value={status}
          onChange={(v) => setStatus(v)}
          allowClear
          options={[
            { label: 'Draft (Belum Verifikasi)', value: 'draft' },
            { label: 'Terkonfirmasi', value: 'issued' },
            { label: 'Lunas', value: 'balanced' }
          ]}
          className="w-full"
        />
        <DatePicker
          placeholder="Tanggal Kunjungan"
          className="w-full"
          value={visitDate}
          onChange={(date) => setVisitDate(date)}
        />
        <RPCSelectAsync
          placeHolder="Semua Penjamin"
          entity="mitra"
          value={mitraId}
          onChange={(v) => setMitraId(v as number)}
          display="name"
          allowClear
        />
        <RPCSelectAsync
          placeHolder="Semua Unit Layanan"
          entity="poli"
          value={unitCode}
          onChange={(v) => setUnitCode(v as number)}
          display="name"
          allowClear
        />
      </div>

      <GenericTable<BillingInvoiceRow>
        loading={isLoading || isRefetching}
        columns={columns}
        dataSource={rows}
        rowKey="kode"
        action={{
          title: 'Aksi',
          width: 80,
          align: 'center',
          render: (record) => (
            <Tooltip title="Alokasi Penjamin">
              <Button
                icon={<FileProtectOutlined />}
                size="small"
                type="primary"
                onClick={() =>
                  navigate(`/dashboard/billing/allocate/${encodeURIComponent(record.kode)}`)
                }
              />
            </Tooltip>
          )
        }}
      />
    </div>
  )
}
