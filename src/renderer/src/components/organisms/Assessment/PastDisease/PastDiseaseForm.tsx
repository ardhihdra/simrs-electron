import { SaveOutlined, HistoryOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Form,
  Spin,
  Card,
  Select,
  Input,
  Table,
  Modal,
  Radio,
  DatePicker,
  InputNumber
} from 'antd'
import React, { useEffect, useState } from 'react'
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
import { useDiagnosisCodeList } from '@renderer/hooks/query/use-diagnosis-code'
import { PatientData } from '@renderer/types/doctor.types'

const { Option } = Select
const { TextArea } = Input

export interface PastDiseaseFormProps {
  encounterId: string
  patientData: PatientData
}

export const PastDiseaseForm: React.FC<PastDiseaseFormProps> = ({ encounterId, patientData }) => {
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

  const [diagnosisSearch, setDiagnosisSearch] = useState('')
  const [debouncedDiagnosisSearch, setDebouncedDiagnosisSearch] = useState('')

  const { data: masterDiagnosis, isLoading: searchingDiagnosis } = useDiagnosisCodeList({
    q: debouncedDiagnosisSearch,
    items: 20
  })

  const [diagnosisOptions, setDiagnosisOptions] = useState<any[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDiagnosisSearch(diagnosisSearch)
    }, 500)
    return () => clearTimeout(timer)
  }, [diagnosisSearch])

  useEffect(() => {
    if (debouncedDiagnosisSearch.length >= 2 && masterDiagnosis) {
      setDiagnosisOptions(masterDiagnosis)
    } else {
      setDiagnosisOptions([])
    }
  }, [masterDiagnosis, debouncedDiagnosisSearch])

  useEffect(() => {}, [conditionResponse?.success, conditionResponse?.result])

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
      title: 'ICD-10/SNOMED',
      key: 'code',
      width: 200,
      render: (_: any, record: any) => {
        const coding = record.codeCoding?.[0]?.diagnosisCode
        if (!coding) return '-'
        return `${coding.code} - ${coding.name_id || coding.name_en || coding.display}`
      }
    },
    {
      title: 'Catatan',
      dataIndex: 'note',
      key: 'note',
      render: (note: string) => note || '-'
    }
  ]

  const handleFinish = async (values: any) => {
    if (!encounterId || !patientIdStr) return

    if (!values.performerId) {
      message.error('Mohon pilih pemeriksa')
      return
    }

    try {
      setIsSubmitting(true)

      const isInactive = values.diseaseType === 'inactive'

      let onsetPeriodStart: string | undefined = undefined
      let onsetPeriodEnd: string | undefined = undefined
      let onsetAge: number | undefined = undefined

      if (!isInactive && values.onsetPeriod && values.onsetPeriod.length === 2) {
        onsetPeriodStart = values.onsetPeriod[0].toISOString()
        onsetPeriodEnd = values.onsetPeriod[1].toISOString()
      } else if (isInactive && values.onsetAge) {
        onsetAge = Number(values.onsetAge)
      }

      const conditionsToCreate = [
        {
          category: CONDITION_CATEGORIES.PREVIOUS_CONDITION,
          notes: values.historyOfPresentIllness,
          diagnosisCodeId: values.historyOfPresentIllness_codeId
            ? Number(values.historyOfPresentIllness_codeId)
            : undefined,
          recordedDate: dayjs().toISOString(),
          clinicalStatus: isInactive ? 'INACTIVE' : 'ACTIVE',
          onsetPeriod:
            onsetPeriodStart && onsetPeriodEnd
              ? { start: onsetPeriodStart, end: onsetPeriodEnd }
              : undefined,
          onsetAge: onsetAge
        }
      ]

      const conditions = createConditionBatch(conditionsToCreate as any)

      await bulkCreateCondition.mutateAsync({
        encounterId,
        patientId: patientIdStr,
        doctorId: Number(values.performerId),
        conditions
      })

      message.success('Riwayat Penyakit berhasil disimpan')
      form.resetFields([
        'historyOfPresentIllness',
        'historyOfPresentIllness_codeId',
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
        assessment_date: dayjs(),
        diseaseType: 'active'
      }}
    >
      <Spin
        spinning={isSubmitting || isLoadingCondition}
        tip="Memuat Form Riwayat Penyakit..."
        size="large"
      >
        <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

        <Card
          title="Riwayat Penyakit"
          className="mt-4!"
          extra={
            <Button icon={<HistoryOutlined />} onClick={() => setIsHistoryModalOpen(true)}>
              Lihat Riwayat ({pastDiseases.length})
            </Button>
          }
        >
          <Form.Item name="diseaseType" style={{ marginBottom: 16 }}>
            <Radio.Group optionType="button" buttonStyle="solid">
              <Radio.Button value="active">Riwayat Penyakit Sekarang</Radio.Button>
              <Radio.Button value="inactive">Riwayat Penyakit Dulu</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.diseaseType !== currentValues.diseaseType
            }
          >
            {({ getFieldValue }) => {
              const diseaseType = getFieldValue('diseaseType')
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Riwayat Penyakit (ICD-10/SNOMED)"
                    name="historyOfPresentIllness_codeId"
                    rules={[
                      {
                        required: true,
                        message: 'Kode ICD-10/SNOMED wajib dipilih untuk sinkronisasi SatuSehat'
                      }
                    ]}
                  >
                    <Select
                      showSearch
                      filterOption={false}
                      onSearch={setDiagnosisSearch}
                      placeholder="Cari kode ICD-10/SNOMED..."
                      className="w-full"
                      notFoundContent={searchingDiagnosis ? <Spin size="small" /> : null}
                      onSelect={(_, option: any) => {
                        form.setFieldValue('historyOfPresentIllness', option['data-display'])
                      }}
                      allowClear
                    >
                      {diagnosisOptions.map((d) => (
                        <Option
                          key={d.id}
                          value={String(d.id)}
                          label={`${d.code} - ${d.id_display || d.display}`}
                          data-display={d.id_display || d.display}
                        >
                          {d.code} - {d.id_display || d.display}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {diseaseType === 'active' ? (
                    <Form.Item label="Rentang Waktu Terjangkit (Onset Period)" name="onsetPeriod">
                      <DatePicker.RangePicker className="w-full" allowEmpty={[true, true]} />
                    </Form.Item>
                  ) : (
                    <Form.Item label="Terjangkit pada Usia (Tahun)" name="onsetAge">
                      <InputNumber
                        className="w-full"
                        min={0}
                        max={150}
                        placeholder="Contoh: 10"
                        addonAfter="Tahun"
                      />
                    </Form.Item>
                  )}
                </div>
              )
            }}
          </Form.Item>

          <Form.Item
            label="Rincian Riwayat Penyakit"
            name="historyOfPresentIllness"
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <TextArea rows={3} placeholder="Masukkan catatan tambahan atau riwayat penyakit..." />
          </Form.Item>
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
        width={800}
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
