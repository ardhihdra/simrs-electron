import { useState, useEffect } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  App,
  Spin,
  Tag,
  Space,
  Select
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router'
import {
  MedicalRecord,
  VitalSigns,
  Anamnesis,
  PhysicalExamination,
  PatientQueue
} from '../../types/nurse.types'
import {
  submitMedicalRecord,
  getPatientQueueByEncounterId,
  updatePatientStatus
} from '../../services/nurse.service'
import { PatientStatus } from '../../types/nurse.types'

const { TextArea } = Input
const { Option } = Select

const MedicalRecordForm = () => {
  const navigate = useNavigate()
  const { encounterId } = useParams<{ encounterId: string }>()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [patientData, setPatientData] = useState<PatientQueue | null>(null)
  const [bmi, setBmi] = useState<number | null>(null)

  useEffect(() => {
    loadPatientData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterId])

  const loadPatientData = async () => {
    if (!encounterId) return

    setLoading(true)
    try {
      const queue = await getPatientQueueByEncounterId(encounterId)
      if (queue) {
        setPatientData(queue)
        // Update status to EXAMINING
        await updatePatientStatus(queue.id, PatientStatus.EXAMINING)
      } else {
        message.error('Data pasien tidak ditemukan')
        navigate('/dashboard/nurse-calling')
      }
    } catch (error) {
      message.error('Gagal memuat data pasien')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const calculateBMI = () => {
    const height = form.getFieldValue(['vitalSigns', 'height'])
    const weight = form.getFieldValue(['vitalSigns', 'weight'])

    if (height && weight && height > 0) {
      const heightInMeters = height / 100
      const calculatedBMI = weight / (heightInMeters * heightInMeters)
      const roundedBMI = Math.round(calculatedBMI * 100) / 100
      setBmi(roundedBMI)
      form.setFieldValue(['vitalSigns', 'bmi'], roundedBMI)
    }
  }

  const getBMICategory = (bmiValue: number): { text: string; color: string } => {
    if (bmiValue < 18.5) return { text: 'Kurus', color: 'blue' }
    if (bmiValue < 25) return { text: 'Normal', color: 'green' }
    if (bmiValue < 30) return { text: 'Gemuk', color: 'orange' }
    return { text: 'Obesitas', color: 'red' }
  }

  const onFinish = async (values: {
    vitalSigns: VitalSigns
    anamnesis: Anamnesis
    physicalExamination: PhysicalExamination
    notes?: string
  }) => {
    if (!encounterId || !patientData) {
      message.error('Data pasien tidak valid')
      return
    }

    setSubmitting(true)
    try {
      const medicalRecord: MedicalRecord = {
        encounterId,
        patientId: patientData.patient.id,
        nurseId: 'nurse-001', // TODO: Get from logged in user
        nurseName: 'Perawat Demo', // TODO: Get from logged in user
        vitalSigns: values.vitalSigns as VitalSigns,
        anamnesis: values.anamnesis as Anamnesis,
        physicalExamination: values.physicalExamination as PhysicalExamination,
        examinationDate: new Date().toISOString(),
        notes: values.notes
      }

      const response = await submitMedicalRecord({ medicalRecord })

      if (response.success) {
        message.success(response.message)
        form.resetFields()
        // Navigate back to queue
        setTimeout(() => {
          navigate('/dashboard/nurse-calling')
        }, 1500)
      } else {
        message.error(response.message)
      }
    } catch (error) {
      message.error('Gagal menyimpan rekam medis')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  if (!patientData) {
    return null
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/dashboard/nurse-calling')}
        className="mb-4"
      >
        Kembali ke Antrian
      </Button>

      {/* Patient Info Card */}
      <Card className="mb-4">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <div className="text-gray-500 text-sm">No. Antrian</div>
            <div className="text-3xl font-bold text-blue-600">{patientData.queueNumber}</div>
          </Col>
          <Col span={6}>
            <div className="text-gray-500 text-sm">No. Rekam Medis</div>
            <div className="text-lg font-semibold">{patientData.patient.medicalRecordNumber}</div>
          </Col>
          <Col span={6}>
            <div className="text-gray-500 text-sm">Nama Pasien</div>
            <div className="text-lg font-semibold">{patientData.patient.name}</div>
          </Col>
          <Col span={6}>
            <div className="text-gray-500 text-sm">Jenis Kelamin / Umur</div>
            <div className="text-lg">
              {patientData.patient.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'} /{' '}
              {patientData.patient.age} tahun
            </div>
          </Col>
          <Col span={6}>
            <div className="text-gray-500 text-sm">Poli</div>
            <div className="text-lg">{patientData.poli.name}</div>
          </Col>
          <Col span={6}>
            <div className="text-gray-500 text-sm">Dokter</div>
            <div className="text-lg">{patientData.doctor.name}</div>
          </Col>
        </Row>
      </Card>

      {/* Medical Record Form */}
      <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
        <Card title="Vital Signs / Tanda Vital" className="mb-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tekanan Darah Sistolik (mmHg)"
                name={['vitalSigns', 'systolicBloodPressure']}
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <InputNumber
                  min={0}
                  max={300}
                  placeholder="120"
                  className="w-full"
                  addonAfter="mmHg"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tekanan Darah Diastolik (mmHg)"
                name={['vitalSigns', 'diastolicBloodPressure']}
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <InputNumber
                  min={0}
                  max={200}
                  placeholder="80"
                  className="w-full"
                  addonAfter="mmHg"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Suhu Tubuh (°C)"
                name={['vitalSigns', 'temperature']}
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <InputNumber
                  min={30}
                  max={45}
                  step={0.1}
                  placeholder="36.5"
                  className="w-full"
                  addonAfter="°C"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Nadi (bpm)"
                name={['vitalSigns', 'pulseRate']}
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <InputNumber
                  min={30}
                  max={200}
                  placeholder="80"
                  className="w-full"
                  addonAfter="bpm"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Pernapasan (per menit)"
                name={['vitalSigns', 'respiratoryRate']}
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <InputNumber
                  min={10}
                  max={60}
                  placeholder="20"
                  className="w-full"
                  addonAfter="/min"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Tinggi Badan (cm)"
                name={['vitalSigns', 'height']}
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <InputNumber
                  min={0}
                  max={250}
                  placeholder="170"
                  className="w-full"
                  onChange={calculateBMI}
                  addonAfter="cm"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Berat Badan (kg)"
                name={['vitalSigns', 'weight']}
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <InputNumber
                  min={0}
                  max={300}
                  step={0.1}
                  placeholder="70"
                  className="w-full"
                  onChange={calculateBMI}
                  addonAfter="kg"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="BMI (Body Mass Index)" name={['vitalSigns', 'bmi']}>
                <div className="flex items-center gap-2">
                  <InputNumber disabled className="w-full" value={bmi || undefined} />
                  {bmi && <Tag color={getBMICategory(bmi).color}>{getBMICategory(bmi).text}</Tag>}
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Saturasi Oksigen - SpO2 (%)"
                name={['vitalSigns', 'oxygenSaturation']}
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <InputNumber min={0} max={100} placeholder="98" className="w-full" addonAfter="%" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Anamnesis" className="mb-4">
          <Form.Item
            label="Keluhan Utama"
            name={['anamnesis', 'chiefComplaint']}
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <TextArea rows={3} placeholder="Masukkan keluhan utama pasien..." />
          </Form.Item>

          <Form.Item
            label="Riwayat Penyakit Sekarang"
            name={['anamnesis', 'historyOfPresentIllness']}
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <TextArea rows={3} placeholder="Masukkan riwayat penyakit sekarang..." />
          </Form.Item>

          <Form.Item label="Riwayat Penyakit Dahulu" name={['anamnesis', 'historyOfPastIllness']}>
            <TextArea rows={3} placeholder="Masukkan riwayat penyakit dahulu (jika ada)..." />
          </Form.Item>

          <Form.Item label="Riwayat Alergi" name={['anamnesis', 'allergyHistory']}>
            <TextArea rows={2} placeholder="Masukkan riwayat alergi (jika ada)..." />
          </Form.Item>
        </Card>

        <Card title="Pemeriksaan Fisik" className="mb-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Kesadaran"
                name={['physicalExamination', 'consciousness']}
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <Select placeholder="Pilih tingkat kesadaran">
                  <Option value="Composmentis">Composmentis (Sadar Penuh)</Option>
                  <Option value="Apatis">Apatis</Option>
                  <Option value="Somnolen">Somnolen</Option>
                  <Option value="Sopor">Sopor</Option>
                  <Option value="Koma">Koma</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Keadaan Umum"
                name={['physicalExamination', 'generalCondition']}
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <Select placeholder="Pilih keadaan umum">
                  <Option value="Baik">Baik</Option>
                  <Option value="Sedang">Sedang</Option>
                  <Option value="Buruk">Buruk</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Catatan Pemeriksaan Fisik"
            name={['physicalExamination', 'additionalNotes']}
          >
            <TextArea rows={4} placeholder="Masukkan catatan tambahan pemeriksaan fisik..." />
          </Form.Item>
        </Card>

        <Card title="Catatan Tambahan" className="mb-4">
          <Form.Item label="Catatan" name="notes">
            <TextArea rows={3} placeholder="Masukkan catatan tambahan (opsional)..." />
          </Form.Item>
        </Card>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
              loading={submitting}
            >
              Simpan Rekam Medis
            </Button>
            <Button size="large" onClick={() => navigate('/dashboard/nurse-calling')}>
              Batal
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}

export default MedicalRecordForm
