import { useState, useEffect } from 'react'
import { Card, Row, Col, Descriptions, Button, Spin, Space, Tag, App } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router'
import { PatientWithMedicalRecord } from '../../types/doctor.types'
import { getPatientMedicalRecord } from '../../services/doctor.service'

const MedicalRecordDetail = () => {
  const navigate = useNavigate()
  const { encounterId } = useParams<{ encounterId: string }>()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState<PatientWithMedicalRecord | null>(null)

  useEffect(() => {
    loadMedicalRecord()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterId])

  const loadMedicalRecord = async () => {
    if (!encounterId) return

    setLoading(true)
    try {
      const data = await getPatientMedicalRecord(encounterId)
      if (data) {
        setPatientData(data)
      } else {
        message.error('Data pasien tidak ditemukan')
        navigate('/dashboard/doctor-medical-records')
      }
    } catch (error) {
      message.error('Gagal memuat data rekam medis')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getBMICategory = (bmi: number): { text: string; color: string } => {
    if (bmi < 18.5) return { text: 'Kurus', color: 'blue' }
    if (bmi < 25) return { text: 'Normal', color: 'green' }
    if (bmi < 30) return { text: 'Gemuk', color: 'orange' }
    return { text: 'Obesitas', color: 'red' }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  if (!patientData || !patientData.nurseRecord) {
    return null
  }

  const { patient, queueNumber, poli, doctor, nurseRecord } = patientData
  const { vitalSigns, anamnesis, physicalExamination } = nurseRecord

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/dashboard/doctor-medical-records')}
        className="mb-4"
      >
        Kembali ke Daftar Pasien
      </Button>

      {/* Patient Info Card */}
      <Card className="mb-4" title="Informasi Pasien">
        <Row gutter={[16, 16]}>
          <Col span={4}>
            <div className="text-gray-500 text-sm">No. Antrian</div>
            <div className="text-3xl font-bold text-blue-600">{queueNumber}</div>
          </Col>
          <Col span={5}>
            <div className="text-gray-500 text-sm">No. Rekam Medis</div>
            <div className="text-lg font-semibold">{patient.medicalRecordNumber}</div>
          </Col>
          <Col span={5}>
            <div className="text-gray-500 text-sm">Nama Pasien</div>
            <div className="text-lg font-semibold">{patient.name}</div>
          </Col>
          <Col span={5}>
            <div className="text-gray-500 text-sm">Jenis Kelamin / Umur</div>
            <div className="text-lg">
              {patient.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'} / {patient.age} tahun
            </div>
          </Col>
          <Col span={5}>
            <div className="text-gray-500 text-sm">Poli</div>
            <div className="text-lg">{poli.name}</div>
          </Col>
          <Col span={6}>
            <div className="text-gray-500 text-sm">Dokter</div>
            <div className="text-lg">{doctor.name}</div>
          </Col>
          <Col span={6}>
            <div className="text-gray-500 text-sm">Perawat</div>
            <div className="text-lg">{nurseRecord.nurseName}</div>
          </Col>
        </Row>
      </Card>

      {/* Vital Signs Card */}
      <Card title="Tanda Vital (Vital Signs)" className="mb-4">
        <Descriptions bordered column={3}>
          <Descriptions.Item label="Tekanan Darah">
            <strong>
              {vitalSigns.systolicBloodPressure}/{vitalSigns.diastolicBloodPressure} mmHg
            </strong>
          </Descriptions.Item>
          <Descriptions.Item label="Suhu Tubuh">
            <strong>{vitalSigns.temperature}°C</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Nadi">
            <strong>{vitalSigns.pulseRate} bpm</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Pernapasan">
            <strong>{vitalSigns.respiratoryRate} /menit</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Tinggi Badan">
            <strong>{vitalSigns.height} cm</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Berat Badan">
            <strong>{vitalSigns.weight} kg</strong>
          </Descriptions.Item>
          <Descriptions.Item label="BMI (Body Mass Index)" span={2}>
            <Space>
              <strong>{vitalSigns.bmi}</strong>
              {vitalSigns.bmi && (
                <Tag color={getBMICategory(vitalSigns.bmi).color}>
                  {getBMICategory(vitalSigns.bmi).text}
                </Tag>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="SpO2">
            <strong>{vitalSigns.oxygenSaturation}%</strong>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Anamnesis Card */}
      <Card title="Anamnesis" className="mb-4">
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Keluhan Utama">{anamnesis.chiefComplaint}</Descriptions.Item>
          <Descriptions.Item label="Riwayat Penyakit Sekarang">
            {anamnesis.historyOfPresentIllness}
          </Descriptions.Item>
          {anamnesis.historyOfPastIllness && (
            <Descriptions.Item label="Riwayat Penyakit Dahulu">
              {anamnesis.historyOfPastIllness}
            </Descriptions.Item>
          )}
          {anamnesis.allergyHistory && (
            <Descriptions.Item label="Riwayat Alergi">{anamnesis.allergyHistory}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Physical Examination Card */}
      <Card title="Pemeriksaan Fisik" className="mb-4">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Kesadaran">
            <strong>{physicalExamination.consciousness}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Keadaan Umum">
            <strong>{physicalExamination.generalCondition}</strong>
          </Descriptions.Item>
          {physicalExamination.additionalNotes && (
            <Descriptions.Item label="Catatan Tambahan" span={2}>
              {physicalExamination.additionalNotes}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Action Buttons */}
      <Space>
        <Button
          type="primary"
          size="large"
          icon={<ArrowRightOutlined />}
          onClick={() => navigate(`/dashboard/doctor-procedures/${encounterId}`)}
        >
          Lanjut ke Tindakan
        </Button>
        <Button size="large" onClick={() => navigate('/dashboard/doctor-medical-records')}>
          Kembali
        </Button>
      </Space>
    </div>
  )
}

export default MedicalRecordDetail
