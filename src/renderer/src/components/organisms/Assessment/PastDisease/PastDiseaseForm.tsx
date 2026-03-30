import { SaveOutlined, HistoryOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Form,
  Spin,
  Card,
  Input,
  Table,
  Modal,
  DatePicker,
  InputNumber,
  Row,
  Col
} from 'antd'
import React, { useState } from 'react'
import dayjs from 'dayjs'
import {
  useBulkCreateCondition,
  useConditionByEncounter
} from '@renderer/hooks/query/use-condition'
import {
  CONDITION_CATEGORIES,
  createConditionBatch
} from '@renderer/utils/builders/condition-builder'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { PatientData } from '@renderer/types/doctor.types'

const { TextArea } = Input

export interface PastDiseaseFormProps {
  encounterId: string
  patientData: PatientData
  hideHeader?: boolean
  globalPerformerId?: string | number
}

export const PastDiseaseForm: React.FC<PastDiseaseFormProps> = ({
  encounterId,
  patientData,
  hideHeader = false,
  globalPerformerId
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  const bulkCreateCondition = useBulkCreateCondition()
  const patientId = patientData.patient.id
  const patientIdStr = patientId ? String(patientId) : undefined

  const { data: conditionResponse, isLoading: isLoadingCondition } =
    useConditionByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])

  const historyData = conditionResponse?.result || []
  const pastDiseases = historyData
    .filter((cond: any) =>
      cond.categories?.some((cat: any) => cat.code === CONDITION_CATEGORIES.PREVIOUS_CONDITION)
    )
    .sort((a: any, b: any) => {
      const dateA = dayjs(a.recordedDate || a.onsetDateTime || 0).valueOf()
      const dateB = dayjs(b.recordedDate || b.onsetDateTime || 0).valueOf()
      return dateB - dateA
    })

  const columns = [
    {
      title: 'Tanggal',
      dataIndex: 'recordedDate',
      key: 'recordedDate',
      width: 140,
      render: (date: string) => dayjs(date).format('DD MMM YYYY, HH:mm')
    },
    {
      title: 'Riwayat Penyakit',
      dataIndex: 'note',
      key: 'note',
      render: (note: string) => note || '-'
    },
    {
      title: 'Informasi Onset',
      key: 'onset',
      width: 250,
      render: (_: any, record: any) => {
        const period = record.onsetPeriod
        const age = record.onsetAge
        const parts: string[] = []
        if (period?.start || period?.end) {
          const start = period.start ? dayjs(period.start).format('DD/MM/YYYY') : '?'
          const end = period.end ? dayjs(period.end).format('DD/MM/YYYY') : '?'
          parts.push(`Periode: ${start} - ${end}`)
        }
        if (age) {
          parts.push(`Usia: ${age} Thn`)
        }
        return parts.length > 0 ? parts.join(' • ') : '-'
      }
    }
  ]

  const handleFinish = async (values: any) => {
    if (!encounterId || !patientIdStr) return

    let performerId = values.performerId
    if (hideHeader && globalPerformerId) {
      performerId = Number(globalPerformerId)
    }

    if (!performerId) {
      message.error('Mohon pilih pemeriksa atau pastikan dokter DPJP tersedia')
      return
    }

    try {
      setIsSubmitting(true)

      let onsetPeriodStart: string | undefined = undefined
      let onsetPeriodEnd: string | undefined = undefined
      let onsetAge: number | undefined = undefined

      if (values.onsetPeriod && values.onsetPeriod.length === 2) {
        onsetPeriodStart = values.onsetPeriod[0]?.toISOString()
        onsetPeriodEnd = values.onsetPeriod[1]?.toISOString()
      }
      
      if (values.onsetAge) {
        onsetAge = Number(values.onsetAge)
      }

      const conditionsToCreate = [
        {
          category: CONDITION_CATEGORIES.PREVIOUS_CONDITION,
          notes: values.historyOfPresentIllness,
          recordedDate: dayjs().toISOString(),
          clinicalStatus: 'ACTIVE', // Default to active entry
          onsetPeriod:
            onsetPeriodStart || onsetPeriodEnd
              ? { start: onsetPeriodStart, end: onsetPeriodEnd }
              : undefined,
          onsetAge: onsetAge
        }
      ]

      const conditions = createConditionBatch(conditionsToCreate as any)

      await bulkCreateCondition.mutateAsync({
        encounterId,
        patientId: patientIdStr,
        doctorId: performerId ? Number(performerId) : 0,
        conditions
      })

      message.success('Riwayat Penyakit berhasil disimpan')
      form.resetFields([
        'historyOfPresentIllness',
        'onsetPeriod',
        'onsetAge'
      ])
      const { queryClient } = await import('@renderer/query-client')
      queryClient.invalidateQueries({ queryKey: ['condition', 'by-encounter', encounterId] })
    } catch (error: any) {
      console.error('Error saving past disease:', error)
      const detailError = error?.error || error?.message || 'Error'
      message.error(`Gagal menyimpan riwayat penyakit: ${detailError}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      className="flex! flex-col! gap-4!"
      initialValues={{
        assessment_date: dayjs()
      }}
    >
      <Spin
        spinning={isSubmitting || isLoadingCondition}
        tip="Memuat Form Riwayat Penyakit..."
        size="large"
      >
        {!hideHeader && (
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
        )}

        <Card
          title="Riwayat Penyakit"
          className="mt-4!"
          extra={
            <Button icon={<HistoryOutlined />} onClick={() => setIsHistoryModalOpen(true)}>
              Lihat Riwayat ({pastDiseases.length})
            </Button>
          }
        >
          <Form.Item
            label={<span className="font-semibold">Nama / Rincian Riwayat Penyakit</span>}
            name="historyOfPresentIllness"
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <TextArea rows={3} placeholder="Masukkan rincian riwayat penyakit pasien..." />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Rentang Waktu Terjangkit (Onset Period)" name="onsetPeriod">
                <DatePicker.RangePicker className="w-full" allowEmpty={[true, true]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Terjangkit pada Usia (Tahun)" name="onsetAge">
                <InputNumber
                  className="w-full"
                  min={0}
                  max={150}
                  placeholder="Contoh: 10"
                  addonAfter="Tahun"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Form.Item className="mt-4!">
          <div className="flex justify-end gap-2">
            <Button size="large" onClick={() => form.resetFields()}>
              Reset
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
              disabled={isSubmitting}
            >
              Simpan Riwayat Penyakit
            </Button>
          </div>
        </Form.Item>
      </Spin>

      <Modal
        title="Daftar Riwayat Penyakit Pasien"
        open={isHistoryModalOpen}
        onCancel={() => setIsHistoryModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsHistoryModalOpen(false)}>
            Tutup
          </Button>
        ]}
        width={850}
      >
        <Table
          dataSource={pastDiseases}
          columns={columns}
          loading={isLoadingCondition}
          pagination={{ pageSize: 10 }}
          size="small"
          rowKey="id"
        />
      </Modal>
    </Form>
  )
}
