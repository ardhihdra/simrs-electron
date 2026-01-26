import { Col, Divider, Form, Input, Row } from 'antd'

export default function VitalSignsInputs() {
  return (
    <>
      <Divider>Vital Signs</Divider>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="systolic" label="Systolic (mmHg)" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="diastolic" label="Diastolic (mmHg)" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="heartRate" label="Heart Rate (bpm)" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="respiratoryRate" label="Resp. Rate (bpm)" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="temperature" label="Temp (°C)" rules={[{ required: true }]}>
            <Input type="number" step="0.1" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="oxygenSaturation" label="SpO2 (%)" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
        </Col>
      </Row>
    </>
  )
}
