import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { queryClient } from '@renderer/query-client'
import type { PatientAttributes } from '@shared/patient'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

type Row = PatientAttributes & { no: number }

const baseColumns: ColumnsType<Row> = [
  { title: 'No.', dataIndex: 'no', key: 'no', width: 60 },
  { title: 'Nama', dataIndex: 'name', key: 'name' },
  { title: 'Gender', dataIndex: 'gender', key: 'gender' },
  {
    title: 'Tanggal Lahir',
    dataIndex: 'birthDate',
    key: 'birthDate',
    render: (value: string | Date) => (value ? dayjs(value).format('DD MMMM YYYY') : '-')
  },
  { title: 'Phone', dataIndex: 'phone', key: 'phone' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  { title: 'Alamat', dataIndex: 'address', key: 'address' }
]

function RowActions({ record }: { record: Row }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['patient', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.patient?.deleteById
      if (!fn) throw new Error('API patient tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', 'list'] })
    }
  })
  return (
    <div className="flex gap-2">
      <EyeOutlined
        onClick={() => {
          if (typeof record.id === 'number') navigate(`/dashboard/patient/edit/${record.id}`)
        }}
      />
      <EditOutlined
        onClick={() => {
          if (typeof record.id === 'number') navigate(`/dashboard/patient/edit/${record.id}`)
        }}
      />
      <DeleteOutlined
        onClick={() => {
          if (typeof record.id === 'number') deleteMutation.mutate(record.id)
        }}
      />
    </div>
  )
}

export function PatientTable() {
  const navigate = useNavigate()
  const [searchKode, setSearchKode] = useState('')
  const [searchNama, setSearchNama] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [searchEmail, setSearchEmail] = useState('')
  const [searchAlamat, setSearchAlamat] = useState('')
  const [gender, setGender] = useState<string | undefined>(undefined)
  const [birthDate, setBirthDate] = useState<string | null>(null)
  const { data, refetch, isError } = useQuery<any>({
    queryKey: ['patient', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.patient?.list
      if (!fn) throw new Error('API patient tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: PatientAttributes[] = (data?.data as PatientAttributes[]) || []
    const rows: Row[] = source.map((p, idx) => ({ ...p, no: idx + 1 }))
    return rows.filter((r) => {
      const matchKode = searchKode
        ? String(r.kode || '')
            .toLowerCase()
            .includes(searchKode.toLowerCase())
        : true
      const matchNama = searchNama
        ? String(r.name || '')
            .toLowerCase()
            .includes(searchNama.toLowerCase())
        : true
      const matchPhone = searchPhone
        ? String(r.phone || '')
            .toLowerCase()
            .includes(searchPhone.toLowerCase())
        : true
      const matchEmail = searchEmail
        ? String(r.email || '')
            .toLowerCase()
            .includes(searchEmail.toLowerCase())
        : true
      const matchAlamat = searchAlamat
        ? String(r.addressLine || '')
            .toLowerCase()
            .includes(searchAlamat.toLowerCase())
        : true
      const matchGender = gender
        ? String(r.gender || '').toLowerCase() === gender.toLowerCase()
        : true
      const matchBirth = birthDate ? dayjs(r.birthDate).isSame(dayjs(birthDate), 'day') : true
      return (
        matchKode &&
        matchNama &&
        matchPhone &&
        matchEmail &&
        matchAlamat &&
        matchGender &&
        matchBirth
      )
    })
  }, [
    data?.data,
    searchKode,
    searchNama,
    searchPhone,
    searchEmail,
    searchAlamat,
    gender,
    birthDate
  ])
  console.log('patient data:', data)
  return (
    <div>
      {data.data?.result?.map((item) => (
        <div key={item.id}>
          {item.medicalRecordNumber} - {item.name}
        </div>
      ))}
    </div>
  )
}

export default PatientTable
