import { EditOutlined, SyncOutlined, TeamOutlined } from '@ant-design/icons'
import { ExportButton } from '@renderer/components/molecules/ExportButton'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { TableHeaderStats } from '@renderer/components/TableHeaderStats'
import { rpc } from '@renderer/utils/client'
import { useQuery } from '@tanstack/react-query'
import { Form, Input, message } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PatientAttributes } from 'simrs-types'
import RegistrationSheet from './components/RegistrationSheet'

const PatientTable = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState({ nik: '', name: '' })
  const [openRegistration, setOpenRegistration] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientAttributes | undefined>(undefined)

  const {
    data: queryData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['patient', 'list', filter.nik, filter.name],
    queryFn: async () => {
      const fn = window.api.query.patient.list
      if (!fn) {
        throw new Error('Failed to load data')
      }
      return fn({
        nik: filter.nik,
        name: filter.name
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
    setOpenRegistration(false)
  }
  const handleSyncPatient = async (patientId: string) => {
    try {
      await rpc.visitManagement.patientSync({ patientId })
      message.success('Sync Satusehat berhasil')
    } catch (error: any) {
      console.error(error)
      message.error(error.message || 'Gagal sync Satusehat')
    } finally {
      message.destroy()
    }
  }
  return (
    <div>
      <TableHeader
        title="Daftar Pasien"
        subtitle="Manajemen pelayanan pasien"
        onSearch={(values) => setFilter(values)}
        onReset={() => setFilter({ nik: '', name: '' })}
        onCreate={() => navigate('/dashboard/patient/register')}
        createLabel="Pasien Baru"
        loading={isLoading || isRefetching}
        action={
          <ExportButton
            data={dataSource}
            fileName="daftar-pasien"
            columns={[
              { key: 'medicalRecordNumber', label: 'RM' },
              { key: 'nik', label: 'NIK' },
              { key: 'name', label: 'Nama' },
              { key: 'gender', label: 'Gender' },
              { key: 'birthDate', label: 'Tgl Lahir' },
              { key: 'address', label: 'Alamat' }
            ]}
          />
        }
        stats={
          <div className="grid grid-cols-6 gap-2 w-full">
            <TableHeaderStats
              icon={<TeamOutlined style={{ color: '#fff', fontSize: 16 }} />}
              value={dataSource.length}
              label="Total Pasien"
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
            items(record) {
              return [
                {
                  label: 'Sync Satusehat',
                  icon: <SyncOutlined />,
                  onClick: () => handleSyncPatient(record.id)
                },
                {
                  label: 'Ubah Data',
                  icon: <EditOutlined />,
                  onClick: () => navigate(`/dashboard/patient/edit/${record.id}`)
                }
              ]
            }
          }}
        />
      </div>

      <RegistrationSheet
        open={openRegistration}
        onClose={() => setOpenRegistration(false)}
        patient={selectedPatient}
        onFinish={onFinish}
      />
    </div>
  )
}

export default PatientTable
