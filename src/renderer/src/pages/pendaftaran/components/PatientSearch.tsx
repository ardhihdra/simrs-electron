
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Row } from 'antd';
import { useNavigate } from 'react-router';

export interface PatientSearchFilter {
  nik?: string;
  name?: string;
}

interface PatientSearchProps {
  onSearch: (filter: PatientSearchFilter) => void;
  loading?: boolean;
}

export const PatientSearch = ({ onSearch, loading }: PatientSearchProps) => {
  const [form] = Form.useForm();
const navigation = useNavigate();
  const handleFinish = (values: any) => {
    onSearch({
      nik: values.nik,
      name: values.name,
    });
  };

  return (
    <Card title="Cari Pasien" className="mb-8">
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
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
        </Row>
        <div className="flex justify-end gap-4">
          <Button type="default" onClick={() => navigation('/pasien')} icon={<PlusOutlined />}>
           Buat Pasien
          </Button>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
            Cari
          </Button>
        </div>
      </Form>
    </Card>
  );
};
