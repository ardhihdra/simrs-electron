import { client } from '@renderer/utils/client'
import { Button, Card, Col, Divider, Form, InputNumber, message, Row } from 'antd'
import PatientSelector from './components/PatientSelector'
import PractitionerSelector from './components/PractitionerSelector'
import TriageNotesInput from './components/TriageNotesInput'
import VitalSignsInputs from './components/VitalSignsInputs'

import { TriageRecordInput } from '@main/rpc/procedure/triage'
import { useEffect } from 'react'
import { useLocation } from 'react-router'

export default function TriagePage() {
  const [form] = Form.useForm()
  const location = useLocation()
  const { mutateAsync: recordTriage } = client.triage.recordTriage.useMutation()

  useEffect(() => {
    if (location.state?.encounterId) {
      form.setFieldsValue({
        encounterId: location.state.encounterId
      })
    }
  }, [location.state, form])

  const onFinish = async (values: any) => {
    try {
      const now = new Date().toISOString()
      const observations = [
        {
          code: 'SYSTOLIC_BP',
          valueQuantity: Number(values.systolic),
          valueUnit: 'mmHg',
          effectiveDateTime: now
        },
        {
          code: 'DIASTOLIC_BP',
          valueQuantity: Number(values.diastolic),
          valueUnit: 'mmHg',
          effectiveDateTime: now
        },
        {
          code: 'HEART_RATE',
          valueQuantity: Number(values.heartRate),
          valueUnit: 'bpm',
          effectiveDateTime: now
        },
        {
          code: 'RESPIRATORY_RATE',
          valueQuantity: Number(values.respiratoryRate),
          valueUnit: 'bpm',
          effectiveDateTime: now
        },
        {
          code: 'TEMPERATURE',
          valueQuantity: Number(values.temperature),
          valueUnit: 'Celsius',
          effectiveDateTime: now
        },
        {
          code: 'OXYGEN_SATURATION',
          valueQuantity: Number(values.oxygenSaturation),
          valueUnit: '%',
          effectiveDateTime: now
        }
      ]

      await recordTriage({
        encounterId: values.encounterId,
        practitionerId: Number(values.practitionerId),
        queueTicketId: values.encounterId,
        observations,
        consciousness: values.consciousness,
        notes: values.notes
      } as TriageRecordInput)

      message.success('Triage observation recorded successfully')
      form.resetFields()

      // Navigate or Refresh? Reference navigates to /queue-monitor.
      // We don't have that yet, or stick to this page.
      // navigate('/queue-monitor');
    } catch (error: any) {
      console.error('Failed to record triage', error)
      message.error(error.message || 'Failed to record triage')
    }
  }

  return (
    <div className="p-6">
      <Card title="Record Vital Signs">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <PatientSelector />
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
                  <InputNumber addonAfter="kg/m²" className="w-full" readOnly />
                </Form.Item>
              </Col>
            </Row>
          </div>
          <VitalSignsInputs />
          <TriageNotesInput />

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Submit Observation
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
