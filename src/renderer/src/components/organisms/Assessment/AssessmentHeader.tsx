import { Card, Col, DatePicker, Form, Row, Select } from 'antd'
import React from 'react'
import { SelectProps } from 'antd'

const { Option } = Select

export const AssessmentHeader: React.FC = () => {
  return (
    <Card title="Data Asesmen & Pemeriksa" className="py-4">
      <Row gutter={24}>
        <Col span={10}>
          <Form.Item label="Tanggal Asesmen" name="assessment_date" rules={[{ required: true }]}>
            <DatePicker showTime className="w-full" format="DD MMM YYYY HH:mm" />
          </Form.Item>
        </Col>
        <Col span={10}>
          <Form.Item label="Perawat Pemeriksa" name="performer" rules={[{ required: true }]}>
            <Select showSearch placeholder="Pilih Perawat">
              <Option value="Perawat Jaga">Perawat Jaga</Option>
              <Option value="Perawat Ahli">Perawat Ahli</Option>
              <Option value="Perawat Senior">Perawat Senior</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}
