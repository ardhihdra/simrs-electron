import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Form, Spin, Card, Input } from 'antd'
import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import {
  useConditionByEncounter,
  useBulkCreateCondition
} from '@renderer/hooks/query/use-condition'
import {
  CONDITION_CATEGORIES,
  createConditionBatch
} from '@renderer/utils/builders/condition-builder'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { formatAnamnesisFromConditions } from '@renderer/utils/formatters/condition-formatter'
import { PatientData } from '@renderer/types/doctor.types'

const { TextArea } = Input

export interface MedicationFormProps {
  encounterId: string
  patientData: PatientData
  hideHeader?: boolean
  globalPerformerId?: string | number
}

export const MedicationForm: React.FC<MedicationFormProps> = ({
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

  const { data: conditionResponse, isLoading: isLoadingCondition } =
    useConditionByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])

  useEffect(() => {
    if (conditionResponse?.success && conditionResponse?.result) {
      const conditions = conditionResponse.result
      const sortedCond = [...conditions].sort((a: any, b: any) => {
        const dateA = dayjs(a.recordedDate || a.onsetDateTime || 0).valueOf()
        const dateB = dayjs(b.recordedDate || b.onsetDateTime || 0).valueOf()
        return dateB - dateA
      })

      const anamnesisFromCond = formatAnamnesisFromConditions(sortedCond as any)

      if (anamnesisFromCond.medicationHistory) {
        form.setFieldsValue({
          medicationHistory: anamnesisFromCond.medicationHistory
        })
      }
    }
  }, [conditionResponse?.success, conditionResponse?.result, form])

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
      const { assessment_date: assessmentDateValue } = values
      const recordedDate = assessmentDateValue
        ? dayjs(assessmentDateValue).toISOString()
        : dayjs().toISOString()

      if (values.medicationHistory) {
        const generatedCondition = createConditionBatch([
          {
            category: CONDITION_CATEGORIES.MEDICATION_HISTORY,
            notes: values.medicationHistory,
            recordedDate
          }
        ])

        await bulkCreateCondition.mutateAsync({
          encounterId,
          patientId: patientIdStr,
          doctorId: performerId ? Number(performerId) : 0,
          conditions: generatedCondition
        })

        message.success('Riwayat pengobatan berhasil disimpan')
        const { queryClient } = await import('@renderer/query-client')
        queryClient.invalidateQueries({ queryKey: ['condition', 'by-encounter', encounterId] })
      } else {
        message.warning('Tidak ada data riwayat pengobatan yang diisi')
      }
    } catch (error: any) {
      console.error('Error saving medication history:', error)
      const detailError = error?.error || error?.message || 'Error'
      message.error(`Gagal menyimpan riwayat pengobatan: ${detailError}`)
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
      <Spin spinning={isSubmitting || isLoadingCondition} tip="Memuat Form..." size="large">
        {!hideHeader && (
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
        )}

        <Card title="Riwayat Pengobatan" className="mt-4!">
          <Form.Item name="medicationHistory">
            <TextArea rows={4} placeholder="Masukkan riwayat pengobatan sebelumnya (jika ada)..." />
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
            Simpan Riwayat Pengobatan
          </Button>
        </Form.Item>
      </Spin>
    </Form>
  )
}
