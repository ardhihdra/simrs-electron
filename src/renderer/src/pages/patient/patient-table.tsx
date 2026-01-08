import { Button, DatePicker, Input, Select } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import type { PatientAttributes } from '@shared/patient'
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import GenericTable from '@renderer/components/GenericTable'

type Row = PatientAttributes & { no: number }

const baseColumns: ColumnsType<Row> = [
  { title: 'No.', dataIndex: 'no', key: 'no', width: 60 },
  { title: 'Kode', dataIndex: 'kode', key: 'kode' },
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
  { title: 'Alamat', dataIndex: 'addressLine', key: 'addressLine' },
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
      <EyeOutlined onClick={() => { if (typeof record.id === 'number') navigate(`/dashboard/patient/edit/${record.id}`) }} />
      <EditOutlined onClick={() => { if (typeof record.id === 'number') navigate(`/dashboard/patient/edit/${record.id}`) }} />
      <DeleteOutlined onClick={() => { if (typeof record.id === 'number') deleteMutation.mutate(record.id) }} />
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
  const { data, refetch, isError } = useQuery({
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
      const matchKode = searchKode ? String(r.kode || '').toLowerCase().includes(searchKode.toLowerCase()) : true
      const matchNama = searchNama ? String(r.name || '').toLowerCase().includes(searchNama.toLowerCase()) : true
      const matchPhone = searchPhone ? String(r.phone || '').toLowerCase().includes(searchPhone.toLowerCase()) : true
      const matchEmail = searchEmail ? String(r.email || '').toLowerCase().includes(searchEmail.toLowerCase()) : true
      const matchAlamat = searchAlamat ? String(r.addressLine || '').toLowerCase().includes(searchAlamat.toLowerCase()) : true
      const matchGender = gender ? String(r.gender || '').toLowerCase() === gender.toLowerCase() : true
      const matchBirth = birthDate ? dayjs(r.birthDate).isSame(dayjs(birthDate), 'day') : true
      return matchKode && matchNama && matchPhone && matchEmail && matchAlamat && matchGender && matchBirth
    })
  }, [data?.data, searchKode, searchNama, searchPhone, searchEmail, searchAlamat, gender, birthDate])

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Daftar Pasien</h2>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/patient/register')}>Tambah</Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
        <Button
          onClick={async () => {
            try {
              const res = await window.api.query.export.exportCsv({
                entity: 'patient',
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3 mb-3">
        <Input placeholder="Kode" value={searchKode} onChange={(e) => setSearchKode(e.target.value)} />
        <Input placeholder="Nama" value={searchNama} onChange={(e) => setSearchNama(e.target.value)} />
        <Select
          allowClear
          placeholder="SEMUA GENDER"
          value={gender}
          onChange={(v) => setGender(v)}
          options={[
            { label: 'Laki-Laki', value: 'male' },
            { label: 'Perempuan', value: 'female' }
          ]}
        />
        <Input placeholder="Phone" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} />
        <Input placeholder="Email" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} />
        <Input placeholder="Alamat" value={searchAlamat} onChange={(e) => setSearchAlamat(e.target.value)} />
        <DatePicker
          placeholder="Tanggal Lahir"
          value={birthDate ? dayjs(birthDate) : null}
          onChange={(d) => setBirthDate(d ? d.toISOString() : null)}
          className="w-full"
        />
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.error}</div>)}
      <GenericTable<Row>
        columns={baseColumns}
        dataSource={filtered}
        rowKey={(r) => String(r.id ?? `${r.kode}-${r.email}`)}
        action={{
          title: 'Action',
          width: 100,
          align: 'center',
          fixedRight: true,
          render: (record) => <RowActions record={record} />
        }}
      />
    </div>
  )
}

export default PatientTable
