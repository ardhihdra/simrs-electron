import { Card, Col, DatePicker, Form, Row, Select } from 'antd'
import React from 'react'

const { Option } = Select

interface Performer {
  id: number | string
  name: string
}

interface AssessmentHeaderProps {
  performers?: Performer[]
  loading?: boolean
}

export const AssessmentHeader: React.FC<AssessmentHeaderProps> = ({
  performers = [],
  loading = false
}) => {
  return (
    <Card className="">
      <Row gutter={24}>
        <Col span={10}>
          <Form.Item
            label={<span className="font-semibold">Tanggal Asesmen</span>}
            name="assessment_date"
            rules={[{ required: true }]}
            className="mb-0"
          >
            <DatePicker showTime className="w-full" format="DD MMM YYYY HH:mm" />
          </Form.Item>
        </Col>
        <Col span={10}>
          <Form.Item
            label={<span className="font-semibold">Petugas Pemeriksa</span>}
            name="performerId"
            rules={[{ required: true, message: 'Wajib memilih petugas pemeriksa' }]}
            className="mb-0"
          >
            <Select
              showSearch
              placeholder="Pilih Petugas"
              loading={loading}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              {performers.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}
