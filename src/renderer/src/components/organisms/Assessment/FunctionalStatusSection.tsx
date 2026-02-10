import { Card, Col, Form, Radio, Row } from 'antd'
import React from 'react'

export const FunctionalStatusSection: React.FC = () => {
  return (
    <Card title="Status Fungsional" className="py-4">
      <Row gutter={24}>
        <Col span={8}>
          <Form.Item label="Alat Bantu" name="aids_check" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="Tidak">Tidak</Radio>
              <Radio value="Ya">Ya</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Cacat Tubuh" name="disability_check" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="Tidak">Tidak</Radio>
              <Radio value="Ya">Ya</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Aktivitas Sehari-hari" name="adl_check" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="Mandiri">Mandiri</Radio>
              <Radio value="Perlu Bantuan">Perlu Bantuan</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}
