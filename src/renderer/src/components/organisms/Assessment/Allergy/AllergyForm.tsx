import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Form, Spin, Card, Row, Col, Select, Input } from 'antd'
import React, { useEffect, useState } from 'react'
import { useCreateAllergy, useAllergyByEncounter } from '@renderer/hooks/query/use-allergy'
import { createAllergy as buildAllergy } from '@renderer/utils/builders/allergy-builder'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useDiagnosisCodeList } from '@renderer/hooks/query/use-diagnosis-code'
import { PatientData } from '@renderer/types/doctor.types'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

export interface AllergyFormProps {
  encounterId: string
  patientData: PatientData
}

export const AllergyForm: React.FC<AllergyFormProps> = ({ encounterId, patientData }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createAllergy = useCreateAllergy()
  const patientId = patientData.patient.id
  const patientIdStr = patientId ? String(patientId) : undefined

  const { data: allergyResponse, isLoading: isLoadingAllergy } = useAllergyByEncounter(encounterId)
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

  const [kfaSearch, setKfaSearch] = useState('')
  const [kfaOptions, setKfaOptions] = useState<any[]>([])
  const [loadingKfa, setLoadingKfa] = useState(false)

  const isMedication = Form.useWatch('allergyHistory_category', form) === 'medication'

  useEffect(() => {
    const fetchKfa = async () => {
      if (!kfaSearch || kfaSearch.length < 3) {
        setKfaOptions([])
        return
      }
      setLoadingKfa(true)
      try {
        const res = await window.api?.searchKfa({ query: kfaSearch })
        if (res?.success && res.result) {
          setKfaOptions(res.result)
        } else {
          setKfaOptions([])
        }
      } catch (error) {
        console.error('Error fetching KFA:', error)
      } finally {
        setLoadingKfa(false)
      }
    }
    const timer = setTimeout(fetchKfa, 500)
    return () => clearTimeout(timer)
  }, [kfaSearch])

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
    if (allergyResponse?.success && allergyResponse?.result) {
      const allergies = allergyResponse.result
      if (Array.isArray(allergies) && allergies.length > 0) {
        const firstAllergy = allergies[0]

        const codeId = firstAllergy.codeCoding?.[0]?.diagnosisCodeId
        const codeCode = firstAllergy.codeCoding?.[0]?.diagnosisCode?.code
        const codeDisplay = firstAllergy.codeCoding?.[0]?.diagnosisCode?.display
        const nameId = firstAllergy.codeCoding?.[0]?.diagnosisCode?.name_id

        const kfaId = firstAllergy.codeCoding?.[0]?.kfaCodeId
        const kfaCodeNum = firstAllergy.codeCoding?.[0]?.kfaCode?.code
        const kfaDisplay = firstAllergy.codeCoding?.[0]?.kfaCode?.display

        const note = allergies
          .map((a: any) => a.note)
          .filter(Boolean)
          .join(', ')

        form.setFieldsValue({
          allergyHistory: note,
          allergyHistory_codeId: codeId ? String(codeId) : undefined,
          allergyHistory_kfaCodeId: kfaId ? String(kfaId) : undefined,
          allergyHistory_category:
            typeof firstAllergy.category === 'string'
              ? firstAllergy.category
              : firstAllergy.category?.[0] || 'food'
        })

        if (codeId && codeDisplay) {
          const dashIdx = codeDisplay.indexOf(' - ')
          const code = dashIdx >= 0 ? codeDisplay.slice(0, dashIdx) : codeCode || codeDisplay
          const display = dashIdx >= 0 ? codeDisplay.slice(dashIdx + 3) : codeDisplay

          setDiagnosisOptions((prev) => {
            const exists = prev.find((o) => String(o.id) === String(codeId))
            if (!exists) {
              return [...prev, { id: String(codeId), code, display, id_display: nameId }]
            }
            return prev
          })
        }

        if (kfaId && kfaDisplay) {
          setKfaOptions((prev) => {
            const exists = prev.find((o) => String(o.id) === String(kfaId))
            if (!exists) {
              return [...prev, { id: String(kfaId), kode: String(kfaCodeNum), nama: kfaDisplay }]
            }
            return prev
          })
        }
      }
    }
  }, [allergyResponse?.success, allergyResponse?.result, form])

  const handleFinish = async (values: any) => {
    if (!encounterId || !patientIdStr) return

    if (!values.performerId) {
      message.error('Mohon pilih pemeriksa')
      return
    }

    try {
      setIsSubmitting(true)

      if (
        values.allergyHistory ||
        values.allergyHistory_codeId ||
        values.allergyHistory_kfaCodeId
      ) {
        const allergyPayload = buildAllergy({
          patientId: patientIdStr,
          encounterId,
          note: values.allergyHistory,
          diagnosisCodeId: values.allergyHistory_codeId
            ? Number(values.allergyHistory_codeId)
            : undefined,
          kfaCodeId: values.allergyHistory_kfaCodeId
            ? Number(values.allergyHistory_kfaCodeId)
            : undefined,
          clinicalStatus: 'active',
          verificationStatus: 'confirmed',
          category: values.allergyHistory_category || 'food'
        })

        await createAllergy.mutateAsync(allergyPayload)

        message.success('Alergi berhasil disimpan')
        const { queryClient } = await import('@renderer/query-client')
        queryClient.invalidateQueries({ queryKey: ['allergy', 'byEncounter', encounterId] })
      } else {
        message.warning('Tidak ada data alergi yang diisi')
      }
    } catch (error: any) {
      console.error('Error saving allergy:', error)
      const detailError = error?.error || error?.message || 'Error'
      message.error(`Gagal menyimpan alergi: ${detailError}`)
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
      <Spin spinning={isSubmitting || isLoadingAllergy} tip="Memuat Form Alergi..." size="large">
        <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

        <Card title="Riwayat Alergi" className="mt-4!">
          <Row gutter={16} className="mb-2">
            <Col span={16}>
              {!isMedication ? (
                <Form.Item
                  label="Alergen (ICD-10/SNOMED)"
                  name="allergyHistory_codeId"
                  className="mb-0"
                >
                  <Select
                    showSearch
                    filterOption={false}
                    onSearch={setDiagnosisSearch}
                    placeholder="Cari zat/substansi alergi (ICD-10/SNOMED)..."
                    className="w-full"
                    notFoundContent={searchingDiagnosis ? <Spin size="small" /> : null}
                    onSelect={(_, option: { label: string }) => {
                      if (!form.getFieldValue('allergyHistory')) {
                        form.setFieldValue('allergyHistory', option.label)
                      }
                    }}
                    allowClear
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
              ) : (
                <Form.Item
                  label="Alergen Obat (KFA SATUSEHAT)"
                  name="allergyHistory_kfaCodeId"
                  className="mb-0"
                >
                  <Select
                    showSearch
                    filterOption={false}
                    onSearch={setKfaSearch}
                    placeholder="Cari obat penyebab alergi (KFA)..."
                    className="w-full"
                    notFoundContent={loadingKfa ? <Spin size="small" /> : null}
                    onSelect={(_, option: any) => {
                      if (!form.getFieldValue('allergyHistory')) {
                        form.setFieldValue('allergyHistory', option.appName)
                      }
                    }}
                    allowClear
                  >
                    {kfaOptions.map((d) => (
                      <Option
                        key={d.id}
                        value={String(d.id)}
                        appName={d.nama}
                        label={`${d.kode} - ${d.nama}`}
                      >
                        {d.kode} - {d.nama}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
            </Col>
            <Col span={8}>
              <Form.Item label="Kategori" name="allergyHistory_category" className="mb-0">
                <Select placeholder="Kategori Alergi" allowClear>
                  <Option value="food">Makanan (Food)</Option>
                  <Option value="medication">Obat (Medication)</Option>
                  <Option value="environment">Lingkungan (Environment)</Option>
                  <Option value="biologic">Biologi (Biologic)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Catatan Alergi" name="allergyHistory" className="mt-4">
            <TextArea
              rows={3}
              placeholder="Masukkan catatan tambahan riwayat alergi (jika ada)..."
            />
          </Form.Item>
        </Card>

        <Form.Item className="flex justify-end pt-4!">
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            size="large"
            disabled={isSubmitting}
          >
            Simpan Alergi
          </Button>
        </Form.Item>
      </Spin>
    </Form>
  )
}
