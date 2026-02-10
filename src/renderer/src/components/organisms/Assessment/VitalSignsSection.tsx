import { Card, Col, Form, InputNumber, Row, Select, Tag, FormInstance } from 'antd'
import React, { useState } from 'react'

const { Option } = Select

interface VitalSignsSectionProps {
  form: FormInstance
}

export const VitalSignsSection: React.FC<VitalSignsSectionProps> = ({ form }) => {
  const [bmi, setBmi] = useState<number | null>(null)

  const calculateBMI = () => {
    const height = form.getFieldValue(['vitalSigns', 'height'])
    const weight = form.getFieldValue(['vitalSigns', 'weight'])

    if (height && weight && height > 0) {
      const heightInMeters = height / 100
      const calculatedBMI = weight / (heightInMeters * heightInMeters)
      const roundedBMI = Math.round(calculatedBMI * 100) / 100
      setBmi(roundedBMI)
      form.setFieldValue(['vitalSigns', 'bmi'], roundedBMI)
    }
  }

  const getBMICategory = (bmiValue: number): { text: string; color: string } => {
    if (bmiValue < 18.5) return { text: 'Kurus', color: 'blue' }
    if (bmiValue < 25) return { text: 'Normal', color: 'green' }
    if (bmiValue < 30) return { text: 'Gemuk', color: 'orange' }
    return { text: 'Obesitas', color: 'red' }
  }

  return (
    <Card title="Vital Signs / Tanda Vital" className="py-4">
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item
            label="Tekanan Darah Sistolik (mmHg)"
            name={['vitalSigns', 'systolicBloodPressure']}
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <InputNumber min={0} max={300} placeholder="100" className="w-full" addonAfter="mmHg" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            label="Tekanan Darah Diastolik (mmHg)"
            name={['vitalSigns', 'diastolicBloodPressure']}
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <InputNumber min={0} max={200} placeholder="80" className="w-full" addonAfter="mmHg" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Lokasi Pengukuran" name={['vitalSigns', 'bloodPressureBodySite']}>
            <Select placeholder="Pilih lokasi">
              <Option value="Left arm">Lengan Kiri</Option>
              <Option value="Right arm">Lengan Kanan</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Posisi" name={['vitalSigns', 'bloodPressurePosition']}>
            <Select placeholder="Pilih posisi">
              <Option value="Sitting position">Duduk</Option>
              <Option value="Supine position">Berbaring</Option>
              <Option value="Standing position">Berdiri</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Suhu Tubuh (°C)"
            name={['vitalSigns', 'temperature']}
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <InputNumber
              min={30}
              max={45}
              step={0.1}
              placeholder="36.5"
              className="w-full"
              addonAfter="°C"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Metode Suhu" name={['vitalSigns', 'temperatureMethod']}>
            <Select placeholder="Pilih metode">
              <Option value="Axillary">Axilla (Ketiak)</Option>
              <Option value="Oral">Oral (Mulut)</Option>
              <Option value="Rectal">Rectal (Anus)</Option>
              <Option value="Tympanic">Tympanic (Telinga)</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Nadi (bpm)"
            name={['vitalSigns', 'pulseRate']}
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <InputNumber min={30} max={200} placeholder="80" className="w-full" addonAfter="bpm" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Lokasi Nadi" name={['vitalSigns', 'pulseRateBodySite']}>
            <Select placeholder="Pilih lokasi">
              <Option value="Radial">Radial (Pergelangan Tangan)</Option>
              <Option value="Carotid">Carotid (Leher)</Option>
              <Option value="Brachial">Brachial (Siku)</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Pernapasan (per menit)"
            name={['vitalSigns', 'respiratoryRate']}
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <InputNumber min={10} max={60} placeholder="20" className="w-full" addonAfter="/min" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Saturasi Oksigen - SpO2 (%)"
            name={['vitalSigns', 'oxygenSaturation']}
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <InputNumber min={0} max={100} placeholder="98" className="w-full" addonAfter="%" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Tinggi Badan (cm)"
            name={['vitalSigns', 'height']}
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <InputNumber
              min={0}
              max={250}
              placeholder="170"
              className="w-full"
              onChange={calculateBMI}
              addonAfter="cm"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Berat Badan (kg)"
            name={['vitalSigns', 'weight']}
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <InputNumber
              min={0}
              max={300}
              step={0.1}
              placeholder="70"
              className="w-full"
              onChange={calculateBMI}
              addonAfter="kg"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="BMI (Body Mass Index)" name={['vitalSigns', 'bmi']}>
            <div className="flex items-center gap-2">
              <InputNumber disabled className="w-full" value={bmi || undefined} />
              {bmi && <Tag color={getBMICategory(bmi).color}>{getBMICategory(bmi).text}</Tag>}
            </div>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}
