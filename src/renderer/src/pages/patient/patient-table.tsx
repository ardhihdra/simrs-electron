import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { useQuery } from '@tanstack/react-query'
import { Col, Form, Input } from 'antd'
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
    console.log('Registration Values:', values)
    // TODO: Implement actual registration logic here
    // window.api.query.queue.create(values)
    setOpenRegistration(false)
  }

  return (
    <div>
      <TableHeader
        title="Daftar Pasien"
        onSearch={(values) => setFilter(values)}
        onReset={() => setFilter({ nik: '', name: '' })}
        onCreate={() => navigate('/dashboard/patient/register')}
        createLabel="Pasien Baru"
        loading={isLoading || isRefetching}
      >
        <Col span={12}>
          <Form.Item name="nik" label="NIK">
            <Input placeholder="Cari NIK" allowClear />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="name" label="Nama">
            <Input placeholder="Cari Nama" allowClear />
          </Form.Item>
        </Col>
      </TableHeader>

      <div className="mt-4">
        <GenericTable
          columns={columns}
          dataSource={dataSource as any}
          rowKey="id"
          loading={isLoading || isRefetching}
          // action={{
          //   items(record) {
          //     return [
          //       {
          //         label: 'Detail',
          //         icon: <SearchOutlined />,
          //         onClick: () => console.log(record)
          //       },
          //       {
          //         label: 'Daftar',
          //         icon: <PlusOutlined />,
          //         onClick: () => {
          //           setSelectedPatient(record)
          //           setOpenRegistration(true)
          //         }
          //       }
          //     ]
          //   }
          // }}
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
