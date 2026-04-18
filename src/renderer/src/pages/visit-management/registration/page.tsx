import {
  CheckCircleOutlined,
  HourglassOutlined,
  PlusOutlined,
  SyncOutlined,
  UserOutlined
} from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { TableHeaderStats } from '@renderer/components/TableHeaderStats'
import { useDebounce } from '@renderer/hooks/useDebounce'
import { client, rpc } from '@renderer/utils/client'
import { PatientAttributes } from 'simrs-types'
import { App, Button, Form, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import CreateQueueModal from '@renderer/components/organisms/visit-management/CreateQueueModal'

type RegistrationPatientRow = PatientAttributes & {
  no: number
  religion?: string | null
}

export default function RegistrationPage() {
  const [searchParams, setSearchParams] = useState({ nik: '', name: '', medicalRecordNumber: '' })
  const [openModal, setOpenModal] = useState(false)
  const [showDate, setShowDate] = useState(true)
  const { message } = App.useApp()
  const [selectedPatient, setSelectedPatient] = useState<PatientAttributes | undefined>(undefined)

  const debouncedNik = useDebounce(searchParams.nik, 500)
  const debouncedName = useDebounce(searchParams.name, 500)
  const debouncedMrn = useDebounce(searchParams.medicalRecordNumber, 500)

  const {
    data: patientData,
    isLoading,
    isRefetching
  } = client.visitManagement.getPatientList.useQuery({
    nik: debouncedNik,
    name: debouncedName,
    medicalRecordNumber: debouncedMrn
  })

  const columns: ColumnsType<RegistrationPatientRow> = [
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
      title: 'Agama',
      dataIndex: 'religion',
      key: 'religion',
      render: (value?: string | null) => value || '-'
    },
    {
      title: 'Tgl Lahir',
      dataIndex: 'birthDate',
      key: 'birthDate',
      render: (value: string | Date) => (value ? dayjs(value).format('DD MMM YYYY') : '-')
    },
    { title: 'Alamat', dataIndex: 'address', key: 'address' }
  ]

  const dataSource: RegistrationPatientRow[] = (patientData?.result || []).map((item, idx) => ({
    ...item,
    religion: (item as { religion?: string | null }).religion,
    no: idx + 1
  }))

  const handleCreateEmptyQueue = (showDate = true) => {
    setShowDate(showDate)
    setSelectedPatient(undefined)
    setOpenModal(true)
  }

  const handleRegisterPatient = (patient: PatientAttributes) => {
    setShowDate(false)
    setSelectedPatient(patient)
    setOpenModal(true)
  }

  const handleSyncPatient = async (patientId: string) => {
    try {
      await rpc.visitManagement.patientSync({ patientId })
      message.success('Sync Satusehat berhasil')
    } catch (error: any) {
      console.error(error)
      message.error(error.message || 'Gagal sync Satusehat')
    }
  }

  return (
    <div>
      <TableHeader
        title="Registrasi Pasien"
        subtitle="Manajemen pendaftaran pasien"
        onSearch={(values) => setSearchParams(values)}
        onReset={() => setSearchParams({ nik: '', name: '', medicalRecordNumber: '' })}
        onCreate={() => handleCreateEmptyQueue(false)}
        createLabel="Buat Antrian (Tanpa Pasien)"
        loading={isLoading || isRefetching}
        action={
          <Button type="primary" onClick={() => handleCreateEmptyQueue(true)}>
            Buat Janji
          </Button>
        }
        stats={
          <div className="grid grid-cols-4 gap-2 w-full">
            <TableHeaderStats
              variant="primary"
              icon={<UserOutlined style={{ fontSize: 16 }} />}
              value={dataSource.length}
              label="Total Pasien"
            />
            <TableHeaderStats
              variant="warning"
              icon={<HourglassOutlined style={{ fontSize: 16 }} />}
              value={12}
              label="Antrian"
            />
            <TableHeaderStats
              variant="info"
              icon={<SyncOutlined spin style={{ fontSize: 16 }} />}
              value={12}
              label="Dilayani"
            />
            <TableHeaderStats
              variant="success"
              icon={<CheckCircleOutlined style={{ fontSize: 16 }} />}
              value={12}
              label="Selesai"
            />
          </div>
        }
      >
        <Form.Item name="medicalRecordNumber" style={{ width: '100%' }}>
          <Input placeholder="Cari MRN" allowClear size="large" />
        </Form.Item>
        <Form.Item name="nik" style={{ width: '100%' }}>
          <Input placeholder="Cari NIK" allowClear size="large" />
        </Form.Item>
        <Form.Item name="name" style={{ width: '100%' }}>
          <Input placeholder="Cari Nama" allowClear size="large" />
        </Form.Item>
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
                label: 'Sync Satusehat',
                icon: <SyncOutlined />,
                onClick: () => handleSyncPatient(record.id)
              },
              {
                label: 'Daftar',
                icon: <PlusOutlined />,
                onClick: () => handleRegisterPatient(record),
                type: 'primary'
              }
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
        showDate={showDate}
        onSuccess={() => {
          // Refresh logic if needed, e.g. refetch active queues or something
          // Currently this page searches patients, so maybe not much to refresh unless we show active queues too
        }}
      />
    </div>
  )
}
