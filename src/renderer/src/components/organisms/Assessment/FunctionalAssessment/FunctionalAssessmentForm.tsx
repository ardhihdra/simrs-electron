import { App, Button, Card, Form } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { FunctionalStatusSection } from '../FunctionalStatus/FunctionalStatusSection'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import {
  useCreateQuestionnaireResponse,
  useQuestionnaireResponseByEncounter
} from '@renderer/hooks/query/use-questionnaire-response'
import {
  QuestionnaireResponseStatus,
  type QuestionnaireResponseItem
} from '@renderer/types/questionnaire.types'

interface FunctionalAssessmentFormProps {
  encounterId: string
  patientData: { patient: { id: string; name?: string } }
}

export const FunctionalAssessmentForm = ({
  encounterId,
  patientData
}: FunctionalAssessmentFormProps) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])

  const { data: existingData } = useQuestionnaireResponseByEncounter(encounterId)

  const createQR = useCreateQuestionnaireResponse()

  useEffect(() => {
    if (!existingData?.result) return
    const records: { questionnaire?: string; items?: QuestionnaireResponseItem[] }[] =
      Array.isArray(existingData.result) ? existingData.result : []

    const functionalRecord = records.find((r) => r.questionnaire === 'Status Fungsional')
    if (!functionalRecord?.items) return

    const values: Record<string, string | undefined> = {}
    functionalRecord.items.forEach((item) => {
      values[item.linkId] = item.valueString ?? item.valueCoding?.code
    })
    form.setFieldsValue(values)
  }, [existingData, form])

  const handleFinish = (values: Record<string, string>) => {
    const items: QuestionnaireResponseItem[] = [
      {
        linkId: 'aids_check',
        text: 'Alat Bantu',
        valueString: values.aids_check
      },
      {
        linkId: 'disability_check',
        text: 'Cacat Tubuh',
        valueString: values.disability_check
      },
      {
        linkId: 'adl_check',
        text: 'Aktivitas Sehari-hari',
        valueString: values.adl_check
      }
    ]

    createQR.mutate(
      {
        encounterId,
        subjectId: patientData.patient.id,
        authorId: String(values.performerId),
        questionnaire: 'Status Fungsional',
        status: QuestionnaireResponseStatus.COMPLETED,
        items
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
      onFinishFailed={() => message.error('Mohon lengkapi semua field yang wajib diisi')}
    >
      <div className="flex flex-col gap-4">
        <Card title="Pemeriksaan Fungsional (Modul 05 SatuSehat)">
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
        </Card>

        <FunctionalStatusSection />

        <Form.Item>
          <div className="flex justify-end">
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={createQR.isPending}
              onClick={() => form.submit()}
            >
              Simpan Pemeriksaan Fungsional
            </Button>
          </div>
        </Form.Item>
      </div>
    </Form>
  )
}
