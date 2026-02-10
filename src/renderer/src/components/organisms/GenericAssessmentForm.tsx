import { Button, Card, Empty, Form, Input, Radio, Space, Typography } from 'antd'
import { SaveOutlined } from '@ant-design/icons'

interface GenericAssessmentFormProps {
  title: string
  encounterId: string
  fields?: Array<{
    name: string
    label: string
    type: 'text' | 'textarea' | 'radio' | 'number'
    options?: string[]
  }>
}

export const GenericAssessmentForm = ({ title, fields = [] }: GenericAssessmentFormProps) => {
  const [form] = Form.useForm()

  return (
    <Card
      title={<span className="text-lg font-bold">{title}</span>}
      className="shadow-sm rounded-lg border-gray-200"
      extra={
        <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>
          Simpan
        </Button>
      }
    >
      {fields.length === 0 ? (
        <Empty
          description={
            <div className="text-center">
              <Typography.Text strong>Formulir {title} belum tersedia</Typography.Text>
              <br />
              <Typography.Text type="secondary">
                Modul ini sedang dalam tahap pengembangan.
              </Typography.Text>
            </div>
          }
        />
      ) : (
        <Form form={form} layout="vertical" onFinish={(vals) => console.log(vals)}>
          {fields.map((field) => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              rules={[{ required: true, message: 'Wajib diisi' }]}
            >
              {field.type === 'textarea' ? (
                <Input.TextArea rows={4} placeholder={`Masukkan ${field.label}`} />
              ) : field.type === 'radio' ? (
                <Radio.Group>
                  <Space direction="vertical">
                    {field.options?.map((opt) => (
                      <Radio key={opt} value={opt}>
                        {opt}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              ) : field.type === 'number' ? (
                <Input type="number" placeholder="0" />
              ) : (
                <Input placeholder={`Masukkan ${field.label}`} />
              )}
            </Form.Item>
          ))}
        </Form>
      )}
    </Card>
  )
}
