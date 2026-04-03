import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Spin, Input } from 'antd'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import {
  useBulkCreateCondition,
  useConditionByEncounter
} from '@renderer/hooks/query/use-condition'
import { formatAnamnesisFromConditions } from '@renderer/utils/formatters/condition-formatter'
import {
  CONDITION_CATEGORIES,
  type ConditionBuilderOptions,
  createConditionBatch
} from '@renderer/utils/builders/condition-builder'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { PatientData } from '@renderer/types/doctor.types'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'

const { TextArea } = Input

export interface AnamnesisFormProps {
  encounterId: string
  patientData: PatientData
  hideHeader?: boolean
  globalPerformerId?: string | number
}

export const AnamnesisForm: React.FC<AnamnesisFormProps> = ({
  encounterId,
  patientData,
  hideHeader = false,
  globalPerformerId
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bulkCreateCondition = useBulkCreateCondition()

  const patientId = patientData.patient.id
  const patientIdStr = patientId ? String(patientId) : undefined

  const { data: conditionResponse } = useConditionByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])

  useEffect(() => {
    const conditions = conditionResponse?.result

    if (conditionResponse?.success && conditions) {
      const anamnesis = formatAnamnesisFromConditions(conditions)

      const hasAnamnesisData =
        Object.values(anamnesis).some((v) => !!v) || (conditions && conditions.length > 0)

      if (hasAnamnesisData) {
        form.setFieldsValue({
          anamnesis: {
            chiefComplaint: anamnesis.chiefComplaint,
            historyOfPastIllness: anamnesis.historyOfPastIllness,
            associatedSymptoms: anamnesis.associatedSymptoms
          }
        })
      }
    }
  }, [conditionResponse, form])

  const handleFinish = async (values: any) => {
    if (!encounterId || !patientIdStr) return

    let performerId = values.performerId
    if (hideHeader && globalPerformerId) {
      performerId = Number(globalPerformerId)
    }

    if (!performerId) {
      message.error('Mohon pilih pemeriksa atau pastikan dokter DPJP tersedia')
      return
    }

    try {
      setIsSubmitting(true)
      const conditions: any[] = []
      const { anamnesis, assessment_date } = values
      const recordedDate = assessment_date
        ? dayjs(assessment_date).toISOString()
        : dayjs().toISOString()
      const conditionsToCreate: ConditionBuilderOptions[] = []

      if (anamnesis?.chiefComplaint) {
        conditionsToCreate.push({
          category: CONDITION_CATEGORIES.CHIEF_COMPLAINT,
          notes: anamnesis.chiefComplaint,
          recordedDate
        })
      }

      if (anamnesis?.associatedSymptoms) {
        conditionsToCreate.push({
          category: CONDITION_CATEGORIES.ASSOCIATED_SYMPTOMS,
          notes: anamnesis.associatedSymptoms,
          recordedDate
        })
      }

      if (conditionsToCreate.length > 0) {
        conditions.push(...createConditionBatch(conditionsToCreate))
      }

      const promises: Promise<any>[] = []

      if (conditions.length > 0) {
        promises.push(
          bulkCreateCondition.mutateAsync({
            encounterId,
            patientId: patientIdStr,
            doctorId: performerId ? Number(performerId) : 0,
            conditions
          })
        )
      }

      await Promise.all(promises)
      message.success('Anamnesis berhasil disimpan')

      const { queryClient } = await import('@renderer/query-client')
      queryClient.invalidateQueries({ queryKey: ['observation', 'by-encounter', encounterId] })
      queryClient.invalidateQueries({ queryKey: ['condition', 'by-encounter', encounterId] })

      form.resetFields(['assessment_date', 'performerId'])
      form.setFieldValue('assessment_date', dayjs())
    } catch (error: any) {
      console.error('Error saving anamnesis:', error)
      const detailError = error?.error || error?.message || 'Error'
      message.error(`Gagal menyimpan anamnesis: ${detailError}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      className="flex! flex-col! gap-4!"
      initialValues={{
        assessment_date: dayjs()
      }}
    >
      <Spin spinning={isSubmitting} tip="Menyimpan Anamnesis..." size="large">
        {!hideHeader && (
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
        )}

        <Card title="Anamnesis" className="mt-4!">
          <Form.Item
            label={<span className="font-semibold">Keluhan Utama</span>}
            name={['anamnesis', 'chiefComplaint']}
            rules={[{ required: true, message: 'Keluhan utama wajib diisi' }]}
          >
            <TextArea rows={3} placeholder="Masukkan keluhan utama pasien..." />
          </Form.Item>

          <Form.Item
            label={<span className="font-semibold">Keluhan Penyerta</span>}
            name={['anamnesis', 'associatedSymptoms']}
            className="mb-0"
          >
            <TextArea rows={3} placeholder="Masukkan keluhan penyerta pasien (jika ada)..." />
          </Form.Item>
        </Card>

        <Form.Item className="flex justify-end pt-4!">
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            size="large"
            disabled={isSubmitting}
          >
            Simpan Anamnesis
          </Button>
        </Form.Item>
      </Spin>
    </Form>
  )
}
