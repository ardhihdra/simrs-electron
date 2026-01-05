import { Button, Dropdown, Input, Table, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'
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
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch, isError } = useQuery({
    queryKey: ['doctorLeave', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.doctorLeave?.list
      if (!fn)
        throw new Error('API doctorLeave tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn()
    }
  })

  console.log('data dokter', data)

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
    <div>
      <h2 className="text-2xl font-bold mb-4">Daftar Cuti/Libur Dokter</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input
          type="text"
          placeholder="Cari nama atau keterangan..."
          className="w-full md:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button
            type="primary"
            onClick={() => navigate('/dashboard/registration/doctor-leave/create')}
          >
            Tambah Cuti
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
