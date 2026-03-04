import { Button, Input, Card, theme, Table, Spin } from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router'

interface DaySchedule {
  enabled: boolean
  startTime: string
  endTime: string
}

interface DoctorScheduleApiItem {
  id: number
  idPegawai: number
  idPoli: number
  kategori?: string | null
  senin?: DaySchedule
  selasa?: DaySchedule
  rabu?: DaySchedule
  kamis?: DaySchedule
  jumat?: DaySchedule
  sabtu?: DaySchedule
  minggu?: DaySchedule
  status?: string
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
  id?: number
  doctorName: string
  poli: string
  monday?: string | null
  tuesday?: string | null
  wednesday?: string | null
  thursday?: string | null
  friday?: string | null
  saturday?: string | null
  sunday?: string | null
}

type Row = DoctorScheduleItem & { no: number }

const baseColumns: ColumnsType<Row> = [
  { title: 'No.', dataIndex: 'no', key: 'no', width: 60, align: 'center' },
  { title: 'Dokter', dataIndex: 'doctorName', key: 'doctorName', width: 200 },
  { title: 'Poli', dataIndex: 'poli', key: 'poli', width: 150 },
  {
    title: 'Senin',
    dataIndex: 'monday',
    key: 'monday',
    width: 130,
    render: (v?: string | null) => v || '-'
  },
  {
    title: 'Selasa',
    dataIndex: 'tuesday',
    key: 'tuesday',
    width: 130,
    render: (v?: string | null) => v || '-'
  },
  {
    title: 'Rabu',
    dataIndex: 'wednesday',
    key: 'wednesday',
    width: 130,
    render: (v?: string | null) => v || '-'
  },
  {
    title: 'Kamis',
    dataIndex: 'thursday',
    key: 'thursday',
    width: 130,
    render: (v?: string | null) => v || '-'
  },
  {
    title: 'Jumat',
    dataIndex: 'friday',
    key: 'friday',
    width: 130,
    render: (v?: string | null) => v || '-'
  },
  {
    title: 'Sabtu',
    dataIndex: 'saturday',
    key: 'saturday',
    width: 130,
    render: (v?: string | null) => v || '-'
  },
  {
    title: 'Minggu',
    dataIndex: 'sunday',
    key: 'sunday',
    width: 130,
    render: (v?: string | null) => v || '-'
  }
]

function RowActions({ record }: { record: Row }) {
  const navigate = useNavigate()
  return (
    <div className="flex gap-2 justify-center">
      <Button
        type="default"
        icon={<EyeOutlined />}
        size="small"
        onClick={() => {
          if (typeof record.id === 'number')
            navigate(`/dashboard/registration/doctor-schedule/edit/${record.id}`)
        }}
        title="Lihat Detail"
      />
      <Button
        type="primary"
        icon={<EditOutlined />}
        size="small"
        onClick={() => {
          if (typeof record.id === 'number')
            navigate(`/dashboard/registration/doctor-schedule/edit/${record.id}`)
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

  const { data, refetch, isError, isLoading } = useQuery<DoctorScheduleListResult>({
    queryKey: ['doctorSchedule', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.doctorSchedule?.list
      if (!fn)
        throw new Error('API jadwal dokter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const apiResult = data?.result || []
    const source: DoctorScheduleItem[] = Array.isArray(apiResult)
      ? apiResult.map((item) => ({
          id: item.id,
          doctorName: item.pegawai?.namaLengkap || '-',
          poli: item.poli?.name || '-',
          monday: item.senin?.enabled ? `${item.senin.startTime} - ${item.senin.endTime}` : null,
          tuesday: item.selasa?.enabled
            ? `${item.selasa.startTime} - ${item.selasa.endTime}`
            : null,
          wednesday: item.rabu?.enabled ? `${item.rabu.startTime} - ${item.rabu.endTime}` : null,
          thursday: item.kamis?.enabled ? `${item.kamis.startTime} - ${item.kamis.endTime}` : null,
          friday: item.jumat?.enabled ? `${item.jumat.startTime} - ${item.jumat.endTime}` : null,
          saturday: item.sabtu?.enabled ? `${item.sabtu.startTime} - ${item.sabtu.endTime}` : null,
          sunday: item.minggu?.enabled ? `${item.minggu.startTime} - ${item.minggu.endTime}` : null
        }))
      : []
    const rows: Row[] = source.map((e, idx) => ({ ...e, no: idx + 1 }))
    return rows.filter((r) => {
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
      return matchDokter && matchPoli
    })
  }, [data, searchDokter, searchPoli])

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
                Manajemen pengaturan jadwal praktik dokter berdasarkan poli
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
                    const res = await window.api.query.export.exportCsv({
                      entity: 'jadwalpraktekdokter',
                      usePagination: false
                    })
                    if (
                      res &&
                      typeof res === 'object' &&
                      'success' in res &&
                      res.success &&
                      'url' in res &&
                      res.url
                    ) {
                      window.open(res.url as string, '_blank')
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
                {data?.error || data?.message || 'Gagal memuat data'}
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
              scroll={{ x: 1300, y: 'calc(100vh - 460px)' }}
              className="flex-1 h-full"
              size="middle"
            />
          </div>
        </Spin>
      </Card>
    </div>
  )
}
