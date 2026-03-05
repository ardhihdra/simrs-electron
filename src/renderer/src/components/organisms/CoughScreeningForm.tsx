import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Radio } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { AssessmentHeader } from './Assessment/AssesmentHeader/AssessmentHeader'
import { usePerformers } from '../../hooks/query/use-performers'
import type { PatientData } from '@renderer/types/doctor.types'
import {
  useCreateQuestionnaireResponse,
  useQuestionnaireResponseByEncounter
} from '../../hooks/query/use-questionnaire-response'
import {
  QuestionnaireResponseStatus,
  QuestionnaireResponseItem
} from '../../types/questionnaire.types'

interface CoughScreeningFormProps {
  encounterId: string
  patientData: PatientData
}

export const CoughScreeningForm = ({ encounterId, patientData }: CoughScreeningFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const { data: response, refetch } = useQuestionnaireResponseByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])
  const createQuestionnaire = useCreateQuestionnaireResponse()

  useEffect(() => {
    if (response?.success && response.result) {
      const qResp = (response.result as any[]).find(
        (qr) => qr.questionnaire === 'https://fhir.kemkes.go.id/Questionnaire/Q0008'
      )

      if (qResp && qResp.items) {
        const fieldsToSet: any = {
          assessment_date: qResp.authored ? dayjs(qResp.authored) : dayjs()
        }

        if (qResp.authorId) {
          fieldsToSet.performerId = Number(qResp.authorId)
        }

        qResp.items.forEach((item: any) => {
          if (item.answer && item.answer.length > 0) {
            const ans = item.answer[0]
            if (item.linkId === '1') fieldsToSet.q1 = ans.valueBoolean
            if (item.linkId === '2') fieldsToSet.q2 = ans.valueBoolean
            if (item.linkId === '3') fieldsToSet.q3 = ans.valueBoolean
            if (item.linkId === '4') fieldsToSet.q4 = ans.valueBoolean
            if (item.linkId === '5') fieldsToSet.q5 = ans.valueBoolean
          }
        })
        form.setFieldsValue(fieldsToSet)
      } else {
        form.setFieldsValue({ assessment_date: dayjs() })
      }
    }
  }, [response, form])

  const handleFinish = async (values: any) => {
    if (!encounterId) {
      message.error('Data kunjungan tidak ditemukan')
      return
    }

    const items: QuestionnaireResponseItem[] = [
      {
        linkId: '1',
        text: 'Apakah memiliki riwayat demam?',
        answer: [{ valueBoolean: values.q1 }]
      },
      {
        linkId: '2',
        text: 'Apakah berkeringat pada malam hari walaupun tanpa aktivitas?',
        answer: [{ valueBoolean: values.q2 }]
      },
      {
        linkId: '3',
        text: 'Apakah memiliki riwayat berpergian dari daerah wabah?',
        answer: [{ valueBoolean: values.q3 }]
      },
      {
        linkId: '4',
        text: 'Apakah memiliki riwayat pemakaian obat jangka panjang?',
        answer: [{ valueBoolean: values.q4 }]
      },
      {
        linkId: '5',
        text: 'Apakah memiliki riwayat BB turun tanpa sebab yang diketahui?',
        answer: [{ valueBoolean: values.q5 }]
      }
    ]

    // Construct sub-items if "Yes" to q1 or q4 (We use mock references as placeholders if they don't exist yet)
    // Specifically:
    // Q1 -> Condition_RiwayatPenyakitPribadiSekarang
    // Q4 -> MedicationStatement_id
    if (values.q1 === true) {
      items[0].answer![0].item = [
        {
          linkId: '1.1',
          text: 'Jika ya, Riwayat Demam',
          answer: [
            {
              valueReference: {
                reference: 'Condition/dummy-condition-id-temp' // Placeholder
              }
            }
          ]
        } as any
      ]
    }

    if (values.q4 === true) {
      items[3].answer![0].item = [
        {
          linkId: '4.1',
          text: 'Jika ya, Riwayat Pengobatan',
          answer: [
            {
              valueReference: {
                reference: 'MedicationStatement/dummy-medication-id-temp' // Placeholder
              }
            }
          ]
        } as any
      ]
    }

    const payload = {
      encounterId,
      subjectId: String(patientData.patient.id),
      questionnaire: 'https://fhir.kemkes.go.id/Questionnaire/Q0008',
      status: QuestionnaireResponseStatus.COMPLETED,
      authored: values.assessment_date
        ? values.assessment_date.toISOString()
        : dayjs().toISOString(),
      authorId: String(values.performerId),
      sourceId: String(patientData.patient.id),
      items
    }

    try {
      await createQuestionnaire.mutateAsync(payload as any)
      message.success('Skrining Batuk berhasil disimpan')
      refetch()
    } catch (error: any) {
      console.error('Error saving cough screening:', error)
      message.error(error?.message || 'Gagal menyimpan skrining batuk')
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

        <Card title="Kuesioner Skrining Batuk (TBC)">
          <Form.Item
            label="1. Apakah memiliki riwayat demam?"
            name="q1"
            rules={[{ required: true, message: 'Pilih salah satu' }]}
          >
            <Radio.Group>
              <Radio value={true}>Ya</Radio>
              <Radio value={false}>Tidak</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="2. Apakah berkeringat pada malam hari walaupun tanpa aktivitas?"
            name="q2"
            rules={[{ required: true, message: 'Pilih salah satu' }]}
          >
            <Radio.Group>
              <Radio value={true}>Ya</Radio>
              <Radio value={false}>Tidak</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="3. Apakah memiliki riwayat berpergian dari daerah wabah?"
            name="q3"
            rules={[{ required: true, message: 'Pilih salah satu' }]}
          >
            <Radio.Group>
              <Radio value={true}>Ya</Radio>
              <Radio value={false}>Tidak</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="4. Apakah memiliki riwayat pemakaian obat jangka panjang?"
            name="q4"
            rules={[{ required: true, message: 'Pilih salah satu' }]}
          >
            <Radio.Group>
              <Radio value={true}>Ya</Radio>
              <Radio value={false}>Tidak</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="5. Apakah memiliki riwayat BB turun tanpa sebab yang diketahui?"
            name="q5"
            rules={[{ required: true, message: 'Pilih salah satu' }]}
          >
            <Radio.Group>
              <Radio value={true}>Ya</Radio>
              <Radio value={false}>Tidak</Radio>
            </Radio.Group>
          </Form.Item>
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
              loading={createQuestionnaire.isPending}
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
