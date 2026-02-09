import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Form, Spin, Select } from 'antd'

import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

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
import { AssessmentHeader } from './AssessmentHeader'
import { ConclusionSection } from './ConclusionSection'
import { FunctionalStatusSection } from './FunctionalStatusSection'
import { PsychosocialSection } from './PsychosocialSection'
import { ScreeningSection } from './ScreeningSection'
import { VitalSignsSection } from './VitalSignsSection'
import { useQuery } from '@tanstack/react-query'

export interface InitialAssessmentFormProps {
  encounterId: string
  patientData?: any
  mode?: 'inpatient' | 'outpatient'
  role?: 'doctor' | 'nurse'
}

export const InitialAssessmentForm = ({
  encounterId,
  patientData,
  mode = 'inpatient'
}: InitialAssessmentFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadedVitals, setLoadedVitals] = useState<any>(null)
  const [loadedMeta, setLoadedMeta] = useState<{ date: string; performerId: number } | null>(null)

  const bulkCreateObservation = useBulkCreateObservation()

  const patientId = patientData?.patient?.id || patientData?.id

  const { data: response } = useObservationByEncounter(encounterId)

  const { data: performersData, isLoading: isLoadingPerformers } = useQuery({
    queryKey: ['kepegawaian', 'list', 'perawat'],
    queryFn: async () => {
      const fn = window.api?.query?.kepegawaian?.list
      if (!fn) throw new Error('API kepegawaian tidak tersedia')
      const res = await fn()
      if (res.success && res.result) {
        return res.result
          .filter((p: any) => p.hakAksesId === 'nurse')
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
    // const conditions = conditionResponse?.result

    if (response?.success && observations) {
      const summary = formatObservationSummary(observations || [], [])
      const {
        vitalSigns,
        painAssessment,
        fallRisk,
        functionalStatus,
        psychosocialHistory,
        screening,
        conclusion,
        clinicalNote,
        examinationDate
      } = summary

      setLoadedMeta({
        date: examinationDate ? dayjs(examinationDate).toISOString() : '',
        performerId: 0
      })

      const loadedVitalSigns = {
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
      setLoadedVitals(loadedVitalSigns)

      form.setFieldsValue({
        vitalSigns: loadedVitalSigns,
        consciousness: screening.consciousness_level || 'Compos Mentis' // Load saved consciousness if available
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

      // Clinical Note
      if (clinicalNote) {
        form.setFieldValue('clinicalNote', clinicalNote)
      }
    }
  }, [response, form, mode])

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

    if (!patientId) {
      message.error('Data pasien tidak ditemukan')
      return
    }

    if (!values.performerId) {
      message.error('Mohon pilih perawat pemeriksa')
      return
    }

    try {
      setIsSubmitting(true)
      const obsToCreate: Omit<ObservationBuilderOptions, 'effectiveDateTime'>[] = []

      const performerName =
        performersData?.find((p: any) => p.id === values.performerId)?.name || 'Unknown'
      const assessmentDate = values.assessment_date || dayjs()

      // --- 1. Vital Signs ---
      // CHECK FOR DUPLICATES: If Date, Performer, and Measurements are same as loaded, skip saving Vitals.
      const isDateSame = loadedMeta?.date
        ? dayjs(loadedMeta.date).isSame(assessmentDate, 'minute') // minute precision
        : false
      const isPerformerSame = loadedMeta?.performerId === values.performerId

      const { vitalSigns } = values

      // Only skip if EVERYTHING matches perfectly. If user changed anything, we save new version.
      // But typically we only want to skip if it's strictly a "re-save" of fetched data.
      let skipVitals = false
      if (isDateSame && isPerformerSame) {
        // Simple check on key metrics
        if (
          vitalSigns?.systolicBloodPressure === loadedVitals?.systolicBloodPressure &&
          vitalSigns?.diastolicBloodPressure === loadedVitals?.diastolicBloodPressure &&
          vitalSigns?.heartRate === loadedVitals?.heartRate &&
          vitalSigns?.respiratoryRate === loadedVitals?.respiratoryRate &&
          vitalSigns?.temperature === loadedVitals?.temperature
        ) {
          skipVitals = true
          console.log('Skipping duplicate vital signs (data unchanged)')
        }
      }

      if (!skipVitals) {
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
      } // End skipVitals check

      if (values.consciousness) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.EXAM,
          code: 'consciousness',
          display: 'Consciousness',
          valueString: values.consciousness
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
        const observations = createObservationBatch(obsToCreate, assessmentDate)
        console.log('Sending Observations Payload:', observations)

        promises.push(
          bulkCreateObservation.mutateAsync({
            encounterId,
            patientId,
            observations,
            performerId: String(values.performerId),
            performerName: performerName
          })
        )
      }

      await Promise.all(promises)
      message.success('Asesmen berhasil disimpan')
      // Reset form to default (fresh date/performer) for next append
      form.resetFields(['assessment_date', 'performerId'])
      form.setFieldValue('assessment_date', dayjs())
      // Optional: refetch is handled by React Query in the hook usually,
      // but if we need a refresh on this component:
      // response.refetch() or similar if available.
    } catch (error: any) {
      console.error('Error saving assessment:', error)
      message.error(`Gagal menyimpan asesmen: ${error?.message || 'Error tidak diketahui'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onFinishFailed = (errorInfo: any) => {
    console.error('Validasi Gagal:', errorInfo)
    message.error('Mohon lengkapi data yang wajib diisi (tanda vital, dll)')
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      onFinishFailed={onFinishFailed}
      className="flex flex-col gap-4"
      autoComplete="off"
      initialValues={{
        assessment_date: dayjs(),
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
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

          <div className="px-4">
            <Form.Item
              label={<span className="font-semibold">Kesadaran</span>}
              name="consciousness"
              rules={[{ required: true, message: 'Wajib diisi' }]}
              initialValue="Compos Mentis"
            >
              <Select placeholder="Pilih Kesadaran" className="w-full md:w-1/2">
                <Select.Option value="Compos Mentis">Compos Mentis</Select.Option>
                <Select.Option value="Apatis">Apatis</Select.Option>
                <Select.Option value="Somnolen">Somnolen</Select.Option>
                <Select.Option value="Sopor">Sopor</Select.Option>
                <Select.Option value="Coma">Coma</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <VitalSignsSection form={form} />

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
