import { Card, Form, Radio } from 'antd'
import React from 'react'

export const ConclusionSection: React.FC = () => {
  return (
    <Card title="Keputusan" className="py-4">
      <Form.Item label="Keputusan Tindak Lanjut" name="decision">
        <Radio.Group>
          <Radio value="Sesuai Antrian">Poli Klinik Sesuai Antrian</Radio>
          <Radio value="Didahulukan">Poliklinik Didahulukan</Radio>
          <Radio value="IGD">IGD</Radio>
        </Radio.Group>
      </Form.Item>
    </Card>
  )
}
