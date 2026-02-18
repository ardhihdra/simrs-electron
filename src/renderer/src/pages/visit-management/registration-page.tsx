import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { useDebounce } from '@renderer/hooks/useDebounce'
import { client } from '@renderer/utils/client'
import { PatientAttributes } from '@shared/patient'
import { Button, Form, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import CreateQueueModal from './components/CreateQueueModal'

export default function RegistrationPage() {
  const [searchParams, setSearchParams] = useState({ nik: '', name: '' })
  const [openModal, setOpenModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientAttributes | undefined>(undefined)

  const debouncedNik = useDebounce(searchParams.nik, 500)
  const debouncedName = useDebounce(searchParams.name, 500)

  const { data: patientData, isLoading, isRefetching } = client.patient.list.useQuery({
    nik: debouncedNik,
    name: debouncedName
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

  const dataSource = (patientData?.result || []).map((item, idx) => ({ ...item, no: idx + 1 }))

  const handleCreateEmptyQueue = () => {
    setSelectedPatient(undefined)
    setOpenModal(true)
  }

  const handleRegisterPatient = (patient: PatientAttributes) => {
    setSelectedPatient(patient)
    setOpenModal(true)
  }

  return (
    <div >
      <TableHeader
        title="Registrasi Kunjungan"
        onSearch={(values) => setSearchParams(values)}
        onReset={() => setSearchParams({ nik: '', name: '' })}
        onCreate={handleCreateEmptyQueue}
        createLabel="Buat Antrian (Tanpa Pasien)"
        loading={isLoading || isRefetching}
        
      >
        <div className="flex gap-4">
            <Form.Item name="nik" label="NIK" className="mb-0">
                <Input placeholder="Cari NIK" allowClear />
            </Form.Item>
            <Form.Item name="name" label="Nama Pasien" className="mb-0">
                <Input placeholder="Cari Nama" allowClear />
            </Form.Item>
        </div>
      </TableHeader>

      <div className="mt-4">
          <GenericTable
            columns={columns}
            dataSource={dataSource as any}
            rowKey="id"
            loading={isLoading || isRefetching}
            action={{
              title: 'Aksi',
              width: 150,
              items: (record) => [
                {
                  label: 'Daftar',
                  icon: <PlusOutlined />,
                  onClick: () => handleRegisterPatient(record),
                  type: 'primary'
                },
                // {
                //     label: 'Detail',
                //     icon: <SearchOutlined />,
                //     onClick: () => console.log('Detail patient', record)
                // }
              ]
            }}
          />
      </div>

      <CreateQueueModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        patient={selectedPatient}
        onSuccess={() => {
            // Refresh logic if needed, e.g. refetch active queues or something
            // Currently this page searches patients, so maybe not much to refresh unless we show active queues too
        }}
      />
    </div>
  )
}