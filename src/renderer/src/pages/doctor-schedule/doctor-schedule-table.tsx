import { Button, Dropdown, Input, Table, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'

interface DaySchedule {
  enabled: boolean
  startTime: string
  endTime: string
}

interface DoctorScheduleAttributes {
  id?: number
  idPegawai: number
  pegawai: {
    id: number
    namaLengkap: string
    nik: string
    email: string
  }
  idPoli: number
  poli: {
    id: number
    name: string
    description?: string
    location?: string
  }
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

const columns = [
  {
    title: 'Nama Dokter',
    dataIndex: ['pegawai', 'namaLengkap'],
    key: 'pegawai',
    render: (value: string) => value || '-'
  },
  { title: 'Kategori', dataIndex: 'kategori', key: 'kategori' },
  {
    title: 'Poli',
    dataIndex: ['poli', 'name'],
    key: 'poli',
    render: (value: string) => value || '-'
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
  },
  {
    title: 'Action',
    key: 'action',
    width: 60,
    align: 'center' as const,
    render: (_: DoctorScheduleAttributes, record: DoctorScheduleAttributes) => (
      <RowActions record={record} />
    )
  }
]

function RowActions({ record }: { record: DoctorScheduleAttributes }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['doctorSchedule', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.doctorSchedule?.deleteById
      if (!fn)
        throw new Error('API jadwal dokter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorSchedule', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') {
          navigate(`/dashboard/registration/doctor-schedule/edit/${record.id}`)
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

export function DoctorScheduleTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch, isError } = useQuery({
    queryKey: ['doctorSchedule', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.doctorSchedule?.list
      if (!fn)
        throw new Error('API jadwal dokter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: DoctorScheduleAttributes[] = (data?.result as DoctorScheduleAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => {
      const hay = [p.pegawai?.namaLengkap, p.kategori, p.poli?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [data?.result, search])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Jadwal Praktek Dokter</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input
          type="text"
          placeholder="Search"
          className="w-full md:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button
            type="primary"
            onClick={() => navigate('/dashboard/registration/doctor-schedule/create')}
          >
            Tambah Jadwal
          </Button>
        </div>
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.message}</div>)}
      <Table
        dataSource={filtered}
        columns={columns}
        size="small"
        className="mt-4 rounded-xl shadow-sm"
        rowKey="id"
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default DoctorScheduleTable
