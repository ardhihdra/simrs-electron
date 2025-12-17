import { Button, Input, Table } from 'antd'
import { EyeOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router'

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

const columns: ColumnsType<Row> = [
  { title: 'No.', dataIndex: 'no', key: 'no', width: 60 },
  { title: 'Dokter', dataIndex: 'doctorName', key: 'doctorName' },
  { title: 'Poli', dataIndex: 'poli', key: 'poli' },
  { title: 'Senin', dataIndex: 'monday', key: 'monday', render: (v?: string | null) => v || '-' },
  { title: 'Selasa', dataIndex: 'tuesday', key: 'tuesday', render: (v?: string | null) => v || '-' },
  { title: 'Rabu', dataIndex: 'wednesday', key: 'wednesday', render: (v?: string | null) => v || '-' },
  { title: 'Kamis', dataIndex: 'thursday', key: 'thursday', render: (v?: string | null) => v || '-' },
  { title: 'Jumat', dataIndex: 'friday', key: 'friday', render: (v?: string | null) => v || '-' },
  { title: 'Sabtu', dataIndex: 'saturday', key: 'saturday', render: (v?: string | null) => v || '-' },
  { title: 'Minggu', dataIndex: 'sunday', key: 'sunday', render: (v?: string | null) => v || '-' },
  {
    title: 'Action',
    key: 'action',
    width: 100,
    render: (_: Row, record: Row) => <RowActions record={record} />
  }
]

function RowActions({ record }: { record: Row }) {
  const navigate = useNavigate()
  return (
    <div className="flex gap-2">
      <EyeOutlined onClick={() => { if (typeof record.id === 'number') navigate(`/dashboard/registration/doctor-schedule/edit/${record.id}`) }} />
      <EditOutlined onClick={() => { if (typeof record.id === 'number') navigate(`/dashboard/registration/doctor-schedule/edit/${record.id}`) }} />
    </div>
  )
}

type DoctorScheduleListResult = {
  success: boolean
  data?: DoctorScheduleItem[]
  error?: string
}

export default function DoctorScheduleTable() {
  const navigate = useNavigate()
  const [searchDokter, setSearchDokter] = useState('')
  const [searchPoli, setSearchPoli] = useState('')

  const { data, refetch, isError } = useQuery<DoctorScheduleListResult>({
    queryKey: ['doctorSchedule', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.doctorSchedule?.list
      if (!fn) throw new Error('API jadwal dokter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: DoctorScheduleItem[] = Array.isArray(data?.data) ? (data!.data as DoctorScheduleItem[]) : []
    const rows: Row[] = source.map((e, idx) => ({ ...e, no: idx + 1 }))
    return rows.filter((r) => {
      const matchDokter = searchDokter ? String(r.doctorName || '').toLowerCase().includes(searchDokter.toLowerCase()) : true
      const matchPoli = searchPoli ? String(r.poli || '').toLowerCase().includes(searchPoli.toLowerCase()) : true
      return matchDokter && matchPoli
    })
  }, [data?.data, searchDokter, searchPoli])

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Jadwal Praktek Dokter</h2>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/registration/doctor-schedule/create')}>Tambah</Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3 mb-3">
        <Input placeholder="Nama Dokter" value={searchDokter} onChange={(e) => setSearchDokter(e.target.value)} />
        <Input placeholder="Poli" value={searchPoli} onChange={(e) => setSearchPoli(e.target.value)} />
        <div />
        <div />
        <div />
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.error}</div>)}
      <Table<Row>
        dataSource={filtered}
        columns={columns}
        rowKey={(r) => String(r.id ?? `${r.doctorName}-${r.poli}`)}
      />
    </div>
  )
}
