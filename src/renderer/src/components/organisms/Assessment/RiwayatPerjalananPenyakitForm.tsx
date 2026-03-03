import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Spin } from 'antd'
import React, { useEffect, useState } from 'react'
import { PatientData } from '@renderer/types/doctor.types'
import { AssessmentHeader } from './AssesmentHeader/AssessmentHeader'
import { formatClinicalImpression } from '@renderer/utils/formatters/clinical-impression-formatter'
import {
  useClinicalImpressionByEncounter,
  useSaveClinicalImpression
} from '@renderer/hooks/query/use-clinical-impression'
import { createClinicalImpression } from '@renderer/utils/builders/clinical-impression-builder'
import { CLINICAL_IMPRESSION_CATEGORIES } from '@renderer/config/maps/clinical-impression-maps'
import { usePerformers } from '@renderer/hooks/query/use-performers'

const { TextArea } = Input

export interface RiwayatPerjalananPenyakitFormProps {
  encounterId: string
  patientData: PatientData
}

export const RiwayatPerjalananPenyakitForm: React.FC<RiwayatPerjalananPenyakitFormProps> = ({
  encounterId,
  patientData
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

      const clinicalCourseRecord = impressions.find(
        (i) => i.description === CLINICAL_IMPRESSION_CATEGORIES.CLINICAL_COURSE
      )
      if (clinicalCourseRecord?.id) setExistingId(clinicalCourseRecord.id)

      if (formatted.riwayatPerjalananPenyakit) {
        form.setFieldsValue({
          riwayatPerjalananPenyakit: formatted.riwayatPerjalananPenyakit
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
      const summaryText = values.riwayatPerjalananPenyakit

      const payload = createClinicalImpression({
        patientId: patientIdStr,
        patientName: patientData.patient?.name,
        encounterId: encounterId,
        practitionerId: patientData.doctor?.id?.toString(),
        summary: summaryText,
        category: CLINICAL_IMPRESSION_CATEGORIES.CLINICAL_COURSE
      })

      if (existingId) {
        ;(payload as any).id = existingId
      }

      await saveImpression.mutateAsync(payload)
      message.success('Riwayat Perjalanan Penyakit berhasil disimpan')
    } catch (error: any) {
      console.error('Error saving Riwayat Perjalanan Penyakit:', error)
      message.error(error.message || 'Gagal menyimpan Riwayat Perjalanan Penyakit')
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
        riwayatPerjalananPenyakit: ''
      }}
    >
      <Spin spinning={isLoadingImpressions || isLoadingPerformers}></Spin>
      <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
      <Card title="Riwayat Perjalanan Penyakit">
        <Form.Item
          label="Riwayat Perjalanan Penyakit"
          name="riwayatPerjalananPenyakit"
          rules={[{ required: true, message: 'Harap isi Riwayat Perjalanan Penyakit' }]}
        >
          <TextArea rows={6} placeholder="Ketik detail riwayat perjalanan penyakit di sini..." />
        </Form.Item>
      </Card>
      <Form.Item className="mb-0 text-right">
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting}>
          Simpan Riwayat Perjalanan Penyakit
        </Button>
      </Form.Item>
    </Form>
  )
}
