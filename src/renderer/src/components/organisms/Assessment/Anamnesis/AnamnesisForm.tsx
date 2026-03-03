import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Select, Spin, Input } from 'antd'
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
import { useDiagnosisCodeList } from '@renderer/hooks/query/use-diagnosis-code'
import { PatientData } from '@renderer/types/doctor.types'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'

const { Option } = Select
const { TextArea } = Input

export interface AnamnesisFormProps {
  encounterId: string
  patientData: PatientData
}

export const AnamnesisForm: React.FC<AnamnesisFormProps> = ({ encounterId, patientData }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [diagnosisOptions, setDiagnosisOptions] = useState<
    Array<{ id: string; code: string; display: string; id_display?: string }>
  >([])
  const [diagnosisSearch, setDiagnosisSearch] = useState('')
  const [debouncedDiagnosisSearch, setDebouncedDiagnosisSearch] = useState('')

  const { data: masterDiagnosis, isLoading: searchingDiagnosis } = useDiagnosisCodeList({
    q: debouncedDiagnosisSearch,
    items: 20
  })

  const bulkCreateCondition = useBulkCreateCondition()

  const patientId = patientData.patient.id
  const patientIdStr = patientId ? String(patientId) : undefined

  const { data: conditionResponse } = useConditionByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDiagnosisSearch(diagnosisSearch)
    }, 500)
    return () => clearTimeout(timer)
  }, [diagnosisSearch])

  useEffect(() => {
    if (debouncedDiagnosisSearch.length >= 2 && masterDiagnosis) {
      setDiagnosisOptions(masterDiagnosis)
    }
  }, [masterDiagnosis, debouncedDiagnosisSearch])

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
            chiefComplaint_codeId: anamnesis.chiefComplaint_codeId,
            historyOfPastIllness: anamnesis.historyOfPastIllness,
            associatedSymptoms: anamnesis.associatedSymptoms,
            associatedSymptoms_codeId: anamnesis.associatedSymptoms_codeId
          }
        })

        const opts: Array<{ id: string; code: string; display: string }> = []
        const parseDisplay = (codeId: string | undefined, codeDisplay: string | undefined) => {
          if (!codeId || !codeDisplay) return
          const dashIdx = codeDisplay.indexOf(' - ')
          const code = dashIdx >= 0 ? codeDisplay.slice(0, dashIdx) : codeDisplay
          const display = dashIdx >= 0 ? codeDisplay.slice(dashIdx + 3) : codeDisplay
          opts.push({ id: codeId, code, display })
        }
        parseDisplay(anamnesis.chiefComplaint_codeId, anamnesis.chiefComplaint_codeDisplay)
        parseDisplay(anamnesis.associatedSymptoms_codeId, anamnesis.associatedSymptoms_codeDisplay)

        if (opts.length > 0) {
          setDiagnosisOptions((prev) => {
            const existingIds = new Set(prev.map((o) => String(o.id)))
            const newOpts = opts.filter((o) => !existingIds.has(String(o.id)))
            return newOpts.length > 0 ? [...prev, ...newOpts] : prev
          })
        }
      }
    }
  }, [conditionResponse, form])

  const handleFinish = async (values: any) => {
    if (!encounterId || !patientIdStr) return

    if (!values.performerId) {
      message.error('Mohon pilih pemeriksa')
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

      if (anamnesis?.chiefComplaint_codeId) {
        conditionsToCreate.push({
          category: CONDITION_CATEGORIES.CHIEF_COMPLAINT,
          notes: anamnesis.chiefComplaint,
          diagnosisCodeId: Number(anamnesis.chiefComplaint_codeId),
          recordedDate
        })
      }

      if (anamnesis?.associatedSymptoms_codeId) {
        conditionsToCreate.push({
          category: CONDITION_CATEGORIES.ASSOCIATED_SYMPTOMS,
          notes: anamnesis.associatedSymptoms,
          diagnosisCodeId: Number(anamnesis.associatedSymptoms_codeId),
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
            doctorId: values.performerId ? Number(values.performerId) : 0,
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

  const handleDiagnosisSearch = (value: string) => {
    setDiagnosisSearch(value)
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
        <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

        <Card title="Anamnesis" className="mt-4!">
          <Form.Item label="Keluhan Utama" className="" required>
            <Form.Item
              name={['anamnesis', 'chiefComplaint_codeId']}
              style={{ marginBottom: 16 }}
              rules={[
                {
                  required: true,
                  message: 'Kode ICD-10/SNOMED wajib dipilih untuk sinkronisasi SatuSehat'
                }
              ]}
            >
              <Select
                showSearch
                filterOption={false}
                onSearch={handleDiagnosisSearch}
                placeholder="Cari kode ICD-10/SNOMED untuk keluhan utama..."
                className="w-full mb-2"
                notFoundContent={searchingDiagnosis ? <Spin size="small" /> : null}
                onSelect={(_, option: { label: string }) => {
                  form.setFieldValue(['anamnesis', 'chiefComplaint'], option.label)
                }}
                allowClear
              >
                {diagnosisOptions.map((d) => (
                  <Option
                    key={d.id}
                    value={d.id}
                    label={`${d.code} - ${d.id_display || d.display}`}
                  >
                    {d.code} - {d.id_display || d.display}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Detail Keluhan Utama"
              name={['anamnesis', 'chiefComplaint']}
              rules={[{ required: true, message: 'Wajib diisi' }]}
            >
              <TextArea rows={2} placeholder="Masukkan catatan tambahan keluhan utama pasien..." />
            </Form.Item>
          </Form.Item>

          <Form.Item label="Keluhan Penyerta" className="mb-0" required>
            <Form.Item
              name={['anamnesis', 'associatedSymptoms_codeId']}
              style={{ marginBottom: 16 }}
              rules={[
                {
                  required: true,
                  message: 'Kode ICD-10/SNOMED wajib dipilih untuk sinkronisasi SatuSehat'
                }
              ]}
            >
              <Select
                showSearch
                filterOption={false}
                onSearch={handleDiagnosisSearch}
                placeholder="Cari kode ICD-10/SNOMED untuk keluhan penyerta..."
                className="w-full mb-2"
                notFoundContent={searchingDiagnosis ? <Spin size="small" /> : null}
                onSelect={(_, option: { label: string }) => {
                  form.setFieldValue(['anamnesis', 'associatedSymptoms'], option.label)
                }}
                allowClear
              >
                {diagnosisOptions.map((d) => (
                  <Option
                    key={d.id}
                    value={d.id}
                    label={`${d.code} - ${d.id_display || d.display}`}
                  >
                    {d.code} - {d.id_display || d.display}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name={['anamnesis', 'associatedSymptoms']}>
              <TextArea
                rows={2}
                placeholder="Masukkan catatan tambahan keluhan penyerta (jika ada)..."
              />
            </Form.Item>
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
