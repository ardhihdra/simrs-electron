import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Spin } from 'antd'

const { TextArea } = Input
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

import { useCreateAllergy, useAllergyByEncounter } from '../../../hooks/query/use-allergy'
import { useBulkCreateCondition, useConditionByEncounter } from '../../../hooks/query/use-condition'
import {
  useCreateFamilyHistory,
  useFamilyHistoryByPatient
} from '../../../hooks/query/use-family-history'
import {
  useBulkCreateObservation,
  useObservationByEncounter
} from '../../../hooks/query/use-observation'
import { formatObservationSummary } from '../../../utils/observation-helpers'
import {
  createObservationBatch,
  OBSERVATION_CATEGORIES,
  type ObservationBuilderOptions
} from '../../../utils/observation-builder'
import {
  createConditionBatch,
  createCondition,
  createAllergy as buildAllergy,
  createFamilyHistory as buildFamilyHistory,
  CONDITION_CATEGORIES,
  type ConditionBuilderOptions
} from '../../../utils/clinical-data-builder'
import { AnamnesisSection } from './AnamnesisSection'
import { AssessmentHeader } from './AssessmentHeader'
import { ConclusionSection } from './ConclusionSection'
import { FunctionalStatusSection } from './FunctionalStatusSection'
import { PhysicalExamSection } from './PhysicalExamSection'
import { PsychosocialSection } from './PsychosocialSection'
import { ScreeningSection } from './ScreeningSection'
import { VitalSignsSection } from './VitalSignsSection'
import { HeadToToeSection } from './HeadToToeSection'
import { HEAD_TO_TOE_MAP } from '../../../config/observation-maps'

export interface InitialAssessmentFormProps {
  encounterId: string
  patientData?: any
  mode?: 'inpatient' | 'outpatient'
  performer?: {
    id: string | number
    name: string
    role?: string
  }
}

