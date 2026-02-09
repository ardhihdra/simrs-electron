import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Form, Spin } from 'antd'

import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useCreateAllergy, useAllergyByEncounter } from '../../../hooks/query/use-allergy'
import { useBulkCreateCondition, useConditionByEncounter } from '../../../hooks/query/use-condition'
import {
  useCreateFamilyHistory,
  useFamilyHistoryByPatient
} from '../../../hooks/query/use-family-history'
import { useObservationByEncounter } from '../../../hooks/query/use-observation'
import { formatObservationSummary } from '../../../utils/observation-helpers'
import {
  createAllergy as buildAllergy,
  createFamilyHistory as buildFamilyHistory,
  CONDITION_CATEGORIES,
  type ConditionBuilderOptions,
  createConditionBatch
} from '../../../utils/clinical-data-builder'
import { AnamnesisSection } from './AnamnesisSection'
import { AssessmentHeader } from './AssessmentHeader'

export interface AnamnesisFormProps {
  encounterId: string
  patientData?: any
}

export const AnamnesisForm = ({ encounterId, patientData }: AnamnesisFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bulkCreateCondition = useBulkCreateCondition()
  const createAllergy = useCreateAllergy()
  const createFamilyHistory = useCreateFamilyHistory()

  const patientId = patientData?.patient?.id || patientData?.id

  const { data: familyHistoryResponse } = useFamilyHistoryByPatient(patientId)
  const { data: allergyResponse } = useAllergyByEncounter(encounterId)
  const { data: response } = useObservationByEncounter(encounterId)
  const { data: conditionResponse } = useConditionByEncounter(encounterId)

  const { data: performersData, isLoading: isLoadingPerformers } = useQuery({
    queryKey: ['kepegawaian', 'list', 'perawat'],
    queryFn: async () => {
      const fn = window.api?.query?.kepegawaian?.list
      if (!fn) throw new Error('API kepegawaian tidak tersedia')
      const res = await fn()
      if (res.success && res.result) {
        return res.result
          .filter((p: any) => p.hakAksesId === 'nurse' || p.hakAksesId === 'doctor')
          .map((p: any) => ({
            id: p.id,
            name: p.namaLengkap
          }))
      }
      return []
    }
  })

  useEffect(() => {
    const observations = response?.result?.all
    const conditions = conditionResponse?.result

    if ((response?.success && observations) || (conditionResponse?.success && conditions)) {
      const summary = formatObservationSummary(observations || [], conditions || [])
      const { anamnesis } = summary

      const hasAnamnesisData =
        Object.values(anamnesis).some((v) => !!v) || (conditions && conditions.length > 0)

      if (hasAnamnesisData) {
        form.setFieldsValue({
          anamnesis: {
            chiefComplaint: anamnesis.chiefComplaint,
            chiefComplaint_codeId: anamnesis.chiefComplaint_codeId,
            historyOfPresentIllness: anamnesis.historyOfPresentIllness,
            historyOfPresentIllness_codeId: anamnesis.historyOfPresentIllness_codeId,
            historyOfPastIllness: anamnesis.historyOfPastIllness,
            allergyHistory: anamnesis.allergyHistory,
            medicationHistory: anamnesis.medicationHistory,
            associatedSymptoms: anamnesis.associatedSymptoms,
            associatedSymptoms_codeId: anamnesis.associatedSymptoms_codeId
          }
        })
      }

      if (familyHistoryResponse?.success && familyHistoryResponse?.result) {
        const fhList = familyHistoryResponse.result.flatMap(
          (fh: any) =>
            fh.conditions?.map((cond: any) => ({
              diagnosisCodeId: String(cond.diagnosisCodeId),
              outcome: cond.outcome,
              contributedToDeath: cond.contributedToDeath,
              note: cond.note
            })) || []
        )

        if (fhList.length > 0) {
          form.setFieldValue(['anamnesis', 'familyHistoryList'], fhList)
        }
      }

      if (
        !form.getFieldValue(['anamnesis', 'allergyHistory']) &&
        allergyResponse?.success &&
        allergyResponse?.result
      ) {
        const allergies = allergyResponse.result
        if (Array.isArray(allergies) && allergies.length > 0) {
          const allergyNotes = allergies
            .map((a: any) => a.note)
            .filter(Boolean)
            .join(', ')
          if (allergyNotes) {
            form.setFieldValue(['anamnesis', 'allergyHistory'], allergyNotes)
          }
        }
      }
    }
  }, [
    response,
    conditionResponse,
    familyHistoryResponse,
    form,
    allergyResponse?.success,
    allergyResponse?.result
  ])

  const handleFinish = async (values: any) => {
    if (!encounterId || !patientId) return

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

      // Chief Complaint
      if (anamnesis?.chiefComplaint) {
        conditionsToCreate.push({
          category: CONDITION_CATEGORIES.CHIEF_COMPLAINT,
          notes: anamnesis.chiefComplaint,
          diagnosisCodeId: anamnesis.chiefComplaint_codeId,
          recordedDate
        })
      }

      // Associated Symptoms
      if (anamnesis?.associatedSymptoms) {
        conditionsToCreate.push({
          category: CONDITION_CATEGORIES.ASSOCIATED_SYMPTOMS,
          notes: anamnesis.associatedSymptoms,
          diagnosisCodeId: anamnesis.associatedSymptoms_codeId,
          recordedDate
        })
      }

      // History of Present Illness
      if (anamnesis?.historyOfPresentIllness) {
        conditionsToCreate.push({
          category: anamnesis.historyOfPresentIllness_codeId
            ? CONDITION_CATEGORIES.PREVIOUS_CONDITION
            : CONDITION_CATEGORIES.HISTORY_OF_PRESENT_ILLNESS,
          notes: anamnesis.historyOfPresentIllness,
          diagnosisCodeId: anamnesis.historyOfPresentIllness_codeId,
          recordedDate
        })
      }

      // Medication History
      if (anamnesis?.medicationHistory) {
        conditionsToCreate.push({
          category: CONDITION_CATEGORIES.MEDICATION_HISTORY,
          notes: anamnesis.medicationHistory,
          recordedDate
        })
      }

      if (conditionsToCreate.length > 0) {
        conditions.push(...createConditionBatch(conditionsToCreate))
      }

      const promises: Promise<any>[] = []

      // 1. Save Conditions
      if (conditions.length > 0) {
        promises.push(
          bulkCreateCondition.mutateAsync({
            encounterId,
            patientId,
            doctorId: values.performerId ? Number(values.performerId) : 0,
            conditions
          })
        )
      }

      // 2. Save Allergy
      if (anamnesis?.allergyHistory || anamnesis?.allergyHistory_codeId) {
        const allergyPayload = buildAllergy({
          patientId,
          encounterId,
          note: anamnesis.allergyHistory,
          diagnosisCodeId: anamnesis.allergyHistory_codeId
            ? Number(anamnesis.allergyHistory_codeId)
            : undefined,
          clinicalStatus: 'active',
          verificationStatus: 'confirmed'
        })
        promises.push(createAllergy.mutateAsync(allergyPayload))
      }

      // 3. Save Family History
      if (anamnesis?.familyHistoryList && anamnesis.familyHistoryList.length > 0) {
        promises.push(
          createFamilyHistory.mutateAsync(
            buildFamilyHistory({
              patientId,
              status: 'completed',
              relationship: 'other',
              conditions: anamnesis.familyHistoryList.map((item: any) => ({
                diagnosisCodeId: Number(item.diagnosisCodeId),
                outcome: item.outcome,
                contributedToDeath: item.contributedToDeath,
                note: item.note
              }))
            })
          )
        )
      }

      await Promise.all(promises)
      message.success('Anamnesis berhasil disimpan')

      const { queryClient } = await import('@renderer/query-client')
      queryClient.invalidateQueries({ queryKey: ['observation', 'by-encounter', encounterId] })
      queryClient.invalidateQueries({ queryKey: ['condition', 'by-encounter', encounterId] })
      queryClient.invalidateQueries({ queryKey: ['allergy', 'byEncounter', encounterId] })
      queryClient.invalidateQueries({ queryKey: ['family-history', 'list', patientId] })

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
      className="flex flex-col gap-4"
      initialValues={{
        assessment_date: dayjs()
      }}
    >
      <Spin spinning={isSubmitting} tip="Menyimpan Anamnesis..." size="large">
        <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
        <AnamnesisSection form={form} />

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
