import { Button, Input, Card, theme, Table, Spin, Tag, Typography } from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { client, rpc } from '@renderer/utils/client'

interface DoctorScheduleApiItem {
  id: number | string
  idPegawai: number | string
  idPoli: number | string
  idLokasiKerja: number | string
  idKontrakKerja: number | string
  kategori: string
  namaJadwal?: string | null
  berlakuDari: string
  berlakuSampai?: string | null
  status: 'active' | 'inactive'
  keterangan?: string | null
  pegawai?: {
    id: number
    namaLengkap: string
    email?: string | null
    nik?: string | null
  } | null
  poli?: {
    id: number
    name: string
    description?: string | null
    location?: string | null
  } | null
}

type DoctorScheduleListResult = {
  success: boolean
  result?: DoctorScheduleApiItem[]
  message?: string
  error?: string
}

interface DoctorScheduleItem {
  id?: number | string
  scheduleName: string
  doctorName: string
  category: string
  poli: string
  effectiveRange: string
  contractId: number | string
  locationId: number | string
  status: 'active' | 'inactive'
  note: string
}

type Row = DoctorScheduleItem & { no: number }

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD MMM YYYY') : value
}

const baseColumns: ColumnsType<Row> = [
  { title: 'No.', dataIndex: 'no', key: 'no', width: 60, align: 'center' },
  { title: 'Nama Jadwal', dataIndex: 'scheduleName', key: 'scheduleName', width: 220 },
  { title: 'Dokter', dataIndex: 'doctorName', key: 'doctorName', width: 200 },
  {
    title: 'Kategori',
    dataIndex: 'category',
    key: 'category',
    width: 200,
    render: (value: string) => value || '-'
  },
  {
    title: 'Poli',
    dataIndex: 'poli',
    key: 'poli',
    width: 180
  },
  {
    title: 'Periode Berlaku',
    dataIndex: 'effectiveRange',
    key: 'effectiveRange',
    width: 220
  },
  {
    title: 'ID Kontrak',
    dataIndex: 'contractId',
    key: 'contractId',
    width: 110,
    align: 'center'
  },
  {
    title: 'ID Lokasi',
    dataIndex: 'locationId',
    key: 'locationId',
    width: 110,
    align: 'center'
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    align: 'center',
    render: (value: Row['status']) => (
      <Tag color={value === 'active' ? 'green' : 'default'}>
        {value === 'active' ? 'Aktif' : 'Tidak Aktif'}
      </Tag>
    )
  },
  {
    title: 'Keterangan',
    dataIndex: 'note',
    key: 'note',
    width: 260,
    render: (value: string) => (
      <Typography.Paragraph
        ellipsis={{ rows: 2, expandable: false }}
        className="mb-0"
      >
        {value || '-'}
      </Typography.Paragraph>
    )
  }
]

function RowActions({ record }: { record: Row }) {
  const navigate = useNavigate()
  const scheduleId = Number(record.id)
  const canNavigate = Number.isFinite(scheduleId) && scheduleId > 0

  return (
    <div className="flex gap-2 justify-center">
      <Button
        type="default"
        icon={<EyeOutlined />}
        size="small"
        onClick={() => {
          if (canNavigate) {
            navigate(`/dashboard/registration/doctor-schedule/edit/${scheduleId}`)
          }
        }}
        title="Lihat Detail"
      />
      <Button
        type="primary"
        icon={<EditOutlined />}
        size="small"
        onClick={() => {
          if (canNavigate) {
            navigate(`/dashboard/registration/doctor-schedule/edit/${scheduleId}`)
          }
        }}
        title="Edit"
      />
    </div>
  )
}

