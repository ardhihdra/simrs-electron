import { Form, Input, Row, Col, Divider, Button } from 'antd'

export const SubjectiveTab = () => {
  const [form] = Form.useForm()

  const onFinish = (values: any) => {
    console.log('Received values of form: ', values)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        keluhanUtama: '',
        keluhanLainnya: ''
      }}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Form.Item label="Keluhan Utama" name="keluhanUtama">
            <Input.TextArea />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item label="Keluhan Lainnya" name="keluhanLainnya">
            <Input.TextArea />
          </Form.Item>
        </Col>
      </Row>
      <Divider />
      <div className="flex justify-end">
        <Button type="primary">Simpan</Button>
      </div>
    </Form>
  )
}