export const InitialAssessmentForm = ({
  encounterId,
  patientData,
  mode = 'inpatient',
  performer
}: InitialAssessmentFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bulkCreateObservation = useBulkCreateObservation()
  const bulkCreateCondition = useBulkCreateCondition()
  const createAllergy = useCreateAllergy()
  const createFamilyHistory = useCreateFamilyHistory()

  const patientId = patientData?.patient?.id || patientData?.id
  const { data: familyHistoryResponse } = useFamilyHistoryByPatient(patientId)
  const { data: allergyResponse } = useAllergyByEncounter(encounterId)

  const { data: response } = useObservationByEncounter(encounterId)
  const { data: conditionResponse } = useConditionByEncounter(encounterId)

  useEffect(() => {
    const observations = response?.result?.all
    const conditions = conditionResponse?.result

    if ((response?.success && observations) || (conditionResponse?.success && conditions)) {
      const summary = formatObservationSummary(observations || [], conditions || [])
      const {
        vitalSigns,
        physicalExamination,
        anamnesis,
        painAssessment,
        fallRisk,
        functionalStatus,
        psychosocialHistory,
        screening,
        conclusion,
        headToToe,
        clinicalNote
      } = summary

      // Vital Signs
      form.setFieldsValue({
        vitalSigns: {
          systolicBloodPressure: vitalSigns.systolicBloodPressure,
          diastolicBloodPressure: vitalSigns.diastolicBloodPressure,
          heartRate: vitalSigns.heartRate,
          pulseRate: vitalSigns.pulseRate,
          respiratoryRate: vitalSigns.respiratoryRate,
          temperature: vitalSigns.temperature,
          oxygenSaturation: vitalSigns.oxygenSaturation,
          height: vitalSigns.height,
          weight: vitalSigns.weight,
          bmi: vitalSigns.bmi,
          temperatureMethod: vitalSigns.temperatureMethod || 'Axillary',
          bloodPressureBodySite: vitalSigns.bloodPressureBodySite || 'Left arm',
          bloodPressurePosition:
            vitalSigns.bloodPressurePosition ||
            (mode === 'inpatient' ? 'Supine position' : 'Sitting position'),
          pulseRateBodySite: vitalSigns.pulseRateBodySite || 'Radial'
        }
      })

      if (mode === 'inpatient') {
        // Pain & Fall Risk
        form.setFieldsValue({
          pain_scale_score: painAssessment.painScore,
          chest_pain_check: painAssessment.chestPain,
          pain_notes: painAssessment.painNotes,
          get_up_go_a: fallRisk.gugA,
          get_up_go_b: fallRisk.gugB
        })
      }

      // Physical Exam
      form.setFieldsValue({
        physicalExamination: {
          generalCondition: physicalExamination.generalCondition,
          additionalNotes: physicalExamination.additionalNotes
        }
      })

      // Anamnesis
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

      // Auto-fill Family History
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

      // Auto-fill Allergy History
      if (allergyResponse?.success && allergyResponse?.result) {
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

      if (mode === 'inpatient') {
        // Functional Status
        form.setFieldsValue({
          aids_check: functionalStatus.aids_check,
          disability_check: functionalStatus.disability_check,
          adl_check: functionalStatus.adl_check
        })

        // Psychosocial
        form.setFieldsValue({
          psychological_status: psychosocialHistory.psychological_status?.split(', '),
          family_relation_note: psychosocialHistory.family_relation_note,
          living_with_note: psychosocialHistory.living_with_note,
          religion: psychosocialHistory.religion,
          culture_values: psychosocialHistory.culture_values,
          daily_language: psychosocialHistory.daily_language
        })

        // Screening
        form.setFieldsValue({
          consciousness_level: screening.consciousness_level,
          breathing_status: screening.breathing_status,
          cough_screening_status: screening.cough_screening_status
        })

        // Conclusion
        form.setFieldsValue({
          decision: conclusion.decision
        })
      }

      // Head to Toe
      if (headToToe && Object.keys(headToToe).length > 0) {
        const headToToeValues: any = {}
        Object.entries(headToToe).forEach(([key, data]) => {
          headToToeValues[key] = data.value
          headToToeValues[`${key}_NORMAL`] = data.isNormal
        })
        form.setFieldValue('headToToe', headToToeValues)
      }

      // Clinical Note
      if (clinicalNote) {
        form.setFieldValue('clinicalNote', clinicalNote)
      }
    }
  }, [
    response,
    conditionResponse,
    familyHistoryResponse,
    form,
    allergyResponse?.success,
    allergyResponse?.result,
    mode
  ])

  const getBMICategory = (bmi: number): { text: string; code: string } => {
    if (bmi < 18.5) return { text: 'Underweight', code: 'L' }
    if (bmi >= 18.5 && bmi < 25) return { text: 'Normal', code: 'N' }
    if (bmi >= 25 && bmi < 30) return { text: 'Overweight', code: 'H' }
    return { text: 'Obesitas', code: 'HH' }
  }

  const handleFinish = async (values: any) => {
    if (!encounterId) {
      message.error('Data kunjungan tidak ditemukan')
      return
    }

    try {
      setIsSubmitting(true)
      const obsToCreate: Omit<ObservationBuilderOptions, 'effectiveDateTime'>[] = []
      const conditions: any[] = []

      // --- 1. Vital Signs ---
      const { vitalSigns } = values
      if (vitalSigns?.systolicBloodPressure) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '8480-6',
          display: 'Systolic blood pressure',
          valueQuantity: { value: vitalSigns.systolicBloodPressure, unit: 'mmHg' },
          bodySites: [
            ...(vitalSigns.bloodPressureBodySite
              ? [
                  {
                    code: vitalSigns.bloodPressureBodySite,
                    display: vitalSigns.bloodPressureBodySite
                  }
                ]
              : []),
            ...(vitalSigns.bloodPressurePosition
              ? [
                  {
                    code: vitalSigns.bloodPressurePosition,
                    display: vitalSigns.bloodPressurePosition
                  }
                ]
              : [])
          ]
        } as any)
      }
      if (vitalSigns?.diastolicBloodPressure) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '8462-4',
          display: 'Diastolic blood pressure',
          valueQuantity: { value: vitalSigns.diastolicBloodPressure, unit: 'mmHg' }
        })
      }
      if (vitalSigns?.heartRate) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '8867-4',
          display: 'Heart rate',
          valueQuantity: { value: vitalSigns.heartRate, unit: '/min' }
        })
      }
      if (vitalSigns?.pulseRate) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '8867-4',
          display: 'Heart rate',
          valueQuantity: { value: vitalSigns.pulseRate, unit: '/min' },
          bodySites: vitalSigns.pulseRateBodySite
            ? [{ code: vitalSigns.pulseRateBodySite, display: vitalSigns.pulseRateBodySite }]
            : undefined
        } as any)
      }
      if (vitalSigns?.respiratoryRate) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '9279-1',
          display: 'Respiratory rate',
          valueQuantity: { value: vitalSigns.respiratoryRate, unit: '/min' }
        })
      }
      if (vitalSigns?.temperature) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '8310-5',
          display: 'Body temperature',
          valueQuantity: { value: vitalSigns.temperature, unit: 'Cel' },
          methods: vitalSigns.temperatureMethod
            ? [{ code: vitalSigns.temperatureMethod, display: vitalSigns.temperatureMethod }]
            : undefined
        } as any)
      }
      if (vitalSigns?.oxygenSaturation) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '2708-6',
          display: 'Oxygen saturation',
          valueQuantity: { value: vitalSigns.oxygenSaturation, unit: '%' }
        })
      }
      if (vitalSigns?.height) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '8302-2',
          display: 'Body height',
          valueQuantity: { value: vitalSigns.height, unit: 'cm' }
        })
      }
      if (vitalSigns?.weight) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '29463-7',
          display: 'Body weight',
          valueQuantity: { value: vitalSigns.weight, unit: 'kg' }
        })
      }
      if (vitalSigns?.bmi) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '39156-5',
          display: 'Body mass index (BMI)',
          valueQuantity: { value: vitalSigns.bmi, unit: 'kg/m2' },
          interpretations: [
            {
              code: getBMICategory(vitalSigns.bmi).code,
              display: getBMICategory(vitalSigns.bmi).text
            }
          ]
        })
      }

      // --- 2. Anamnesis ---
      const { anamnesis } = values
      const conditionsToCreate: ConditionBuilderOptions[] = []

      if (anamnesis?.chiefComplaint) {
        conditionsToCreate.push({
          category: CONDITION_CATEGORIES.CHIEF_COMPLAINT,
          notes: anamnesis.chiefComplaint,
          diagnosisCodeId: anamnesis.chiefComplaint_codeId
        })
      }
      if (anamnesis?.associatedSymptoms) {
        conditionsToCreate.push({
          category: CONDITION_CATEGORIES.ASSOCIATED_SYMPTOMS,
          notes: anamnesis.associatedSymptoms,
          diagnosisCodeId: anamnesis.associatedSymptoms_codeId
        })
      }
      if (anamnesis?.historyOfPresentIllness) {
        conditionsToCreate.push({
          category: anamnesis.historyOfPresentIllness_codeId
            ? CONDITION_CATEGORIES.PREVIOUS_CONDITION
            : CONDITION_CATEGORIES.HISTORY_OF_PRESENT_ILLNESS,
          notes: anamnesis.historyOfPresentIllness,
          diagnosisCodeId: anamnesis.historyOfPresentIllness_codeId
        })
      }

      if (conditionsToCreate.length > 0) {
        conditions.push(...createConditionBatch(conditionsToCreate))
      }

      // Save Allergy separately
      if (anamnesis?.allergyHistory || anamnesis?.allergyHistory_codeId) {
        try {
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
          await createAllergy.mutateAsync(allergyPayload)
        } catch (allergyError) {
          console.error('Failed to save allergy:', allergyError)
        }
      }

      // Save Family History separately
      if (anamnesis?.familyHistoryList && anamnesis.familyHistoryList.length > 0) {
        try {
          await createFamilyHistory.mutateAsync(
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
        } catch (fhError) {
          console.error('Failed to save family history:', fhError)
        }
      }

      if (anamnesis?.medicationHistory) {
        conditions.push(
          createCondition({
            category: CONDITION_CATEGORIES.MEDICATION_HISTORY,
            notes: anamnesis.medicationHistory
          })
        )
      }

      // --- 3. Physical Examination ---
      const { physicalExamination } = values
      if (physicalExamination?.generalCondition) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.EXAM,
          code: 'general-condition',
          display: 'General condition',
          valueString: physicalExamination.generalCondition
        })
      }
      if (physicalExamination?.additionalNotes) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.EXAM,
          code: 'physical-exam-notes',
          display: 'Physical examination notes',
          valueString: physicalExamination.additionalNotes
        })
      }

      if (mode === 'inpatient') {
        // --- 4. Functional Status ---
        if (values.aids_check) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'functional-status-aids',
            display: 'Alat Bantu',
            valueString: values.aids_check
          })
        }
        if (values.disability_check) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'functional-status-disability',
            display: 'Cacat Tubuh',
            valueString: values.disability_check
          })
        }
        if (values.adl_check) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'functional-status-adl',
            display: 'Aktivitas Sehari-hari (ADL)',
            valueString: values.adl_check
          })
        }

        // --- 5. Psychosocial, Spiritual & Cultural ---
        if (values.psychological_status && values.psychological_status.length > 0) {
          obsToCreate.push({
            category: 'social-history',
            code: 'psychological-status',
            display: 'Status Psikologis',
            valueString: Array.isArray(values.psychological_status)
              ? values.psychological_status.join(', ')
              : values.psychological_status
          })
        }
        if (values.family_relation_note) {
          obsToCreate.push({
            category: 'social-history',
            code: 'family-relation-note',
            display: 'Hubungan Keluarga',
            valueString: values.family_relation_note
          })
        }
        if (values.living_with_note) {
          obsToCreate.push({
            category: 'social-history',
            code: 'living-with-note',
            display: 'Tinggal Bersama',
            valueString: values.living_with_note
          })
        }
        if (values.religion) {
          obsToCreate.push({
            category: 'social-history',
            code: 'patient-religion',
            display: 'Agama',
            valueString: values.religion
          })
        }
        if (values.culture_values) {
          obsToCreate.push({
            category: 'social-history',
            code: 'culture-values',
            display: 'Nilai Budaya/Kepercayaan',
            valueString: values.culture_values
          })
        }
        if (values.daily_language) {
          obsToCreate.push({
            category: 'social-history',
            code: 'daily-language',
            display: 'Bahasa Sehari-hari',
            valueString: values.daily_language
          })
        }

        // --- 6. Supplemental Examination & Screening ---
        if (values.consciousness_level) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'consciousness-level',
            display: 'Tingkat Kesadaran (Skrining)',
            valueString: values.consciousness_level
          })
        }
        if (values.breathing_status) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'breathing-status',
            display: 'Status Pernapasan (Skrining)',
            valueString: values.breathing_status
          })
        }

        // Fall Risk
        if (values.get_up_go_a) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'fall-risk-gug-a',
            display: 'Get Up & Go - Cara Berjalan',
            valueString: values.get_up_go_a
          })
        }
        if (values.get_up_go_b) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'fall-risk-gug-b',
            display: 'Get Up & Go - Memegang Kursi',
            valueString: values.get_up_go_b
          })
        }

        // Pain
        if (values.pain_scale_score !== undefined) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'pain-score',
            display: 'Pain Scale Score (Wong-Baker)',
            valueQuantity: {
              value: values.pain_scale_score,
              unit: '{score}'
            }
          })
        }
        if (values.chest_pain_check) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'chest-pain-check',
            display: 'Nyeri Dada',
            valueString: values.chest_pain_check
          })
        }
        if (values.pain_notes) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'pain-notes',
            display: 'Catatan Karakteristik Nyeri',
            valueString: values.pain_notes
          })
        }

        // Cough Screening
        if (values.cough_screening_status) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'cough-screening',
            display: 'Skrining Batuk',
            valueString: values.cough_screening_status
          })
        }

        // --- 7. Decision ---
        if (values.decision) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'tindak-lanjut-keputusan',
            display: 'Keputusan Tindak Lanjut',
            valueString: values.decision
          })
        }
      }

      // --- Head to Toe (Outpatient only for now) ---
      if (mode === 'outpatient' && values.headToToe) {
        Object.entries(HEAD_TO_TOE_MAP).forEach(([key, label]) => {
          const textValue = values.headToToe[key]
          const isNormal = values.headToToe[`${key}_NORMAL`]

          if (textValue || isNormal === false) {
            obsToCreate.push({
              category: 'exam',
              code: key,
              display: `Physical findings of ${label.split('(')[0].trim()} Narrative`,
              system: 'http://loinc.org',
              valueString: textValue || (isNormal ? 'Dalam batas normal' : 'Abnormal'),
              valueBoolean: isNormal,
              interpretations: [
                {
                  code: isNormal ? 'N' : 'A',
                  display: isNormal ? 'Normal' : 'Abnormal',
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation'
                }
              ],
              bodySites: [
                {
                  code: key,
                  display: label,
                  system: 'http://snomed.info/sct'
                }
              ]
            } as any)
          }
        })
      }

      // --- Clinical Note (LOINC 8410-0) ---
      if (values.clinicalNote?.trim()) {
        obsToCreate.push({
          category: 'exam',
          code: '8410-0',
          display: 'Physical exam description Narrative',
          system: 'http://loinc.org',
          valueString: values.clinicalNote,
          notes: [values.clinicalNote]
        } as any)
      }

      const promises: Promise<any>[] = []

      if (obsToCreate.length > 0) {
        const observations = createObservationBatch(obsToCreate, values.assessment_date)

        promises.push(
          bulkCreateObservation.mutateAsync({
            encounterId,
            patientId,
            observations,
            performerId: String(performer?.id || 'nurse-001'),
            performerName: values.performer || performer?.name || 'Perawat Jaga'
          })
        )
      }
      if (conditions.length > 0) {
        promises.push(
          bulkCreateCondition.mutateAsync({
            encounterId,
            patientId,
            doctorId: 0,
            conditions
          })
        )
      }

      await Promise.all(promises)
      message.success('Asesmen berhasil disimpan')
    } catch (error) {
      console.error('Error saving assessment:', error)
      message.error('Gagal menyimpan asesmen')
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
      autoComplete="off"
      initialValues={{
        assessment_date: dayjs(),
        performer: performer?.name || 'Perawat Jaga',
        vitalSigns: {
          temperatureMethod: 'Axillary',
          bloodPressureBodySite: 'Left arm',
          bloodPressurePosition: mode === 'inpatient' ? 'Supine position' : 'Sitting position',
          pulseRateBodySite: 'Radial'
        },
        physicalExamination: {
          consciousness: 'Composmentis',
          generalCondition: 'Baik'
        },
        breathing: 'Normal',
        get_up_go_1: 'Tidak',
        get_up_go_2: 'Tidak',
        fall_risk_action: 'Tidak Berisiko',
        pain_scale: 0,
        cough_screening: 'Tidak batuk',
        conclusion: 'Sesuai'
      }}
    >
      <Spin spinning={isSubmitting} tip="Menyimpan data asesmen..." size="large">
        <div className="flex flex-col gap-4">
          <AssessmentHeader />
          <VitalSignsSection form={form} />
          <AnamnesisSection form={form} />
          <PhysicalExamSection />
          {mode === 'outpatient' && (
            <>
              <HeadToToeSection />
              <Card title="Catatan Pemeriksaan Fisik Tambahan" className="py-4">
                <Form.Item name="clinicalNote" className="mb-0">
                  <TextArea
                    rows={4}
                    placeholder="Tuliskan catatan tambahan mengenai hasil pemeriksaan fisik di sini..."
                  />
                </Form.Item>
              </Card>
            </>
          )}
          {mode === 'inpatient' && (
            <>
              <FunctionalStatusSection />
              <PsychosocialSection />
              <ScreeningSection />
              <ConclusionSection />
            </>
          )}
          <Form.Item className="flex justify-end pt-4">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
              disabled={isSubmitting}
            >
              Simpan Asesmen
            </Button>
          </Form.Item>
        </div>
      </Spin>
    </Form>
  )
}
