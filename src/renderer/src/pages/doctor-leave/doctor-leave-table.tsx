import { Button, Dropdown, Input, Table, Tag, Card, theme, Spin } from 'antd'
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
import dayjs from 'dayjs'

interface DoctorLeaveAttributes {
  id: number
  idPegawai: number
  pegawai: {
    id: number
    namaLengkap: string
    nik: string
    email: string
  }
  tanggalMulai: string | Date
  tanggalSelesai: string | Date
  keterangan: string
  status: 'active' | 'cancelled'
}

const columns = [
  {
    title: 'Nama Pegawai',
    dataIndex: ['pegawai', 'namaLengkap'],
    key: 'pegawai',
    render: (value: string) => value || '-'
  },
  {
    title: 'Tanggal Mulai',
    dataIndex: 'tanggalMulai',
    key: 'tanggalMulai',
    render: (value: string) => dayjs(value).format('DD MMM YYYY')
  },
  {
    title: 'Tanggal Selesai',
    dataIndex: 'tanggalSelesai',
    key: 'tanggalSelesai',
    render: (value: string) => dayjs(value).format('DD MMM YYYY')
  },
  {
    title: 'Keterangan',
    dataIndex: 'keterangan',
    key: 'keterangan',
    render: (value: string) => <div className="max-w-[300px] truncate">{value}</div>
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (value: string) => (
      <Tag color={value === 'active' ? 'green' : 'red'}>
        {value === 'active' ? 'Aktif' : 'Dibatalkan'}
      </Tag>
    )
  },
  {
    title: 'Action',
    key: 'action',
    width: 60,
    align: 'center' as const,
    render: (_: DoctorLeaveAttributes, record: DoctorLeaveAttributes) => (
      <RowActions record={record} />
    )
  }
]

function RowActions({ record }: { record: DoctorLeaveAttributes }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['doctorLeave', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.doctorLeave?.deleteById
      if (!fn)
        throw new Error('API doctorLeave tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorLeave', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') {
          navigate(`/dashboard/registration/doctor-leave/edit/${record.id}`)
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
        if (typeof record.id === 'number') {
          if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            deleteMutation.mutate(record.id)
          }
        }
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

export default function DoctorLeaveTable() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch, isError, isLoading } = useQuery({
    queryKey: ['doctorLeave', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.doctorLeave?.list
      if (!fn)
        throw new Error('API doctorLeave tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn()
    }
  })

  // console.log('data dokter', data)

  const filtered = useMemo(() => {
    const source: DoctorLeaveAttributes[] = (data?.result as DoctorLeaveAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((item) => {
      const nama = item.pegawai?.namaLengkap?.toLowerCase() || ''
      const ket = item.keterangan?.toLowerCase() || ''
      return nama.includes(q) || ket.includes(q)
    })
  }, [data?.result, search])

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
                  Daftar Cuti/Libur Dokter
                </h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Manajemen data cuti dan hari libur praktek dokter
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
                icon={<PlusOutlined />}
                onClick={() => navigate('/dashboard/registration/doctor-leave/create')}
                style={{
                  background: '#fff',
                  borderColor: '#fff',
                  color: token.colorPrimaryActive
                }}
              >
                Tambah Cuti
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
                  Total Data
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
              placeholder="Cari nama atau keterangan..."
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
            {(isError || (data && !data.success)) && (
              <div style={{ color: token.colorErrorText }} className="p-4">
                {isError ? 'Gagal mengambil data dari server. Periksa koneksi.' : data?.message}
              </div>
            )}
            <Table
              columns={columns}
              dataSource={filtered}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} data`,
                showSizeChanger: true
              }}
              scroll={{ x: 800, y: 'calc(100vh - 460px)' }}
              className="flex-1 h-full"
              size="middle"
            />
          </div>
        </Spin>
      </Card>
    </div>
  )
}