export default function DoctorScheduleTable() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [searchDokter, setSearchDokter] = useState('')
  const [searchPoli, setSearchPoli] = useState('')
  const [searchJadwal, setSearchJadwal] = useState('')

  const { data, refetch, isError, isLoading } = client.query.entity.useQuery(
    {
      model: 'jadwalDokter',
      method: 'get',
      params: {
        items: '100'
      }
    },
    {
      queryKey: ['doctorSchedule', 'list']
    } as any
  )

  const listResult = data as DoctorScheduleListResult | undefined

  const filtered = useMemo(() => {
    const apiResult = listResult?.result || []
    const source: DoctorScheduleItem[] = Array.isArray(apiResult)
      ? apiResult.map((item) => ({
          id: item.id,
          scheduleName: item.namaJadwal?.trim() || `Jadwal #${item.id}`,
          doctorName: item.pegawai?.namaLengkap || '-',
          category: item.kategori || '-',
          poli: item.poli?.name || '-',
          effectiveRange: `${formatDate(item.berlakuDari)} - ${formatDate(item.berlakuSampai) === '-' ? 'Sekarang' : formatDate(item.berlakuSampai)}`,
          contractId: item.idKontrakKerja,
          locationId: item.idLokasiKerja,
          status: item.status,
          note: item.keterangan?.trim() || '-'
        }))
      : []
    const rows: Row[] = source.map((e, idx) => ({ ...e, no: idx + 1 }))
    return rows.filter((r) => {
      const matchJadwal = searchJadwal
        ? [r.scheduleName, r.category]
            .join(' ')
            .toLowerCase()
            .includes(searchJadwal.toLowerCase())
        : true
      const matchDokter = searchDokter
        ? String(r.doctorName || '')
            .toLowerCase()
            .includes(searchDokter.toLowerCase())
        : true
      const matchPoli = searchPoli
        ? String(r.poli || '')
            .toLowerCase()
            .includes(searchPoli.toLowerCase())
        : true
      return matchJadwal && matchDokter && matchPoli
    })
  }, [listResult?.result, searchDokter, searchJadwal, searchPoli])

  const tableColumns = [
    ...baseColumns,
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_, record: Row) => <RowActions record={record} />
    }
  ]

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 1. Header Card */}
      <Card
        styles={{ body: { padding: '20px 24px' } }}
        variant="borderless"
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
        }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <CalendarOutlined
                    className="text-base"
                    style={{ color: token.colorSuccessBg, fontSize: 16 }}
                  />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">
                  Jadwal Praktek Dokter
                </h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Manajemen master jadwal dokter berdasarkan periode, kontrak kerja, dan poli
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                className="border-white/30 text-white hover:border-white hover:text-white"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
                ghost
              >
                Refresh
              </Button>
              <Button
                type="default"
                onClick={async () => {
                  try {
                    const res = await rpc.window.exportCsvUrl({
                      entity: 'jadwalpraktekdokter',
                      usePagination: false
                    })
                    if (res?.success && res.url) {
                      await rpc.window.create({
                        url: res.url,
                        title: 'Export CSV Jadwal Dokter',
                        iframe: false
                      })
                    }
                  } catch (e) {
                    console.error(e instanceof Error ? e.message : String(e))
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
              >
                Export CSV
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={() => navigate('/dashboard/registration/doctor-schedule/create')}
                style={{
                  background: '#fff',
                  borderColor: '#fff',
                  color: token.colorPrimaryActive
                }}
              >
                Tambah Jadwal
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <CalendarOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {filtered.length}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Total Jadwal
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Search Filter Card */}
      <Card styles={{ body: { padding: '16px 20px' } }} variant="borderless">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Cari Jadwal
            </div>
            <Input
              placeholder="Nama Jadwal / Kategori..."
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              value={searchJadwal}
              onChange={(e) => setSearchJadwal(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Cari Dokter
            </div>
            <Input
              placeholder="Nama Dokter..."
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              value={searchDokter}
              onChange={(e) => setSearchDokter(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Cari Poli
            </div>
            <Input
              placeholder="Klinik / Poli..."
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              value={searchPoli}
              onChange={(e) => setSearchPoli(e.target.value)}
              allowClear
            />
          </div>
        </div>
      </Card>

      {/* 3. Main Data Table Card */}
      <Card className="flex-1 overflow-hidden flex flex-col" variant="borderless">
        <Spin spinning={isLoading}>
          <div className="flex-1" style={{ background: token.colorBgContainer }}>
            {isError && (
              <div style={{ color: token.colorErrorText }} className="p-4">
                {listResult?.error || listResult?.message || 'Gagal memuat data'}
              </div>
            )}
            <Table
              columns={tableColumns}
              dataSource={filtered}
              rowKey={(r) => String(r.id ?? `${r.doctorName}-${r.poli}`)}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} jadwal`,
                showSizeChanger: true
              }}
              scroll={{ x: 1600, y: 'calc(100vh - 460px)' }}
              className="flex-1 h-full"
              size="middle"
            />
          </div>
        </Spin>
      </Card>
    </div>
  )
}
