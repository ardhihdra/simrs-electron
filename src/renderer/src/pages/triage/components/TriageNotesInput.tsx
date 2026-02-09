import { Col, Form, Input, Row, Select } from 'antd'

const { TextArea } = Input

export default function TriageNotesInput() {
  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="consciousness" label="Consciousness" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="COMPOS_MENTIS">Compos Mentis</Select.Option>
              <Select.Option value="APATHY">Apathy</Select.Option>
              <Select.Option value="DELIRIUM">Delirium</Select.Option>
              <Select.Option value="SOMNOLENCE">Somnolence</Select.Option>
              <Select.Option value="STUPOR">Stupor</Select.Option>
              <Select.Option value="COMA">Coma</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="notes" label="Notes">
        <TextArea rows={4} />
      </Form.Item>
    </>
  )
}
