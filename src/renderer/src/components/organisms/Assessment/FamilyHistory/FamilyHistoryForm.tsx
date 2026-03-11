import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { App, Button, Form, Spin, Card, Row, Col, Select, Input, Checkbox } from 'antd'
import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import {
  useCreateFamilyHistory,
  useFamilyHistoryByPatient
} from '@renderer/hooks/query/use-family-history'
import { createFamilyHistory as buildFamilyHistory } from '@renderer/utils/builders/family-history-builder'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useDiagnosisCodeList } from '@renderer/hooks/query/use-diagnosis-code'
import { PatientData } from '@renderer/types/doctor.types'

const { Option } = Select
const { TextArea } = Input

export interface FamilyHistoryFormProps {
  encounterId: string
  patientData: PatientData
  hideHeader?: boolean
  globalPerformerId?: string | number
}

export const FamilyHistoryForm: React.FC<FamilyHistoryFormProps> = ({
  encounterId,
  patientData,
  hideHeader = false,
  globalPerformerId
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createFamilyHistory = useCreateFamilyHistory()
  const patientId = patientData.patient.id
  const patientIdStr = patientId ? String(patientId) : undefined

  const { data: familyHistoryResponse, isLoading: isLoadingFamilyHistory } =
    useFamilyHistoryByPatient(patientId)
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

  useEffect(() => {
    if (familyHistoryResponse?.success && familyHistoryResponse?.result) {
      const fhList = familyHistoryResponse.result.flatMap(
        (fh: any) =>
          fh.conditions?.map((cond: any) => ({
            diagnosisCodeId: String(cond.diagnosisCodeId),
            outcome: cond.outcome,
            contributedToDeath: cond.contributedToDeath,
            note: cond.note
          })) || []
      )

      if (fhList.length > 0) {
        form.setFieldValue('familyHistoryList', fhList)
        const opts: Array<any> = []
        familyHistoryResponse.result.forEach((fh: any) => {
          fh.conditions?.forEach((cond: any) => {
            if (cond.diagnosisCode) {
              opts.push({
                id: String(cond.diagnosisCode.id),
                code: cond.diagnosisCode.code,
                display: cond.diagnosisCode.name_id || cond.diagnosisCode.name_en || ''
              })
            }
          })
        })
        if (opts.length > 0) {
          setDiagnosisOptions((prev) => {
            const existingIds = new Set(prev.map((o) => String(o.id)))
            const newOpts = opts.filter((o) => !existingIds.has(String(o.id)))
            return [...prev, ...newOpts]
          })
        }
      }
    }
  }, [familyHistoryResponse?.success, familyHistoryResponse?.result, form])

  const handleFinish = async (values: any) => {
    if (!encounterId || !patientIdStr) return

    let performerId = values.performerId
    if (hideHeader && globalPerformerId) {
      performerId = Number(globalPerformerId)
    }

    if (!hideHeader && !performerId) {
      // Only validate performerId if header is visible
      message.error('Mohon pilih pemeriksa atau pastikan dokter DPJP tersedia')
      return
    }

    try {
      setIsSubmitting(true)

      const familyHistoryList = values.familyHistoryList || []

      if (familyHistoryList.length > 0) {
        await createFamilyHistory.mutateAsync(
          buildFamilyHistory({
            patientId: patientIdStr,
            status: 'completed',
            relationship: 'other',
            conditions: familyHistoryList.map((item: any) => ({
              diagnosisCodeId: Number(item.diagnosisCodeId),
              outcome: item.outcome,
              contributedToDeath: Boolean(item.contributedToDeath),
              note: item.note
            }))
          })
        )

        message.success('Riwayat Penyakit Keluarga berhasil disimpan')
        const { queryClient } = await import('@renderer/query-client')
        queryClient.invalidateQueries({ queryKey: ['family-history', 'list', patientIdStr] })
      } else {
        message.warning('Tidak ada data riwayat penyakit keluarga yang diisi')
      }
    } catch (error: any) {
      console.error('Error saving family history:', error)
      const detailError = error?.error || error?.message || 'Error'
      message.error(`Gagal menyimpan riwayat penyakit keluarga: ${detailError}`)
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
        spinning={isSubmitting || isLoadingFamilyHistory}
        tip="Memuat Form Riwayat Keluarga..."
        size="large"
      >
        {!hideHeader && (
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
        )}

        <Card title="Riwayat Penyakit Keluarga" className="mt-4!">
          <Form.List name="familyHistoryList">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    className="mt-4 bg-gray-50 bg-opacity-50"
                    extra={
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<DeleteOutlined />}
                      />
                    }
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          label="Diagnosis"
                          name={[name, 'diagnosisCodeId']}
                          rules={[{ required: true, message: 'Wajib memilih diagnosa' }]}
                        >
                          <Select
                            showSearch
                            filterOption={false}
                            onSearch={setDiagnosisSearch}
                            placeholder="Cari kode diagnosa..."
                            notFoundContent={searchingDiagnosis ? <Spin size="small" /> : null}
                          >
                            {diagnosisOptions.map((d) => (
                              <Option
                                key={d.id}
                                value={String(d.id)}
                                label={`${d.code} - ${d.id_display || d.display}`}
                              >
                                {d.code} - {d.id_display || d.display}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item {...restField} label="Outcome" name={[name, 'outcome']}>
                          <Select placeholder="Pilih outcome">
                            <Select.Option value="resolved">Diabetes resolved</Select.Option>
                            <Select.Option value="ongoing">Ongoing</Select.Option>
                            <Select.Option value="unknown">Unknown</Select.Option>
                            <Select.Option value="remission">Remission</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={4} className="flex items-end pb-6">
                        <Form.Item
                          {...restField}
                          name={[name, 'contributedToDeath']}
                          valuePropName="checked"
                          className="mb-0"
                        >
                          <Checkbox>Meninggal?</Checkbox>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item {...restField} label="Catatan (Onset/Detail)" name={[name, 'note']}>
                      <TextArea
                        rows={2}
                        placeholder="Contoh: Ibu pasien pernah menderita DM 10 tahun yll..."
                      />
                    </Form.Item>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  className="mt-4"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Tambah Riwayat Penyakit Keluarga
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        <Form.Item className="flex justify-end pt-4!">
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            size="large"
            disabled={isSubmitting}
          >
            Simpan Riwayat Keluarga
          </Button>
        </Form.Item>
      </Spin>
    </Form>
  )
}
