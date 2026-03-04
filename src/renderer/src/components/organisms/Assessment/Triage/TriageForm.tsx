import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Radio, Select, Tag } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import type { PatientData } from '@renderer/types/doctor.types'
import {
  useBulkCreateObservation,
  useObservationByEncounter
} from '@renderer/hooks/query/use-observation'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { CTAS_LEVEL_MAP, TRANSPORTATION_SNOMED_MAP } from '@renderer/config/maps/observation-maps'
import {
  createObservationBatch,
  OBSERVATION_CATEGORIES,
  OBSERVATION_SYSTEMS
} from '@renderer/utils/builders/observation-builder'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'

interface TriageFormProps {
  encounterId: string
  patientData: PatientData
}

const TRIAGE_OBSERVATION_CODES = {
  TRANSPORTATION: '74286-6',
  REFERRAL_LETTER: 'OC000034',
  PATIENT_CONDITION: '75910-0'
} as const

const CTAS_COLORS: Record<string, string> = {
  '1': 'red',
  '2': 'orange',
  '3': 'gold',
  '4': 'green',
  '5': 'blue'
}

export const TriageForm = ({ encounterId, patientData }: TriageFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const { data: response, refetch } = useObservationByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])
  const bulkCreateObservation = useBulkCreateObservation()

  useEffect(() => {
    const observations = response?.result
    if (!response?.success || !Array.isArray(observations) || observations.length === 0) return

    const triageObs = observations.filter(
      (obs: any) =>
        obs.category === OBSERVATION_CATEGORIES.SURVEY &&
        Object.values(TRIAGE_OBSERVATION_CODES).includes(obs.code)
    )

    if (triageObs.length === 0) return

    const sorted = [...triageObs].sort(
      (a: any, b: any) =>
        dayjs(b.effectiveDateTime || b.issued || b.createdAt).valueOf() -
        dayjs(a.effectiveDateTime || a.issued || a.createdAt).valueOf()
    )

    const getLatestByCode = (code: string) => sorted.find((obs: any) => obs.code === code)

    const transportation = getLatestByCode(TRIAGE_OBSERVATION_CODES.TRANSPORTATION)
    const referralLetter = getLatestByCode(TRIAGE_OBSERVATION_CODES.REFERRAL_LETTER)
    const patientCondition = getLatestByCode(TRIAGE_OBSERVATION_CODES.PATIENT_CONDITION)

    const fieldsToSet: Record<string, any> = {}

    if (transportation?.valueCodeableConcept?.coding?.[0]?.code) {
      const code = transportation.valueCodeableConcept.coding[0].code
      const keyMatch = Object.entries(TRANSPORTATION_SNOMED_MAP).find(
        ([_, v]) => v.code === code
      )?.[0]
      if (keyMatch) fieldsToSet.transportation = keyMatch
    }

    if (referralLetter !== undefined && referralLetter?.valueBoolean !== undefined) {
      fieldsToSet.referral_letter = referralLetter.valueBoolean ? 'ya' : 'tidak'
    }

    if (patientCondition?.valueCodeableConcept?.coding?.[0]?.code) {
      const code = patientCondition.valueCodeableConcept.coding[0].code
      const keyMatch = Object.entries(CTAS_LEVEL_MAP).find(([_, v]) => v.code === code)?.[0]
      if (keyMatch) fieldsToSet.patient_condition = keyMatch
    }

    const firstObs = sorted[0] as any
    if (firstObs?.effectiveDateTime) {
      fieldsToSet.assessment_date = dayjs(firstObs.effectiveDateTime)
    }
    if (firstObs?.performers?.[0]?.practitionerId) {
      fieldsToSet.performerId = Number(firstObs.performers[0].practitionerId)
    }

    form.setFieldsValue(fieldsToSet)
  }, [response, form])

  const handleFinish = async (values: any) => {
    if (!encounterId) {
      message.error('Data kunjungan tidak ditemukan')
      return
    }

    try {
      const obsToCreate: any[] = []
      const assessmentDate = values.assessment_date || dayjs()

      // 1. Sarana transportasi
      if (values.transportation) {
        const snomed = TRANSPORTATION_SNOMED_MAP[values.transportation]
        if (snomed) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.SURVEY,
            code: TRIAGE_OBSERVATION_CODES.TRANSPORTATION,
            display: 'Transport mode to hospital',
            system: OBSERVATION_SYSTEMS.LOINC,
            codeCoding: [
              {
                system: OBSERVATION_SYSTEMS.LOINC,
                code: TRIAGE_OBSERVATION_CODES.TRANSPORTATION,
                display: 'Transport mode to hospital'
              }
            ],
            valueCodeableConcept: {
              coding: [
                {
                  system: OBSERVATION_SYSTEMS.SNOMED,
                  code: snomed.code,
                  display: snomed.display
                }
              ]
            }
          })
        }
      }

      // 2. Surat pengantar rujukan
      if (values.referral_letter !== undefined) {
        const isYes = values.referral_letter === 'ya'
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.SURVEY,
          code: TRIAGE_OBSERVATION_CODES.REFERRAL_LETTER,
          display: 'Surat Pengantar Rujukan',
          system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term',
          codeCoding: [
            {
              system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term',
              code: TRIAGE_OBSERVATION_CODES.REFERRAL_LETTER,
              display: 'Surat Pengantar Rujukan'
            }
          ],
          valueBoolean: isYes
        })
      }

      // 3. Kondisi pasien saat tiba (CTAS)
      if (values.patient_condition) {
        const ctas = CTAS_LEVEL_MAP[values.patient_condition]
        if (ctas) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.SURVEY,
            code: TRIAGE_OBSERVATION_CODES.PATIENT_CONDITION,
            display: 'Canadian triage and acuity scale [CTAS]',
            system: OBSERVATION_SYSTEMS.LOINC,
            codeCoding: [
              {
                system: OBSERVATION_SYSTEMS.LOINC,
                code: TRIAGE_OBSERVATION_CODES.PATIENT_CONDITION,
                display: 'Canadian triage and acuity scale [CTAS]'
              }
            ],
            valueCodeableConcept: {
              coding: [
                {
                  system: OBSERVATION_SYSTEMS.LOINC,
                  code: ctas.code,
                  display: ctas.display
                }
              ]
            }
          })
        }
      }

      if (obsToCreate.length === 0) {
        message.warning('Tidak ada data triase yang diisi')
        return
      }

      const observations = createObservationBatch(obsToCreate, assessmentDate)
      const performerName =
        performersData?.find((p: any) => p.id === values.performerId)?.name || 'Unknown'

      await bulkCreateObservation.mutateAsync({
        encounterId,
        patientId: patientData.patient.id,
        observations,
        performerId: String(values.performerId),
        performerName
      })

      message.success('Data triase berhasil disimpan')
      refetch()
    } catch (error: any) {
      console.error('Error saving triage data:', error)
      message.error(error?.message || 'Gagal menyimpan data triase')
    }
  }

  const selectedPatientCondition = Form.useWatch('patient_condition', form)
  const selectedConditionInfo = selectedPatientCondition
    ? CTAS_LEVEL_MAP[selectedPatientCondition]
    : null

  return (
    <div className="flex! flex-col! gap-4!">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="flex! flex-col! gap-4!"
        initialValues={{ assessment_date: dayjs() }}
      >
        <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
        <Card title="Sarana Transportasi Kedatangan">
          <Form.Item
            label="Transportasi yang Digunakan"
            name="transportation"
            rules={[{ required: true, message: 'Pilih sarana transportasi' }]}
          >
            <Radio.Group className="flex flex-col gap-2">
              {Object.keys(TRANSPORTATION_SNOMED_MAP).map((key) => (
                <Radio key={key} value={key}>
                  {key}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </Card>
        <Card title="Surat Pengantar Rujukan">
          <Form.Item
            label="Apakah pasien membawa surat pengantar rujukan?"
            name="referral_letter"
            rules={[{ required: true, message: 'Pilih salah satu' }]}
          >
            <Radio.Group>
              <Radio value="ya">
                <span className="font-medium">Ya</span>
                <span className="text-gray-400 ml-2 text-sm">
                  (Pasien datang dengan surat rujukan)
                </span>
              </Radio>
              <Radio value="tidak">
                <span className="font-medium">Tidak</span>
                <span className="text-gray-400 ml-2 text-sm">(Pasien tanpa surat rujukan)</span>
              </Radio>
            </Radio.Group>
          </Form.Item>
        </Card>
        <Card title="Kondisi Pasien Saat Tiba (Level Triase)">
          <Form.Item
            label="Tingkat Kegawatan (CTAS)"
            name="patient_condition"
            rules={[{ required: true, message: 'Pilih kondisi pasien' }]}
          >
            <Select placeholder="Pilih kondisi/kegawatan pasien saat tiba">
              {Object.entries(CTAS_LEVEL_MAP).map(([key, info]) => (
                <Select.Option key={key} value={key}>
                  <Tag color={CTAS_COLORS[key]} className="mr-1">
                    Level {key}
                  </Tag>
                  {info.label.split('-')[1].trim()}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {selectedConditionInfo && (
            <div
              className="mt-2 p-4 rounded-lg border flex items-center gap-4"
              style={{
                borderColor:
                  CTAS_COLORS[selectedPatientCondition] === 'gold'
                    ? '#faad14'
                    : CTAS_COLORS[selectedPatientCondition],
                backgroundColor:
                  CTAS_COLORS[selectedPatientCondition] === 'red'
                    ? '#fff1f0'
                    : CTAS_COLORS[selectedPatientCondition] === 'orange'
                      ? '#fff7e6'
                      : CTAS_COLORS[selectedPatientCondition] === 'gold'
                        ? '#fffbe6'
                        : CTAS_COLORS[selectedPatientCondition] === 'green'
                          ? '#f6ffed'
                          : '#e6f4ff'
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{
                  backgroundColor:
                    CTAS_COLORS[selectedPatientCondition] === 'gold'
                      ? '#faad14'
                      : CTAS_COLORS[selectedPatientCondition]
                }}
              >
                {selectedConditionInfo.display}
              </div>
              <div>
                <div className="font-semibold">{selectedConditionInfo.label}</div>
                <div className="text-sm text-gray-500">Canadian Triage and Acuity Scale (CTAS)</div>
              </div>
            </div>
          )}
        </Card>
        <Form.Item>
          <div className="flex justify-end gap-2">
            <Button size="large" onClick={() => form.resetFields()}>
              Reset
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={bulkCreateObservation.isPending}
              onClick={() => form.submit()}
            >
              Simpan Data Triase
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}
