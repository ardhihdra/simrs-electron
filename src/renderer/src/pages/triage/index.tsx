import { client } from '@renderer/utils/client'
import { Button, Card, Col, Divider, Form, InputNumber, message, Row, Select } from 'antd'
import PatientSelector from './components/PatientSelector'
import PractitionerSelector from './components/PractitionerSelector'
import TriageNotesInput from './components/TriageNotesInput'
import VitalSignsInputs from './components/VitalSignsInputs'

import { TriageRecordInput } from '@main/rpc/procedure/triage'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'

export default function TriagePage() {
  const [form] = Form.useForm()
  const location = useLocation()
  const navigate = useNavigate()
  const { mutateAsync: recordTriage } = client.triage.recordTriage.useMutation()
  
  const { encounterId, queueId, patient } = location.state || {}

  useEffect(() => {
    if (encounterId) {
      form.setFieldsValue({
        encounterId: encounterId
      })
    }
  }, [encounterId, form])

  const onFinish = async (values: any) => {
    try {
      const now = new Date().toISOString()
      const observations: any[] = []
      
      const addObs = (code: string, value: any, unit: string) => {
        if (value) {
            observations.push({
                code,
                valueQuantity: Number(value),
                valueUnit: unit,
                effectiveDateTime: now
            })
        }
      }

      addObs('SYSTOLIC_BP', values.systolic, 'mmHg')
      addObs('DIASTOLIC_BP', values.diastolic, 'mmHg')
      addObs('HEART_RATE', values.heartRate, 'bpm')
      addObs('RESPIRATORY_RATE', values.respiratoryRate, 'bpm')
      addObs('TEMPERATURE', values.temperature, 'Celsius')
      addObs('OXYGEN_SATURATION', values.oxygenSaturation, '%')
      addObs('BODY_HEIGHT', values.height, 'cm')
      addObs('BODY_WEIGHT', values.weight, 'kg')
      addObs('WAIST_CIRCUMFERENCE', values.waistCircumference, 'cm')
      addObs('BMI', values.bmi, 'kg/m2')

      await recordTriage({
        encounterId: encounterId || values.encounterId,
        patientId: patient?.id,
        practitionerId: Number(values.practitionerId),
        queueTicketId: queueId,
        observations,
        consciousness: values.consciousness || 'COMPOS_MENTIS', // Default or from form
        notes: values.notes
      } as TriageRecordInput)

      message.success('Data pemeriksaan berhasil disimpan')
      form.resetFields()
      navigate('/dashboard/registration/triage')
    } catch (error: any) {
      console.error('Failed to record triage', error)
      message.error(error.message || 'Gagal menyimpan data pemeriksaan')
    }
  }

  return (
    <div className="p-6">
      <Card title="Pemeriksaan Awal">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {patient ? (
            <Card className="mb-4 bg-gray-50">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="text-sm text-gray-500">Pasien</div>
                        <div className="text-lg font-bold">{patient.name}</div>
                        <div className="text-xs text-gray-400">{patient.recordId}</div>
                    </div>
                </div>
            </Card>
          ) : (
             <PatientSelector />
          )}
          <PractitionerSelector />
          <Divider>Pemeriksaan Fisik</Divider>
          <div className="mt-8 mb-4">
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Tinggi Badan" name="height">
                  <InputNumber addonAfter="cm" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Berat Badan" name="weight">
                  <InputNumber addonAfter="kg" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Lingkar Perut" name="waistCircumference">
                  <InputNumber addonAfter="cm" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="IMT" name="bmi">
                  <InputNumber addonAfter="kg/m²" className="w-full" />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <VitalSignsInputs />
          
          <Divider>Kesadaran & Catatan</Divider>
          <Form.Item name="consciousness" label="Tingkat Kesadaran" initialValue="COMPOS_MENTIS">
             <Select>
                <Select.Option value="COMPOS_MENTIS">Compos Mentis</Select.Option>
                <Select.Option value="APATHY">Apatis</Select.Option>
                <Select.Option value="DELIRIUM">Delirium</Select.Option>
                <Select.Option value="SOMNOLENCE">Somnolen</Select.Option>
                <Select.Option value="STUPOR">Stupor</Select.Option>
                <Select.Option value="COMA">Koma</Select.Option>
             </Select>
          </Form.Item>

          <TriageNotesInput />

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Simpan Pemeriksaan
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
