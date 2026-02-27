import { App, Button, Card, Col, DatePicker, Form, InputNumber, Row, Select, Spin } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'

import { AssessmentHeader } from '@renderer/components/organisms/Assessment/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import {
  useBulkCreateObservation,
  useObservationByEncounter
} from '@renderer/hooks/query/use-observation'
import { PatientData } from '@renderer/types/doctor.types'
import {
  buildAncObservations,
  parseAncObservations
} from '@renderer/utils/formatters/anc-formatter'
import { ENGAGEMENT_CODES, PRESENTATION_CODES } from '@renderer/config/maps/anc-maps'
import { createObservationBatch } from '@renderer/utils/builders/observation-builder'

const { Option } = Select

interface AntenatalCareFormProps {
  encounterId: string
  patientData: PatientData
}

export const AntenatalCareForm: React.FC<AntenatalCareFormProps> = ({
  encounterId,
  patientData
}) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const patientId = patientData?.patient.id
  const bulkCreateObservation = useBulkCreateObservation()
  const { data: response, isLoading: isLoadingObs } = useObservationByEncounter(encounterId)

  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'doctor',
    'nurse'
  ])

  useEffect(() => {
    if (response?.success && response.result) {
      if (response.result.length === 0) return

      const parsedData = parseAncObservations(response.result)
      const firstObs = response.result[0]

      if (parsedData.obstetricHistory?.hpht) {
        parsedData.obstetricHistory.hpht = dayjs(parsedData.obstetricHistory.hpht)
      }
      if (parsedData.obstetricHistory?.hpl) {
        parsedData.obstetricHistory.hpl = dayjs(parsedData.obstetricHistory.hpl)
      }

      const performerId = firstObs?.performers?.[0]?.practitionerId
      const effectiveDateTime = firstObs?.effectiveDateTime

      form.setFieldsValue({
        ...parsedData,
        assessment_date: effectiveDateTime ? dayjs(effectiveDateTime) : dayjs(),
        ...(performerId ? { performerId: Number(performerId) } : {})
      })
    }
  }, [response, form])

  const handleFinish = async (values: any) => {
    if (!encounterId || !patientId) {
      message.error('Data kunjungan atau pasien tidak valid')
      return
    }
    if (!values.performerId) {
      message.error('Pilih pemeriksa terlebih dahulu')
      return
    }

    try {
      setIsSubmitting(true)
      const assessmentDate = values.assessment_date || dayjs()
      const performerName =
        performersData?.find((p: any) => p.id === values.performerId)?.name || 'Unknown'

      const formattedValues = { ...values }
      if (formattedValues.obstetricHistory) {
        if (formattedValues.obstetricHistory.hpht) {
          formattedValues.obstetricHistory.hpht =
            formattedValues.obstetricHistory.hpht.format('YYYY-MM-DD')
        }
        if (formattedValues.obstetricHistory.hpl) {
          formattedValues.obstetricHistory.hpl =
            formattedValues.obstetricHistory.hpl.format('YYYY-MM-DD')
        }
      }

      const obsToCreate = buildAncObservations(formattedValues)

      if (obsToCreate.length === 0) {
        message.info('Tidak ada data asuhan kehamilan (ANC) untuk disimpan')
        return
      }

      const observations = createObservationBatch(obsToCreate, assessmentDate.toDate())

      await bulkCreateObservation.mutateAsync({
        encounterId,
        patientId,
        observations,
        performerId: String(values.performerId),
        performerName
      })

      message.success('Berhasil menyimpan data Antenatal Care (ANC)')
    } catch (error: any) {
      console.error('Error saving ANC:', error)
      message.error(`Gagal menyimpan data ANC: ${error?.message || 'Error tidak diketahui'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingObs) {
    return (
      <div className="p-8 text-center">
        <Spin tip="Memuat riwayat ANC..." />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 overflow-y-auto">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ assessment_date: dayjs() }}
          className="flex flex-col gap-4 pb-4"
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

          <div className="flex flex-col gap-4">
            {/* Section: Status Obstetri & Kunjungan */}
            <Card title="Status Obstetri & Data Kunjungan" size="small">
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name={['obstetricHistory', 'gravida']} label="Gravida (G)">
                    <InputNumber min={1} className="w-full" placeholder="G..." />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name={['obstetricHistory', 'paritas']} label="Para (P)">
                    <InputNumber min={0} className="w-full" placeholder="P..." />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name={['obstetricHistory', 'abortus']} label="Abortus (A)">
                    <InputNumber min={0} className="w-full" placeholder="A..." />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name={['obstetricHistory', 'hpht']}
                    label="Hari Pertama Haid Terakhir (HPHT)"
                  >
                    <DatePicker format="DD-MM-YYYY" className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['obstetricHistory', 'hpl']}
                    label="Hari Perkiraan Lahir (HPL/HTP)"
                  >
                    <DatePicker format="DD-MM-YYYY" className="w-full" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name={['obstetricHistory', 'usia_kehamilan']}
                    label="Usia Kehamilan (Minggu)"
                  >
                    <InputNumber min={0} addonAfter="Minggu" className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['obstetricHistory', 'trimester']} label="Trimester Ke">
                    <Select placeholder="Pilih Trimester">
                      <Option value="1">Trimester 1</Option>
                      <Option value="2">Trimester 2</Option>
                      <Option value="3">Trimester 3</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name={['obstetricHistory', 'jarak_kehamilan']}
                    label="Jarak Kehamilan Sblmnya"
                  >
                    <InputNumber min={0} addonAfter="Bulan" className="w-full" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Section: Pemeriksaan Spesifik & Janin */}
            <Card title="Pemeriksaan Ibu (Obstetri) & Janin" size="small">
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name={['maternalExam', 'lila']} label="Lingkar Lengan Atas (LiLA)">
                    <InputNumber min={0} step={0.1} addonAfter="cm" className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['maternalExam', 'tfu']} label="Tinggi Fundus Uteri (TFU)">
                    <InputNumber min={0} step={0.1} addonAfter="cm" className="w-full" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name={['maternalExam', 'golongan_darah']} label="Golongan Darah">
                    <Select placeholder="Pilih Gol. Darah">
                      <Option value="A">A</Option>
                      <Option value="B">B</Option>
                      <Option value="AB">AB</Option>
                      <Option value="O">O</Option>
                      <Option value="Tidak Tahu">Tidak Tahu</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['maternalExam', 'rhesus']} label="Rhesus">
                    <Select placeholder="Pilih Rhesus">
                      <Option value="Positif (+)">Positif (+)</Option>
                      <Option value="Negatif (-)">Negatif (-)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <div className="font-semibold mb-2 mt-4 text-gray-700">Pemeriksaan Janin</div>
              <div className="p-3 bg-blue-50/50 rounded-md border border-blue-100">
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      name={['fetalExam', 'djj']}
                      label="Denyut Jantung Janin (DJJ)"
                      className="mb-3"
                    >
                      <InputNumber min={0} addonAfter="bpm" className="w-full" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name={['fetalExam', 'tbj']}
                      label="Taksiran Berat Janin (TBJ)"
                      className="mb-3"
                    >
                      <InputNumber min={0} addonAfter="gram" className="w-full" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      name={['fetalExam', 'presentasi']}
                      label="Letak / Presentasi Janin"
                      className="mb-3"
                    >
                      <Select placeholder="Pilih Presentasi">
                        {Object.entries(PRESENTATION_CODES).map(([code, label]) => (
                          <Option key={code} value={code}>
                            {label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name={['fetalExam', 'kepala_terhadap_pap']}
                      label="Kepala Thdp Pintu Atas Panggul"
                      className="mb-3"
                    >
                      <Select placeholder="Pilih Status PAP">
                        {Object.entries(ENGAGEMENT_CODES).map(([code, label]) => (
                          <Option key={code} value={code}>
                            {label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      name={['fetalExam', 'jumlah_janin']}
                      label="Jumlah Janin"
                      className="mb-0"
                    >
                      <InputNumber min={1} className="w-full" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </Card>
          </div>
        </Form>
      </div>
      <div className="flex justify-end pt-4 border-t border-white/10 mt-auto">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => form.submit()}
          loading={isSubmitting || bulkCreateObservation.isPending}
          size="large"
        >
          Simpan Form ANC
        </Button>
      </div>
    </div>
  )
}
