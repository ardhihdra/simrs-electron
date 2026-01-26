import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/GenericTable'
import { useDebounce } from '@renderer/hooks/useDebounce'
import { PatientAttributes } from '@shared/patient'
import { useQuery } from '@tanstack/react-query'
import { Button, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'

import RegistrationSheet from './components/RegistrationSheet'

const Pendaftaran = () => {
  const [searchKode, setSearchKode] = useState('')
  const [searchNama, setSearchNama] = useState('')
  const [openRegistration, setOpenRegistration] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientAttributes | undefined>(undefined)

  const debouncedKode = useDebounce(searchKode, 500)
  const debouncedNama = useDebounce(searchNama, 500)

  const {
    data: queryData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['patient', 'list', debouncedKode, debouncedNama],
    queryFn: async () => {
      const fn = window.api.query.patient.list
      if (!fn) {
        throw new Error('Failed to load data')
      }
      return fn({
        nik: debouncedKode,
        name: debouncedNama
      })
    }
  })

  const columns: ColumnsType<PatientAttributes & { no: number }> = [
    { title: 'No.', dataIndex: 'no', key: 'no', width: 60 },
    { title: 'RM', dataIndex: 'medicalRecordNumber', key: 'medicalRecordNumber' },
    { title: 'NIK', dataIndex: 'nik', key: 'nik' },
    { title: 'Nama', dataIndex: 'name', key: 'name' },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: (value: string) => (value === 'male' ? 'Laki-laki' : 'Perempuan')
    },
    {
      title: 'Tgl Lahir',
      dataIndex: 'birthDate',
      key: 'birthDate',
      render: (value: string | Date) => (value ? dayjs(value).format('DD MMM YYYY') : '-')
    },
    { title: 'Alamat', dataIndex: 'address', key: 'address' }
  ]

  const dataSource = (queryData?.data || []).map((item, idx) => ({ ...item, no: idx + 1 }))

  const onFinish = async (values: any) => {
    console.log('Registration Values:', values)
    // TODO: Implement actual registration logic here
    // window.api.query.queue.create(values)
    setOpenRegistration(false)
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pendaftaran Pasien</h1>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Cari NIK"
          value={searchKode}
          onChange={(e) => setSearchKode(e.target.value)}
          style={{ width: 200 }}
        />
        <Input
          placeholder="Cari Nama"
          value={searchNama}
          onChange={(e) => setSearchNama(e.target.value)}
          style={{ width: 200 }}
        />
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          Refresh
        </Button>
        <Button type="primary" icon={<PlusOutlined />}>
          Register Baru
        </Button>
      </div>

      <GenericTable
        columns={columns}
        dataSource={dataSource as any}
        rowKey="id"
        loading={isLoading || isRefetching}
        action={{
          items(record) {
            return [
              {
                label: 'Detail',
                icon: <SearchOutlined />,
                onClick: () => console.log(record)
              },
              {
                label: 'Daftar',
                icon: <PlusOutlined />,
                onClick: () => {
                  setSelectedPatient(record)
                  setOpenRegistration(true)
                }
              }
            ]
          }
        }}
      />

      <RegistrationSheet
        open={openRegistration}
        onClose={() => setOpenRegistration(false)}
        patient={selectedPatient}
        onFinish={onFinish}
      />
    </div>
  )
}

export default Pendaftaran
