import { Button, Dropdown, Input, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'

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
  kodeDepartemen: string
  departemen: {
    kode: string
    nama: string
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

const baseColumns = [
  {
    title: 'Nama Petugas',
    dataIndex: ['pegawai', 'namaLengkap'],
    key: 'pegawai',
    render: (value: string) => value || '-'
  },
  { title: 'Kategori', dataIndex: 'kategori', key: 'kategori' },
  {
    title: 'Poli/Departemen',
    dataIndex: ['departemen', 'nama'],
    key: 'departemen',
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
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch, isError } = useQuery({
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
      const hay = [p.pegawai?.namaLengkap, p.kategori, p.departemen?.nama]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [data?.result, search])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Jadwal Praktek Petugas Medis</h2>
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
            onClick={async () => {
              try {
                const res = await window.api.query.export.exportCsv({
                  entity: 'jadwalPraktekPetugasMedis',
                  usePagination: false
                })
                if (res && typeof res === 'object' && 'success' in res && res.success && 'url' in res && res.url) {
                  window.open(res.url as string, '_blank')
                }
              } catch (e) {
                console.error(e instanceof Error ? e.message : String(e))
              }
            }}
          >Export CSV</Button>
          <Button
            type="primary"
            onClick={() => navigate('/dashboard/registration/medical-staff-schedule/create')}
          >
            Tambah Jadwal
          </Button>
        </div>
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.message}</div>)}
      <GenericTable<MedicalStaffScheduleAttributes>
        columns={baseColumns}
        dataSource={filtered}
        rowKey={(r) => String(r.id ?? `${r.kategori}-${r.pegawai?.namaLengkap}`)}
        action={{
          title: 'Action',
          width: 80,
          align: 'center',
          fixedRight: true,
          render: (record) => <RowActions record={record} />
        }}
        tableProps={{ size: 'small', className: 'mt-4 rounded-xl shadow-sm', scroll: { x: 'max-content' } }}
      />
    </div>
  )
}

export default MedicalStaffScheduleTable
