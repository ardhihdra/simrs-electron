import { TableHeader } from '@renderer/components/TableHeader'
import { Col, Form, Input } from 'antd'
import { useNavigate } from 'react-router'

export interface PatientSearchFilter {
  nik?: string
  name?: string
}

interface PatientSearchProps {
  onSearch: (filter: PatientSearchFilter) => void
  loading?: boolean
}

export const PatientSearch = ({ onSearch, loading }: PatientSearchProps) => {
  const navigate = useNavigate()

  const handleFinish = (values: any) => {
    onSearch({
      nik: values.nik,
      name: values.name
    })
  }

  return (
    <TableHeader
      title="Cari Pasien"
      onSearch={handleFinish}
      loading={loading}
      onCreate={() => navigate('/dashboard/patient/register')}
      createLabel="Buat Pasien"
    >
      <Col span={12}>
        <Form.Item name="nik" label="NIK">
          <Input placeholder="Cari Pasien Berdasarkan NIK" allowClear />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item name="name" label="Nama">
          <Input placeholder="Cari Pasien Berdasarkan Nama" allowClear />
        </Form.Item>
      </Col>
    </TableHeader>
  )
}
