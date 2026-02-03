import React, { useState } from 'react'
import { Form, Card, Button, Radio, Row, Col, Input, App, Space, Typography } from 'antd'
import { SaveOutlined, ClearOutlined } from '@ant-design/icons'
import { Odontogram, ToothSurface, ToothStatus } from './Odontogram'
import {
  useBulkCreateObservation,
  useObservationByEncounter
} from '../../../hooks/query/use-observation'
import { SNOMED_TEETH, SNOMED_CONDITIONS, SURFACE_NAMES } from '../../../config/dental-maps'
import { useEffect } from 'react'

const { TextArea } = Input
const { Text } = Typography

interface DentalAssessmentFormProps {
  encounterId: string
  patientData: any
  mode?: 'outpatient' | 'emergency'
  onSaveSuccess?: () => void
}

export const DentalAssessmentForm: React.FC<DentalAssessmentFormProps> = ({
  encounterId,
  patientData,
  onSaveSuccess
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const { mutateAsync: bulkCreateObs, isPending } = useBulkCreateObservation()
  const { data: observationData } = useObservationByEncounter(encounterId)

  const [odontogramData, setOdontogramData] = useState<Record<string, ToothSurface>>({})
  const [selectedStatus, setSelectedStatus] = useState<ToothStatus>('caries')

  const handleToothClick = (toothNumber: string, surface: keyof ToothSurface) => {
    setOdontogramData((prev) => {
      const currentTooth = prev[toothNumber] || {}
      const currentStatus = currentTooth[surface]

      const newStatus = currentStatus === selectedStatus ? undefined : selectedStatus

      return {
        ...prev,
        [toothNumber]: {
          ...currentTooth,
          [surface]: newStatus
        }
      }
    })
  }

  const handleClearOdontogram = () => {
    setOdontogramData({})
  }

  // Auto-fill logic from existing observations
  useEffect(() => {
    if (observationData?.result?.all && Array.isArray(observationData.result.all)) {
      const newOdontogramData: Record<string, ToothSurface> = {}
      let hasDentalData = false

      observationData.result.all.forEach((obs: any) => {
        // 1. Fill Text Fields
        if (obs.codeCoding?.[0]?.code === 'dental-anamnesis') {
          form.setFieldValue('dentalNote', obs.valueString)
        }
        if (obs.codeCoding?.[0]?.code === 'dental-findings') {
          // Check if it is the summary finding
          if (obs.display === 'Temuan Klinis Gigi (Summary)') {
            form.setFieldValue('clinicalFindings', obs.valueString)
          }
        }

        // 2. Fill Odontogram
        // Check if observation has bodySites (Teeth) and code (Condition)
        const toothCode = obs.bodySites?.[0]?.code
        const conditionCode = obs.codeCoding?.[0]?.code
        const surfaceName = obs.components?.[0]?.display

        if (toothCode && conditionCode) {
          // Reverse Lookup Tooth Number
          const toothNumber = Object.keys(SNOMED_TEETH).find(
            (key) => SNOMED_TEETH[key].code === toothCode
          )

          // Reverse Lookup Condition (Status)
          const status = Object.keys(SNOMED_CONDITIONS).find(
            (key) => SNOMED_CONDITIONS[key].code === conditionCode
          ) as ToothStatus | undefined

          // Reverse Lookup Surface
          let surface: keyof ToothSurface | undefined
          if (surfaceName) {
            surface = Object.keys(SURFACE_NAMES).find(
              (key) => SURFACE_NAMES[key] === surfaceName
            ) as keyof ToothSurface | undefined
          } else {
            // Fallback for whole tooth if no component
            surface = 'whole'
          }

          if (toothNumber && status && surface) {
            if (!newOdontogramData[toothNumber]) {
              newOdontogramData[toothNumber] = {}
            }
            newOdontogramData[toothNumber][surface] = status
            hasDentalData = true
          }
        }
      })

      if (hasDentalData) {
        setOdontogramData(newOdontogramData)
      }
    }
  }, [observationData, form])

  const onFinish = async (values: any) => {
    try {
      const observations: any[] = []

      if (values.dentalNote) {
        observations.push({
          category: 'exam',
          code: 'dental-anamnesis',
          display: 'Anamnesis Gigi',
          valueString: values.dentalNote
        })
      }

      // 2. Process Odontogram Data (Granular Observations)
      Object.entries(odontogramData).forEach(([toothNumber, surfaces]) => {
        Object.entries(surfaces).forEach(([surface, status]) => {
          if (!status) return

          const toothMap = SNOMED_TEETH[toothNumber]
          const conditionMap = SNOMED_CONDITIONS[status]
          const surfaceName = SURFACE_NAMES[surface] || surface

          if (toothMap && conditionMap) {
            observations.push({
              status: 'final',
              category: 'exam',
              code: conditionMap.code, // Condition Code (e.g. Caries)
              display: conditionMap.display,
              bodySites: [
                {
                  code: toothMap.code,
                  display: toothMap.display,
                  system: 'http://snomed.info/sct'
                }
              ],
              components: [
                {
                  code: 'surface', // Internal code for surface
                  display: surfaceName, // e.g. Occlusal surface
                  valueString: conditionMap.display // Value (e.g. Caries)
                }
              ],
              notes: [`Tooth ${toothNumber} - ${surfaceName}: ${conditionMap.display}`]
            })
          }
        })
      })

      // 3. Clinical Findings (Summary)
      if (values.clinicalFindings) {
        observations.push({
          category: 'exam',
          code: 'dental-findings',
          display: 'Temuan Klinis Gigi (Summary)',
          valueString: values.clinicalFindings
        })
      }

      const res = await bulkCreateObs({
        encounterId,
        patientId: patientData.patient.id,
        observations
      })

      if (res.success) {
        message.success('Data pemeriksaan gigi berhasil disimpan')
        if (onSaveSuccess) onSaveSuccess()
      } else {
        message.error('Gagal menyimpan data: ' + res.message)
      }
    } catch (error) {
      console.error('Error saving dental assessment:', error)
      message.error('Terjadi kesalahan saat menyimpan data')
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} className="space-y-4">
      <Row gutter={24}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <Text strong>Anamnesis & Keluhan Gigi</Text>
              </Space>
            }
            size="small"
          >
            <Form.Item name="dentalNote">
              <TextArea
                placeholder="Masukkan keluhan utama dan riwayat penyakit gigi pasien..."
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <Text strong>Odontogram Interaktif</Text>
          </Space>
        }
        size="small"
      >
        <div className="mb-4 flex justify-between items-center p-3 bg-blue-50 rounded-md border border-blue-100">
          <Space direction="vertical" size={1}>
            <Text strong>Pilih Status Gigi:</Text>
            <Radio.Group
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="caries" className="hover:bg-red-50">
                Karies (Merah)
              </Radio.Button>
              <Radio.Button value="filling" className="hover:bg-blue-50">
                Tumpatan (Biru)
              </Radio.Button>
              <Radio.Button value="root_canal">PSA (Root Canal)</Radio.Button>
              <Radio.Button value="bridge">Bridge</Radio.Button>
              <Radio.Button value="missing">Hilang</Radio.Button>
              <Radio.Button value="impacted">Impaksi</Radio.Button>
              <Radio.Button value="veneer">Veneer</Radio.Button>
            </Radio.Group>
          </Space>
          <Button danger icon={<ClearOutlined />} onClick={handleClearOdontogram}>
            Bersihkan Peta
          </Button>
        </div>

        <Odontogram data={odontogramData} onChange={handleToothClick} />

        <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-100 text-xs text-gray-500">
          <Text italic>
            Klik pada bagian gigi (atas, bawah, kiri, kanan, tengah) untuk menandai status yang
            dipilih.
          </Text>
        </div>
      </Card>

      <Row gutter={24} style={{ marginTop: '1rem' }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <Text strong>Temuan Klinis & Rencana Perawatan</Text>
              </Space>
            }
            size="small"
          >
            <Form.Item name="clinicalFindings">
              <TextArea
                placeholder="Tuliskan temuan klinis detail dan rencana tindakan..."
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <div className="flex justify-end gap-2 ">
        <Button icon={<ClearOutlined />} onClick={() => form.resetFields()} disabled={isPending}>
          Reset Form
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={isPending}
          size="large"
          className="bg-blue-600"
        >
          Simpan Pemeriksaan Gigi
        </Button>
      </div>
    </Form>
  )
}
