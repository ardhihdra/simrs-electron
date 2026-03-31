import { App, Button, Card, Form } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { FunctionalStatusSection } from '../FunctionalStatus/FunctionalStatusSection'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import {
  useBulkCreateObservation,
  useQueryObservationByEncounter
} from '@renderer/hooks/query/use-observation'
import {
  createObservationBatch,
  OBSERVATION_CATEGORIES
} from '@renderer/utils/builders/observation-builder'
import {
  formatFunctionalStatus,
  formatPsychosocialHistory
} from '@renderer/utils/formatters/observation-formatter'
import { PSYCHOLOGICAL_STATUS_SNOMED_MAP } from '@renderer/config/maps/observation-maps'
import { PsychosocialSection } from '../PhysicalSection/PsychosocialSection'
import dayjs from 'dayjs'

interface FunctionalAssessmentFormProps {
  encounterId: string
  patientData: { patient: { id: string; name?: string } }
  hideHeader?: boolean
  globalPerformerId?: string | number
}

export const FunctionalAssessmentForm = ({
  encounterId,
  patientData,
  hideHeader = false,
  globalPerformerId
}: FunctionalAssessmentFormProps) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'doctor',
    'nurse'
  ])

  const { data: existingData } = useQueryObservationByEncounter(encounterId)
  const bulkCreateObservation = useBulkCreateObservation()

  useEffect(() => {
    if (!existingData?.result) return
    const result = existingData.result
    const formattedData = formatFunctionalStatus(
      result as Parameters<typeof formatFunctionalStatus>[0]
    )
    const psychoData = formatPsychosocialHistory(
      result as Parameters<typeof formatPsychosocialHistory>[0]
    )

    form.setFieldsValue({
      ...formattedData,
      psychological_status: Array.isArray(psychoData.psychological_status)
        ? psychoData.psychological_status
        : psychoData.psychological_status?.split(', '),
      family_relation_note: psychoData.family_relation_note,
      living_with_note: psychoData.living_with_note,
      religion: psychoData.religion,
      culture_values: psychoData.culture_values,
      daily_language: psychoData.daily_language
    })
  }, [existingData, form])

  const handleFinish = (values: Record<string, any>) => {
    const obsToCreate = [
      {
        category: OBSERVATION_CATEGORIES.SURVEY,
        code: 'functional-status-aids',
        display: 'Alat Bantu',
        valueString: values.aids_check
      },
      {
        category: OBSERVATION_CATEGORIES.SURVEY,
        code: 'functional-status-disability',
        display: 'Cacat Tubuh',
        valueString: values.disability_check
      },
      {
        category: OBSERVATION_CATEGORIES.SURVEY,
        code: 'functional-status-adl',
        display: 'Aktivitas Sehari-hari',
        valueString: values.adl_check
      }
    ].filter((obs) => obs.valueString) as any[]

    if (values.psychological_status && values.psychological_status.length > 0) {
      const statuses = Array.isArray(values.psychological_status)
        ? values.psychological_status
        : [values.psychological_status]

      const codings = statuses
        .map((status: string) => {
          const snomedMap = PSYCHOLOGICAL_STATUS_SNOMED_MAP[status]
          if (snomedMap) {
            return {
              system: 'http://snomed.info/sct',
              code: snomedMap.code,
              display: snomedMap.display
            }
          }
          return null
        })
        .filter(Boolean)

      obsToCreate.push({
        category: OBSERVATION_CATEGORIES.SURVEY,
        code: '8693-4',
        display: 'Mental Status',
        valueString: statuses.join(', '),
        valueCodeableConcept:
          codings.length > 0
            ? {
                coding: codings
              }
            : undefined
      } as any)
    }

    if (values.family_relation_note) {
      obsToCreate.push({
        category: 'social-history',
        code: 'family-relation-note',
        display: 'Hubungan Keluarga',
        valueString: values.family_relation_note
      } as any)
    }
    if (values.living_with_note) {
      obsToCreate.push({
        category: 'social-history',
        code: 'living-with-note',
        display: 'Tinggal Bersama',
        valueString: values.living_with_note
      } as any)
    }
    if (values.religion) {
      obsToCreate.push({
        category: 'social-history',
        code: 'patient-religion',
        display: 'Agama',
        valueString: values.religion
      } as any)
    }
    if (values.culture_values) {
      obsToCreate.push({
        category: 'social-history',
        code: 'culture-values',
        display: 'Nilai Budaya/Kepercayaan',
        valueString: values.culture_values
      } as any)
    }
    if (values.daily_language) {
      obsToCreate.push({
        category: 'social-history',
        code: 'daily-language',
        display: 'Bahasa Sehari-hari',
        valueString: values.daily_language
      } as any)
    }

    if (obsToCreate.length === 0) {
      message.info('Tidak ada data fungsional maupun psikososial yang dilengkapi')
      return
    }

    const observations = createObservationBatch(obsToCreate as any)
    let performerId = values.performerId
    if (hideHeader && globalPerformerId) {
      performerId = globalPerformerId
    }

    if (!performerId) {
      message.error('Mohon pilih pemeriksa atau pastikan dokter DPJP tersedia')
      return
    }

    const performerName =
      performersData?.find((p: any) => p.id === Number(performerId))?.name || 'Unknown'

    bulkCreateObservation.mutate(
      {
        encounterId,
        patientId: patientData.patient.id,
        performerId: String(performerId),
        performerName,
        observations
      },
      {
        onSuccess: () => {
          message.success('Data pemeriksaan fungsional berhasil disimpan')
        },
        onError: (err: Error) => {
          message.error(`Gagal menyimpan: ${err.message}`)
        }
      }
    )
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        assessment_date: dayjs()
      }}
      onFinishFailed={() => message.error('Mohon lengkapi semua field yang wajib diisi')}
      className="flex! flex-col! gap-4!"
    >
      {!hideHeader && (
        <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
      )}
      <FunctionalStatusSection />
      <PsychosocialSection />
      <Form.Item>
        <div className="flex justify-end">
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={bulkCreateObservation.isPending}
            onClick={() => form.submit()}
          >
            Simpan Pemeriksaan Fungsional
          </Button>
        </div>
      </Form.Item>
    </Form>
  )
}
