/**
 * purpose: Render reusable vital signs input fields for assessment forms.
 * main callers: `InitialAssessmentForm`, `VitalSignsMonitoringForm`.
 * key dependencies: Ant Design `Form`, `InputNumber`, `Select`, and `getVitalSignRules`.
 * main/public functions: `VitalSignsSection`.
 * side effects: Writes form field values to the parent Ant Design form state.
 */
import { Col, Form, InputNumber, Row, Select, FormInstance } from 'antd'
import { getVitalSignRules } from './vital-signs-validation'

const { Option } = Select

interface VitalSignsSectionProps {
  form: FormInstance
  hideAnthropometry?: boolean
  showConsciousness?: boolean
}

export const VitalSignsSection: React.FC<VitalSignsSectionProps> = ({
  // eslint-disable-next-line react/prop-types
  hideAnthropometry = false,
  // eslint-disable-next-line react/prop-types
  showConsciousness = false
}) => {
  const vitalColProps = { xs: 24, md: 12, xl: 12 }
  const anthropometryColProps = { xs: 24, md: 12, xl: 12 }

  return (
    <>
      <Row gutter={16}>
        <Col {...vitalColProps}>
          <Form.Item
            label="Tekanan Darah Sistolik (mmHg)"
            name={['vitalSigns', 'systolicBloodPressure']}
            rules={getVitalSignRules('systolicBloodPressure')}
          >
            <InputNumber min={0} max={300} placeholder="100" className="w-full" addonAfter="mmHg" />
          </Form.Item>
        </Col>
        <Col {...vitalColProps}>
          <Form.Item
            label="Tekanan Darah Diastolik (mmHg)"
            name={['vitalSigns', 'diastolicBloodPressure']}
            rules={getVitalSignRules('diastolicBloodPressure')}
          >
            <InputNumber min={0} max={200} placeholder="80" className="w-full" addonAfter="mmHg" />
          </Form.Item>
        </Col>
        <Col {...vitalColProps}>
          <Form.Item label="Lokasi Pengukuran" name={['vitalSigns', 'bloodPressureBodySite']}>
            <Select placeholder="Pilih lokasi">
              <Option value="Left arm">Lengan Kiri</Option>
              <Option value="Right arm">Lengan Kanan</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col {...vitalColProps}>
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
        <Col {...vitalColProps}>
          <Form.Item
            label="Suhu Tubuh (°C)"
            name={['vitalSigns', 'temperature']}
            rules={getVitalSignRules('temperature')}
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
        <Col {...vitalColProps}>
          <Form.Item label="Metode Suhu" name={['vitalSigns', 'temperatureMethod']}>
            <Select placeholder="Pilih metode">
              <Option value="Axillary">Axilla (Ketiak)</Option>
              <Option value="Oral">Oral (Mulut)</Option>
              <Option value="Rectal">Rectal (Anus)</Option>
              <Option value="Tympanic">Tympanic (Telinga)</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col {...vitalColProps}>
          <Form.Item
            label="Nadi (bpm)"
            name={['vitalSigns', 'pulseRate']}
            rules={getVitalSignRules('pulseRate')}
          >
            <InputNumber min={30} max={200} placeholder="80" className="w-full" addonAfter="bpm" />
          </Form.Item>
        </Col>
        <Col {...vitalColProps}>
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
        <Col {...vitalColProps}>
          <Form.Item
            label="Pernapasan (per menit)"
            name={['vitalSigns', 'respiratoryRate']}
            rules={getVitalSignRules('respiratoryRate')}
          >
            <InputNumber min={10} max={60} placeholder="20" className="w-full" addonAfter="/min" />
          </Form.Item>
        </Col>
        <Col {...vitalColProps}>
          <Form.Item
            label="Saturasi Oksigen - SpO2 (%)"
            name={['vitalSigns', 'oxygenSaturation']}
            rules={getVitalSignRules('oxygenSaturation')}
          >
            <InputNumber min={0} max={100} placeholder="98" className="w-full" addonAfter="%" />
          </Form.Item>
        </Col>
        {showConsciousness && (
          <Col {...vitalColProps}>
            <Form.Item label="Kesadaran" name="consciousness" rules={[{ required: true }]}>
              <Select placeholder="Pilih Kesadaran">
                <Option value="Compos Mentis">Compos Mentis</Option>
                <Option value="Apatis">Apatis</Option>
                <Option value="Somnolen">Somnolen</Option>
                <Option value="Sopor">Sopor</Option>
                <Option value="Coma">Coma</Option>
              </Select>
            </Form.Item>
          </Col>
        )}
      </Row>
      {!hideAnthropometry && (
        <>
          <div className="text-xs font-bold text-gray-500 mt-6 mb-2 uppercase tracking-tight">
            Antropometri
          </div>
          <Row gutter={16}>
            <Col {...anthropometryColProps}>
              <Form.Item
                label="Tinggi Badan (cm)"
                name={['vitalSigns', 'height']}
                className="mb-0"
                rules={getVitalSignRules('height')}
              >
                <InputNumber placeholder="0" className="w-full" min={0} addonAfter="cm" />
              </Form.Item>
            </Col>
            <Col {...anthropometryColProps}>
              <Form.Item
                label="Berat Badan (kg)"
                name={['vitalSigns', 'weight']}
                className="mb-0"
                rules={getVitalSignRules('weight')}
              >
                <InputNumber placeholder="0" className="w-full" min={0} addonAfter="kg" />
              </Form.Item>
            </Col>
            <Col {...anthropometryColProps}>
              <Form.Item
                label="IMT / BMI (kg/m2)"
                name={['vitalSigns', 'bmi']}
                className="mb-0"
                tooltip="Indeks Massa Tubuh (Body Mass Index)"
              >
                <InputNumber
                  placeholder="0"
                  className="w-full"
                  min={0}
                  step={0.01}
                  addonAfter="kg/m²"
                />
              </Form.Item>
            </Col>
            <Col {...anthropometryColProps}>
              <Form.Item
                label="LPB / BSA (m2)"
                name={['vitalSigns', 'bsa']}
                className="mb-0"
                tooltip="Luas Permukaan Tubuh (Body Surface Area)"
              >
                <InputNumber
                  placeholder="0"
                  className="w-full"
                  min={0}
                  step={0.01}
                  addonAfter="m²"
                />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
    </>
  )
}
