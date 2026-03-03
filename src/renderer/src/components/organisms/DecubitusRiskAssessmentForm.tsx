import { SaveOutlined, CarOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, InputNumber, Radio, Space } from 'antd'
import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid'
import { useEffect } from 'react'
import {
  useBulkCreateObservation,
  useObservationByEncounter
} from '../../hooks/query/use-observation'
import {
  createObservationBatch,
  OBSERVATION_CATEGORIES,
  OBSERVATION_SYSTEMS
} from '../../utils/builders/observation-builder'
import { AssessmentHeader } from './Assessment/AssesmentHeader/AssessmentHeader'
import { usePerformers } from '../../hooks/query/use-performers'
import type { PatientData } from '@renderer/types/doctor.types'

interface DecubitusRiskAssessmentFormProps {
  encounterId: string
  patientData: PatientData
}

export const DecubitusRiskAssessmentForm = ({
  encounterId,
  patientData
}: DecubitusRiskAssessmentFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const { data: response, refetch } = useObservationByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])
  const bulkCreateObservation = useBulkCreateObservation()

  // Watch for risk status to conditionally render the Norton scale
  const isAtRisk = Form.useWatch('is_at_risk', form)

  // Autofill logic
  useEffect(() => {
    const observations = response?.result
    if (!response?.success || !Array.isArray(observations) || observations.length === 0) return

    // Find the main Decubitus Risk observation
    const decubitusCode = '285304000' // At risk of pressure injury (SNOMED-CT)
    const nortonCode = '75249-3' // Norton scale total score (LOINC)

    const riskObs = observations.filter(
      (obs: any) => obs.category === OBSERVATION_CATEGORIES.EXAM && obs.code === decubitusCode
    )

    if (riskObs.length === 0) {
      form.setFieldsValue({
        assessment_date: dayjs()
      })
      return
    }

    const sorted = [...riskObs].sort(
      (a: any, b: any) =>
        dayjs(b.effectiveDateTime || b.issued || b.createdAt).valueOf() -
        dayjs(a.effectiveDateTime || a.issued || a.createdAt).valueOf()
    )

    const latest = sorted[0] as any
    const fieldsToSet: Record<string, any> = {
      is_at_risk: latest.valueBoolean === true,
      assessment_date: dayjs(latest.effectiveDateTime)
    }

    if (latest.performers?.[0]?.practitionerId) {
      fieldsToSet.performerId = Number(latest.performers[0].practitionerId)
    }

    if (latest.valueBoolean === true && latest.hasMember && latest.hasMember.length > 0) {
      const refId = latest.hasMember[0].reference?.split('/')?.[1]
      const nortonObs = observations.find((o) => o.id === refId || o.code === nortonCode)
      if (nortonObs) {
        fieldsToSet.norton_score = nortonObs.valueQuantity?.value || nortonObs.valueInteger
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

    if (values.is_at_risk === true) {
      if (!values.norton_score && values.norton_score !== 0) {
        message.warning('Masukkan skor Skala Norton')
        return
      }

      const nortonId = uuidv4()

      // 1. Norton Scale Observation
      obsToCreate.push({
        id: nortonId,
        category: OBSERVATION_CATEGORIES.SURVEY,
        code: '75249-3',
        display: 'Norton scale total score',
        system: OBSERVATION_SYSTEMS.LOINC,
        codeCoding: [
          {
            system: OBSERVATION_SYSTEMS.LOINC,
            code: '75249-3',
            display: 'Norton scale total score'
          }
        ],
        valueQuantity: {
          value: Number(values.norton_score),
          unit: '{score}',
          system: 'http://unitsofmeasure.org',
          code: '{score}'
        }
      })

      // 2. Decubitus Risk Observation (Parent)
      obsToCreate.push({
        category: OBSERVATION_CATEGORIES.EXAM,
        code: '285304000',
        display: 'At risk of pressure injury',
        system: OBSERVATION_SYSTEMS.SNOMED,
        codeCoding: [
          {
            system: OBSERVATION_SYSTEMS.SNOMED,
            code: '285304000',
            display: 'At risk of pressure injury'
          }
        ],
        valueBoolean: true,
        hasMember: [{ reference: `Observation/${nortonId}` }]
      })
    } else if (values.is_at_risk === false) {
      // Not at risk
      obsToCreate.push({
        category: OBSERVATION_CATEGORIES.EXAM,
        code: '285304000',
        display: 'At risk of pressure injury',
        system: OBSERVATION_SYSTEMS.SNOMED,
        codeCoding: [
          {
            system: OBSERVATION_SYSTEMS.SNOMED,
            code: '285304000',
            display: 'At risk of pressure injury'
          }
        ],
        valueBoolean: false
      })
    } else {
      message.warning('Pilih salah satu kondisi risiko dekubitus')
      return
    }

    try {
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

      message.success('Skrining Risiko Dekubitus berhasil disimpan')
      refetch()
    } catch (error: any) {
      console.error('Error saving decubitus assessment:', error)
      message.error(error?.message || 'Gagal menyimpan skrining risiko dekubitus')
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
        <Card title="Risiko Ulkus Dekubitus">
          <Form.Item
            label="Apakah pasien berisiko mengalami luka dekubitus (pressure injury)?"
            name="is_at_risk"
            rules={[{ required: true, message: 'Pilih salah satu' }]}
          >
            <Radio.Group>
              <Radio value={true}>Ya</Radio>
              <Radio value={false}>Tidak</Radio>
            </Radio.Group>
          </Form.Item>

          {isAtRisk === true && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4 space-y-4">
              <div className="text-gray-600 mb-4 text-sm">
                Pasien dinyatakan berisiko dekubitus. Silakan lakukan evaluasi lanjutan menggunakan
                parameter <strong>Skala Norton</strong>.
              </div>
              <Form.Item
                label="Skor Total Skala Norton (Norton scale total score)"
                name="norton_score"
                rules={[{ required: true, message: 'Masukkan skor Norton' }]}
                extra="Skor lebih rendah menandakan tingkat risiko luka dekubitus yang lebih tinggi (Skor maksimum 20)."
              >
                <InputNumber min={5} max={20} className="w-full max-w-xs" />
              </Form.Item>
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
              Simpan Skrining
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}
