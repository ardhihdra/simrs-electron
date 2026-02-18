import { SaveOutlined, HistoryOutlined } from '@ant-design/icons'
import { Button, Card, Form, Select, Table, notification, Modal } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import {
  useBulkCreateObservation,
  useObservationByEncounter
} from '../../hooks/query/use-observation'
import { formatObservationSummary } from '../../utils/observation-helpers'
import { createObservationBatch, OBSERVATION_CATEGORIES } from '../../utils/observation-builder'
import { AssessmentHeader } from './Assessment/AssessmentHeader'
import { VitalSignsSection } from './Assessment/VitalSignsSection'
import { usePerformers } from '@renderer/hooks/query/use-performers'

interface VitalSignsMonitoringFormProps {
  encounterId: string
  patientData: any
}

export const VitalSignsMonitoringForm = ({
  encounterId,
  patientData
}: VitalSignsMonitoringFormProps) => {
  const [form] = Form.useForm()
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const bulkCreateObservation = useBulkCreateObservation()

  const { data: response, isLoading, refetch } = useObservationByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])

  const handleFinish = async (values: any) => {
    try {
      const observations = createObservationBatch(
        [
          {
            category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
            code: '85354-9',
            display: 'Blood Pressure',
            valueQuantity: {
              value: values.vitalSigns.systolicBloodPressure,
              unit: 'mmHg'
            },
            components: [
              {
                code: '8480-6',
                display: 'Systolic',
                valueQuantity: { value: values.vitalSigns.systolicBloodPressure, unit: 'mmHg' }
              },
              {
                code: '8462-4',
                display: 'Diastolic',
                valueQuantity: { value: values.vitalSigns.diastolicBloodPressure, unit: 'mmHg' }
              }
            ]
          },
          {
            category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
            code: '8867-4',
            display: 'Heart rate',
            valueQuantity: { value: values.vitalSigns.pulseRate, unit: 'bpm' }
          },
          {
            category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
            code: '9279-1',
            display: 'Respiratory rate',
            valueQuantity: { value: values.vitalSigns.respiratoryRate, unit: '/min' }
          },
          {
            category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
            code: '8310-5',
            display: 'Body temperature',
            valueQuantity: { value: values.vitalSigns.temperature, unit: '°C' }
          },
          {
            category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
            code: '2708-6',
            display: 'Oxygen saturation',
            valueQuantity: { value: values.vitalSigns.oxygenSaturation, unit: '%' }
          },
          {
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'consciousness',
            display: 'Consciousness',
            valueString: values.consciousness
          }
        ],
        values.assessment_date
      )

      const performerName = performersData?.find((p: any) => p.id === values.performerId)?.name

      await bulkCreateObservation.mutateAsync({
        encounterId,
        patientId: patientData?.patient?.id || patientData?.id,
        observations,
        performerId: String(values.performerId),
        performerName
      })

      notification.success({
        message: 'Berhasil',
        description: 'Data monitoring TTV berhasil disimpan'
      })

      form.resetFields(['vitalSigns', 'consciousness'])
      form.setFieldValue('assessment_date', dayjs())
      refetch()
    } catch (error: any) {
      console.error(error)
      notification.error({
        message: 'Gagal Menyimpan',
        description: error.message || 'Terjadi kesalahan saat menyimpan data'
      })
    }
  }

  const historyData = response?.result?.all || []

  const groupedHistory = historyData
    .filter((obs: any) => {
      const categoryCode = obs.category || obs.categories?.[0]?.code
      return (
        categoryCode === OBSERVATION_CATEGORIES.VITAL_SIGNS ||
        categoryCode === OBSERVATION_CATEGORIES.EXAM
      )
    })
    .reduce((acc: any[], obs: any) => {
      const date = dayjs(obs.issued || obs.effectiveDateTime).format('YYYY-MM-DD HH:mm')
      let existing = acc.find((item) => item.date === date)
      if (!existing) {
        existing = {
          key: date,
          date,
          performer: obs.performers?.[0]?.display || 'Unknown',
          items: []
        }
        acc.push(existing)
      }
      existing.items.push(obs)
      return acc
    }, [])
    .map((group) => {
      const summary = formatObservationSummary(group.items, [])
      return {
        ...group,
        vitals: summary.vitalSigns,
        consciousness: summary.physicalExamination?.consciousness,
        bmiCategory: summary.vitalSigns.bmiCategory
      }
    })
    .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())

  const columns = [
    { title: 'Waktu', dataIndex: 'date', key: 'date', width: 140 },
    { title: 'Pemeriksa', dataIndex: 'performer', key: 'performer', width: 150 },
    { title: 'Kesadaran', dataIndex: 'consciousness', key: 'consciousness', width: 120 },
    {
      title: 'TD (mmHg)',
      key: 'td',
      render: (_, record) =>
        record.vitals.systolicBloodPressure
          ? `${record.vitals.systolicBloodPressure}/${record.vitals.diastolicBloodPressure}`
          : '-'
    },
    { title: 'Nadi', render: (_, record) => record.vitals.pulseRate || '-' },
    { title: 'RR', render: (_, record) => record.vitals.respiratoryRate || '-' },
    {
      title: 'Suhu',
      render: (_, record) => (record.vitals.temperature ? `${record.vitals.temperature}°C` : '-')
    },
    {
      title: 'SpO2',
      render: (_, record) =>
        record.vitals.oxygenSaturation ? `${record.vitals.oxygenSaturation}%` : '-'
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ assessment_date: dayjs() }}
      >
        <Card
          title="Input Monitoring TTV Harian"
          extra={
            <Button icon={<HistoryOutlined />} onClick={() => setIsHistoryModalOpen(true)}>
              Lihat Riwayat ({groupedHistory.length})
            </Button>
          }
          className="rounded-none!"
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
          <div className="space-y-4">
            <VitalSignsSection form={form} />
            <Card title="Kesadaran" className="mt-4!">
              <Form.Item label="Kesadaran" name="consciousness" rules={[{ required: true }]}>
                <Select placeholder="Pilih Kesadaran">
                  <Select.Option value="Compos Mentis">Compos Mentis</Select.Option>
                  <Select.Option value="Apatis">Apatis</Select.Option>
                  <Select.Option value="Somnolen">Somnolen</Select.Option>
                  <Select.Option value="Sopor">Sopor</Select.Option>
                  <Select.Option value="Coma">Coma</Select.Option>
                </Select>
              </Form.Item>
            </Card>
          </div>
        </Card>

        <Form.Item className="mt-4!">
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
              Simpan Monitoring
            </Button>
          </div>
        </Form.Item>
      </Form>

      <Modal
        title="Riwayat Monitoring TTV"
        open={isHistoryModalOpen}
        onCancel={() => setIsHistoryModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsHistoryModalOpen(false)}>
            Tutup
          </Button>
        ]}
        width={900}
      >
        <Table
          dataSource={groupedHistory}
          columns={columns}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ x: 800 }}
        />
      </Modal>
    </div>
  )
}
