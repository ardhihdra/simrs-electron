import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, InputNumber, Radio, Select } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { PatientData } from '@renderer/types/doctor.types'
import {
  useBulkCreateObservation,
  useQueryObservationByEncounter
} from '@renderer/hooks/query/use-observation'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { PAIN_COMPONENTS_MAP, PAIN_SCALE_TYPE_MAP } from '@renderer/config/maps/observation-maps'
import {
  createObservationBatch,
  OBSERVATION_CATEGORIES,
  OBSERVATION_SYSTEMS
} from '@renderer/utils/builders/observation-builder'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'

interface PainAssessmentFormProps {
  encounterId: string
  patientData: PatientData
}

export const PainAssessmentForm = ({ encounterId, patientData }: PainAssessmentFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const { data: response, refetch } = useQueryObservationByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])
  const bulkCreateObservation = useBulkCreateObservation()

  const isPain = Form.useWatch('is_pain', form)
  const selectedScaleType = Form.useWatch('scale_type', form)

  useEffect(() => {
    const observations = response?.result
    if (!response?.success || !Array.isArray(observations) || observations.length === 0) return

    const scaleCodes = Object.values(PAIN_SCALE_TYPE_MAP).map((c) => c.code)
    const painMainCode = PAIN_COMPONENTS_MAP.PAIN_MAIN.code

    const painObs = observations.filter(
      (obs: any) =>
        obs.category === OBSERVATION_CATEGORIES.SURVEY &&
        (scaleCodes.includes(obs.code) || obs.code === painMainCode)
    )

    if (painObs.length === 0) {
      form.setFieldValue('is_pain', false)
      return
    }

    const sorted = [...painObs].sort(
      (a: any, b: any) =>
        dayjs(b.effectiveDateTime || b.issued || b.createdAt).valueOf() -
        dayjs(a.effectiveDateTime || a.issued || a.createdAt).valueOf()
    )

    const latest = sorted[0] as any
    const fieldsToSet: Record<string, any> = {
      is_pain: true,
      assessment_date: dayjs(latest.effectiveDateTime)
    }

    if (latest.performers?.[0]?.practitionerId) {
      fieldsToSet.performerId = Number(latest.performers[0].practitionerId)
    }

    const scaleEntry = Object.entries(PAIN_SCALE_TYPE_MAP).find(([_, v]) => v.code === latest.code)

    if (scaleEntry) {
      fieldsToSet.scale_type = scaleEntry[0]
      fieldsToSet.pain_score = latest.valueInteger
    } else if (latest.code === painMainCode) {
      fieldsToSet.scale_type = 'NIPS'
      if (latest.bodySite?.text) {
        fieldsToSet.pain_location = latest.bodySite.text
      }
      if (latest.hasMember && latest.hasMember.length > 0 && observations) {
        const refId = latest.hasMember[0].reference?.split('/')?.[1]
        const scoreObs = observations.find((o) => o.id === refId)
        if (scoreObs) {
          fieldsToSet.pain_score = scoreObs.valueInteger
        }
      }

      if (Array.isArray(latest.components)) {
        latest.components.forEach((comp: any) => {
          if (comp.code === PAIN_COMPONENTS_MAP.CAUSE.code) {
            fieldsToSet.pain_cause = comp.valueString
          } else if (comp.code === PAIN_COMPONENTS_MAP.DURATION.code) {
            fieldsToSet.pain_duration = comp.valueQuantity?.value
          } else if (comp.code === PAIN_COMPONENTS_MAP.FREQUENCY.code) {
            fieldsToSet.pain_frequency = comp.valueString
          }
        })
      }
    }

    form.setFieldsValue(fieldsToSet)
  }, [response, form])

  const handleFinish = async (values: any) => {
    if (!encounterId) {
      message.error('Data kunjungan tidak ditemukan')
      return
    }

    const assessmentDate = values.assessment_date || dayjs()
    const obsToCreate: any[] = []

    if (values.is_pain) {
      if (!values.scale_type) {
        message.warning('Pilih metode skala nyeri')
        return
      }

      const scaleInfo = PAIN_SCALE_TYPE_MAP[values.scale_type]
      if (!scaleInfo) return

      if (values.scale_type === 'NRS' || values.scale_type === 'WONG_BAKER') {
        // Simple Single Observation for NRS and BPS
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.SURVEY,
          code: scaleInfo.code,
          display: scaleInfo.display,
          system: scaleInfo.system,
          codeCoding: [
            {
              system: scaleInfo.system,
              code: scaleInfo.code,
              display: scaleInfo.display
            }
          ],
          valueInteger: Number(values.pain_score)
        })
      } else if (values.scale_type === 'NIPS') {
        const scoreRefId = uuidv4()

        obsToCreate.push({
          id: scoreRefId,
          code: PAIN_SCALE_TYPE_MAP.NRS.code,
          display: PAIN_SCALE_TYPE_MAP.NRS.display,
          system: PAIN_SCALE_TYPE_MAP.NRS.system,
          codeCoding: [
            {
              system: PAIN_SCALE_TYPE_MAP.NRS.system,
              code: PAIN_SCALE_TYPE_MAP.NRS.code,
              display: PAIN_SCALE_TYPE_MAP.NRS.display
            }
          ],
          valueInteger: Number(values.pain_score)
        })

        const components: any[] = []

        if (values.pain_cause) {
          components.push({
            code: PAIN_COMPONENTS_MAP.CAUSE.code,
            display: PAIN_COMPONENTS_MAP.CAUSE.display,
            system: PAIN_COMPONENTS_MAP.CAUSE.system,
            valueString: values.pain_cause
          })
        }

        if (values.pain_duration) {
          components.push({
            code: PAIN_COMPONENTS_MAP.DURATION.code,
            display: PAIN_COMPONENTS_MAP.DURATION.display,
            system: PAIN_COMPONENTS_MAP.DURATION.system,
            valueQuantity: {
              value: Number(values.pain_duration),
              unit: 'h',
              system: 'http://unitsofmeasure.org',
              code: 'h'
            }
          })
        }

        if (values.pain_frequency) {
          components.push({
            code: PAIN_COMPONENTS_MAP.FREQUENCY.code,
            display: PAIN_COMPONENTS_MAP.FREQUENCY.display,
            system: PAIN_COMPONENTS_MAP.FREQUENCY.system,
            valueString: values.pain_frequency
          })
        }

        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.SURVEY,
          code: PAIN_COMPONENTS_MAP.PAIN_MAIN.code,
          display: PAIN_COMPONENTS_MAP.PAIN_MAIN.display,
          system: PAIN_COMPONENTS_MAP.PAIN_MAIN.system,
          codeCoding: [
            {
              system: PAIN_COMPONENTS_MAP.PAIN_MAIN.system,
              code: PAIN_COMPONENTS_MAP.PAIN_MAIN.code,
              display: PAIN_COMPONENTS_MAP.PAIN_MAIN.display
            }
          ],
          valueBoolean: true,
          ...(values.pain_location && {
            bodySite: {
              coding: [
                {
                  system: OBSERVATION_SYSTEMS.SNOMED,
                  code: '27033000', // Example mapping: lower abdomen
                  display: 'Lower abdomen structure'
                }
              ],
              text: values.pain_location
            }
          }),
          hasMember: [{ reference: `Observation/${scoreRefId}` }],
          ...(components.length > 0 && { components })
        })
      }
    } else {
      // User explicitly specified "No Pain"
      obsToCreate.push({
        category: OBSERVATION_CATEGORIES.SURVEY,
        code: PAIN_COMPONENTS_MAP.PAIN_MAIN.code,
        display: PAIN_COMPONENTS_MAP.PAIN_MAIN.display,
        system: PAIN_COMPONENTS_MAP.PAIN_MAIN.system,
        valueBoolean: false
      })
    }

    try {
      if (obsToCreate.length === 0) {
        message.warning('Tidak ada data asesmen nyeri yang diisi')
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

      message.success('Asesmen Nyeri berhasil disimpan')
      refetch()
    } catch (error: any) {
      console.error('Error saving pain assessment data:', error)
      message.error(error?.message || 'Gagal menyimpan asesmen nyeri')
    }
  }

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

        <Card title="Asesmen Nyeri">
          <Form.Item
            label="Apakah pasien mengeluhkan nyeri?"
            name="is_pain"
            rules={[{ required: true, message: 'Pilih salah satu' }]}
          >
            <Radio.Group>
              <Radio value={true}>Ya</Radio>
              <Radio value={false}>Tidak</Radio>
            </Radio.Group>
          </Form.Item>

          {isPain === true && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4 space-y-4">
              <Form.Item
                label="Metode / Skala Nyeri"
                name="scale_type"
                rules={[{ required: true, message: 'Pilih metode pengukuran' }]}
              >
                <Select placeholder="Pilih metode pengukuran skala nyeri">
                  <Select.Option value="NRS">Numeric Rating Scale (NRS) — Dewasa</Select.Option>
                  <Select.Option value="WONG_BAKER">
                    Wong-Baker FACES Pain Scale (BPS) — Anak
                  </Select.Option>
                  <Select.Option value="NIPS">
                    Neonatal Infant Pain Scale (NIPS) — Bayi/Neonatus
                  </Select.Option>
                </Select>
              </Form.Item>

              {/* Tampilkan input spesifik jika metode sudah dipilih */}
              {selectedScaleType && (
                <>
                  <Form.Item
                    label="Skor Nyeri (0 - 10)"
                    name="pain_score"
                    rules={[{ required: true, message: 'Masukkan skor nyeri' }]}
                  >
                    <InputNumber min={0} max={10} className="w-full max-w-xs" />
                  </Form.Item>

                  {/* Field tambahan Komposit (misal wajib untuk NIPS berdasarkan contoh JSON user) */}
                  {selectedScaleType === 'NIPS' && (
                    <div className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item label="Lokasi Nyeri (Body Site Text)" name="pain_location">
                        <Input placeholder="Contoh: Lokasi utama nyeri di perut bagian bawah" />
                      </Form.Item>

                      <Form.Item label="Penyebab Nyeri" name="pain_cause">
                        <Input placeholder="Contoh: Terjatuh dari tangga" />
                      </Form.Item>

                      <Form.Item label="Durasi Nyeri (jam)" name="pain_duration">
                        <InputNumber min={0} className="w-full" addonAfter="Jam" />
                      </Form.Item>

                      <Form.Item label="Frekuensi & Karakteristik" name="pain_frequency">
                        <Input placeholder="Contoh: Nyeri memberat sejak 2 jam lalu" />
                      </Form.Item>
                    </div>
                  )}
                </>
              )}
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
              Simpan Asesmen Nyeri
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}
