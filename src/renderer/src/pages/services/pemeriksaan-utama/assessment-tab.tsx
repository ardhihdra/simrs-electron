import { Form, Input, Row, Col, Button, Select, Divider } from 'antd'
import { PlusOutlined, FolderOpenOutlined } from '@ant-design/icons'

const { TextArea } = Input

export default function AssessmentTab() {
  const [form] = Form.useForm()

  return (
    <div className="p-4">
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        labelAlign="left"
      >
        <Form.Item label="Diagnosa Utama">
          <div className="flex gap-2">
            <Select placeholder="J02 / Faringitis akut ()" allowClear className="w-full" />
            <Button type="primary" icon={<PlusOutlined />} />
          </div>
        </Form.Item>

        <Form.Item label="Diagnosa Sekunder">
          <div className="flex gap-2">
            <Select placeholder="Pilih Diagnosa Sekunder" allowClear className="w-full" />
            <Button type="primary" icon={<PlusOutlined />} />
          </div>
        </Form.Item>

        <Form.Item label="Diagnosa Tambahan">
          <div className="flex gap-2">
            <Select placeholder="Pilih Diagnosa Sekunder" allowClear className="w-full" />
            <Button type="primary" icon={<PlusOutlined />} />
          </div>
        </Form.Item>

        <Form.Item label="Hasil Pemeriksaan" name="hasilPemeriksaan">
          <TextArea rows={4} />
        </Form.Item>

        <Row gutter={24} className="mt-8">
          <Col span={12}>
            <div className="font-bold mb-4">Foto Sebelum di Periksa</div>
          </Col>
          <Col span={12}>
            <div className="font-bold mb-4">Foto Setelah di Periksa</div>
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-2">
                  <Input />
                  <Button icon={<FolderOpenOutlined />} type="primary">
                    Cari
                  </Button>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Form>
      <Divider />
      <div className="flex justify-end">
        <Button type="primary">Simpan</Button>
      </div>
    </div>
  )
}
