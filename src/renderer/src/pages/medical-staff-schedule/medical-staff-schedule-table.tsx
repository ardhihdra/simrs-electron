import { Button, Dropdown, Input, Tag, Card, theme, Table, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  CalendarOutlined
} from '@ant-design/icons'

interface DaySchedule {
  enabled: boolean
  startTime: string
  endTime: string
}

interface MedicalStaffScheduleAttributes {
  id?: number
  idPegawai: number
  pegawai: {
    id: number
    namaLengkap: string
    nik: string
    email: string
  }
  organizationId: string
  organization?: {
    id: string
    name: string
    partOf?: {
      name?: string | null
    } | null
  } | null
  kategori: string
  senin: DaySchedule
  selasa: DaySchedule
  rabu: DaySchedule
  kamis: DaySchedule
  jumat: DaySchedule
  sabtu: DaySchedule
  minggu: DaySchedule
  status: 'active' | 'inactive'
}

const baseColumns = [
  {
    title: 'Nama Petugas',
    dataIndex: ['pegawai', 'namaLengkap'],
    key: 'pegawai',
    render: (value: string) => value || '-'
  },
  { title: 'Kategori', dataIndex: 'kategori', key: 'kategori' },
  {
    title: 'Organization',
    dataIndex: ['organization', 'name'],
    key: 'organization',
    render: (_value: string, record: MedicalStaffScheduleAttributes) =>
      record.organization?.partOf?.name
        ? `${record.organization?.name} - ${record.organization.partOf.name}`
        : record.organization?.name || '-'
  },
  {
    title: 'Senin',
    dataIndex: 'senin',
    key: 'senin',
    align: 'center' as const,
    render: (value: DaySchedule) => (value?.enabled ? `${value.startTime}-${value.endTime}` : '-')
  },
  {
    title: 'Selasa',
    dataIndex: 'selasa',
    key: 'selasa',
    align: 'center' as const,
    render: (value: DaySchedule) => (value?.enabled ? `${value.startTime}-${value.endTime}` : '-')
  },
  {
    title: 'Rabu',
    dataIndex: 'rabu',
    key: 'rabu',
    align: 'center' as const,
    render: (value: DaySchedule) => (value?.enabled ? `${value.startTime}-${value.endTime}` : '-')
  },
  {
    title: 'Kamis',
    dataIndex: 'kamis',
    key: 'kamis',
    align: 'center' as const,
    render: (value: DaySchedule) => (value?.enabled ? `${value.startTime}-${value.endTime}` : '-')
  },
  {
    title: 'Jumat',
    dataIndex: 'jumat',
    key: 'jumat',
    align: 'center' as const,
    render: (value: DaySchedule) => (value?.enabled ? `${value.startTime}-${value.endTime}` : '-')
  },
  {
    title: 'Sabtu',
    dataIndex: 'sabtu',
    key: 'sabtu',
    align: 'center' as const,
    render: (value: DaySchedule) => (value?.enabled ? `${value.startTime}-${value.endTime}` : '-')
  },
  {
    title: 'Minggu',
    dataIndex: 'minggu',
    key: 'minggu',
    align: 'center' as const,
    render: (value: DaySchedule) => (value?.enabled ? `${value.startTime}-${value.endTime}` : '-')
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (value: string) => (
      <Tag color={value === 'active' ? 'green' : 'red'}>
        {value === 'active' ? 'Aktif' : 'Tidak Aktif'}
      </Tag>
    )
  }
]

function RowActions({ record }: { record: MedicalStaffScheduleAttributes }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['medicalStaffSchedule', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.medicalStaffSchedule?.deleteById
      if (!fn)
        throw new Error(
          'API medical staff schedule tidak tersedia. Silakan restart aplikasi/dev server.'
        )
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicalStaffSchedule', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') {
          navigate(`/dashboard/registration/medical-staff-schedule/edit/${record.id}`)
        }
      }
    },
    {
      type: 'divider'
    },
    {
      key: 'delete',
      danger: true,
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') deleteMutation.mutate(record.id)
      }
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

export function MedicalStaffScheduleTable() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch, isError, isLoading } = useQuery({
    queryKey: ['medicalStaffSchedule', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.medicalStaffSchedule?.list
      if (!fn)
        throw new Error(
          'API medical staff schedule tidak tersedia. Silakan restart aplikasi/dev server.'
        )
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: MedicalStaffScheduleAttributes[] =
      (data?.result as MedicalStaffScheduleAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => {
      const hay = [p.pegawai?.namaLengkap, p.kategori, p.organization?.name, p.organization?.partOf?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [data?.result, search])

  const tableColumns = [
    ...baseColumns,
    {
      title: 'Aksi',
      key: 'action',
      width: 80,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_, record: MedicalStaffScheduleAttributes) => <RowActions record={record} />
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
                  <CalendarOutlined style={{ color: token.colorSuccessBg, fontSize: 16 }} />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">
                  Jadwal Praktek Petugas Medis
                </h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Manajemen pengaturan jadwal praktik staf medis
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
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
                      entity: 'jadwalPraktekPetugasMedis',
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
                onClick={() => navigate('/dashboard/registration/medical-staff-schedule/create')}
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
                  Total Terjadwal
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
              Pencarian
            </div>
            <Input
              placeholder="Search data..."
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                Gagal memuat jadwal dari server
              </div>
            )}
            <Table
              columns={tableColumns}
              dataSource={filtered}
              rowKey={(r) => String(r.id ?? `${r.kategori}-${r.pegawai?.namaLengkap}`)}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} jadwal`,
                showSizeChanger: true
              }}
              scroll={{ x: 1200, y: 'calc(100vh - 460px)' }}
              className="flex-1 h-full"
              size="middle"
            />
          </div>
        </Spin>
      </Card>
    </div>
  )
}

export default MedicalStaffScheduleTable
