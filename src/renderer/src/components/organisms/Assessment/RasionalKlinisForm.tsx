import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Spin, Select } from 'antd'
import React, { useEffect, useState } from 'react'
import { PatientData } from '@renderer/types/doctor.types'
import { AssessmentHeader } from './AssesmentHeader/AssessmentHeader'
import { formatClinicalImpression } from '@renderer/utils/formatters/clinical-impression-formatter'
import { createClinicalImpression } from '@renderer/utils/builders/clinical-impression-builder'
import { CLINICAL_IMPRESSION_CATEGORIES } from '@renderer/config/maps/clinical-impression-maps'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import {
  useClinicalImpressionByEncounter,
  useSaveClinicalImpression
} from '@renderer/hooks/query/use-clinical-impression'

const { TextArea } = Input

const DUMMY_INVESTIGATIONS = [
  { value: 'obs-lab-001', label: '[Lab] Hematologi Rutin' },
  { value: 'obs-lab-002', label: '[Lab] Kimia Darah' },
  { value: 'obs-rad-001', label: '[Rad] Rontgen Thorax' },
  { value: 'obs-rad-002', label: '[Rad] USG Abdomen' }
]

export interface RasionalKlinisFormProps {
  encounterId: string
  patientData: PatientData
  hideHeader?: boolean
  globalPerformerId?: string | number
}

export const RasionalKlinisForm: React.FC<RasionalKlinisFormProps> = ({
  encounterId,
  patientData,
  hideHeader = false,
  globalPerformerId
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const patientId = patientData.patient.id
  const patientIdStr = patientId ? String(patientId) : undefined

  const { data: impressionResponse, isLoading: isLoadingImpressions } =
    useClinicalImpressionByEncounter(encounterId)
  const saveImpression = useSaveClinicalImpression()

  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])

  const [existingId, setExistingId] = useState<string | undefined>()

  useEffect(() => {
    const impressions = impressionResponse?.data

    if (impressionResponse?.success && impressions && impressions.length > 0) {
      const formatted = formatClinicalImpression(impressions)

      const clinicalRationaleRecord = impressions.find(
        (i) => i.description === CLINICAL_IMPRESSION_CATEGORIES.CLINICAL_RATIONALE
      )

      if (clinicalRationaleRecord?.id) setExistingId(clinicalRationaleRecord.id)

      if (formatted.rasionalKlinis || formatted.investigations) {
        form.setFieldsValue({
          rasionalKlinis: formatted.rasionalKlinis || '',
          investigations: formatted.investigations || []
        })
      }
    }
  }, [impressionResponse, form])

  const onFinish = async (values: any) => {
    if (!patientIdStr) {
      message.error('Data Pasien tidak valid.')
      return
    }

    setIsSubmitting(true)

    try {
      const summaryText = values.rasionalKlinis

      const investigations =
        values.investigations?.map((id: string) => ({
          id,
          display:
            DUMMY_INVESTIGATIONS.find((opt) => opt.value === id)?.label || 'Pemeriksaan Penunjang'
        })) || []

      let practitionerId = patientData.doctor?.id?.toString()
      if (hideHeader && globalPerformerId) {
        practitionerId = globalPerformerId.toString()
      }

      const payload = createClinicalImpression({
        patientId: patientIdStr,
        patientName: patientData.patient?.name,
        encounterId: encounterId,
        practitionerId,
        summary: summaryText,
        category: CLINICAL_IMPRESSION_CATEGORIES.CLINICAL_RATIONALE,
        investigations
      })

      if (existingId) {
        ;(payload as any).id = existingId
      }

      await saveImpression.mutateAsync(payload)
      message.success('Rasional Klinis berhasil disimpan')
    } catch (error: any) {
      console.error('Error saving Rasional Klinis:', error)
      message.error(error.message || 'Gagal menyimpan Rasional Klinis')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      className="flex! flex-col! gap-4!"
      initialValues={{
        rasionalKlinis: ''
      }}
    >
      <Spin spinning={isLoadingImpressions || isLoadingPerformers}></Spin>
      {!hideHeader && (
        <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
      )}
      <Card title="Rasional Klinis">
        <Form.Item
          label="Pemeriksaan Penunjang Terkait (Laboratorium & Radiologi)"
          name="investigations"
        >
          <Select
            mode="multiple"
            placeholder="Pilih hasil pemeriksaan penunjang (Data Dummy)"
            options={DUMMY_INVESTIGATIONS}
            allowClear
          />
        </Form.Item>
        <Form.Item
          label="Ringkasan Rasional Klinis"
          name="rasionalKlinis"
          rules={[{ required: true, message: 'Harap isi Rasional Klinis' }]}
        >
          <TextArea rows={4} placeholder="Ketik detail rasional klinis di sini..." />
        </Form.Item>
      </Card>
      <Form.Item className="mb-0 text-right">
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          icon={<SaveOutlined />}
          loading={isSubmitting}
        >
          Simpan Rasional Klinis
        </Button>
      </Form.Item>
    </Form>
  )
}
