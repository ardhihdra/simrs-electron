import React, { useState } from 'react'
import { Form, Card, Button, Radio, Row, Col, Input, App, Space, Typography } from 'antd'
import { SaveOutlined, ClearOutlined } from '@ant-design/icons'
import { Odontogram, ToothSurface, ToothStatus } from './Odontogram'
import { useBulkCreateObservation } from '../../../hooks/query/use-observation'

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

  const [odontogramData, setOdontogramData] = useState<Record<string, ToothSurface>>({})
  const [selectedStatus, setSelectedStatus] = useState<ToothStatus>('caries')

  const handleToothClick = (toothNumber: string, surface: keyof ToothSurface) => {
    setOdontogramData((prev) => {
      const currentTooth = prev[toothNumber] || {}
      const currentStatus = currentTooth[surface]

      // If same status, toggle to healthy (undefined)
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

  const onFinish = async (values: any) => {
    try {
      const observations: any[] = []

      // 1. Dental Note / Anamnesis
      if (values.dentalNote) {
        observations.push({
          category: 'exam',
          code: 'dental-anamnesis',
          display: 'Anamnesis Gigi',
          valueString: values.dentalNote
        })
      }

      // 2. Odontogram Data (Serialized flattened)
      // We store it as a JSON string for now, or map to FHIR observations per tooth if needed
      if (Object.keys(odontogramData).length > 0) {
        observations.push({
          category: 'exam',
          code: 'odontogram-data',
          display: 'Data Odontogram',
          valueString: JSON.stringify(odontogramData)
        })
      }

      // 3. Additional Clinical Findings
      if (values.clinicalFindings) {
        observations.push({
          category: 'exam',
          code: 'dental-findings',
          display: 'Temuan Klinis Gigi',
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
    <Form form={form} layout="vertical" onFinish={onFinish} className="space-y-6">
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

      <Row gutter={24}>
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

      <div className="flex justify-end gap-2 sticky bottom-0 bg-white p-4 border-t border-gray-100 z-10">
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
