import { useState, useEffect } from 'react'
import { Card, Row, Col, Descriptions, Button, Spin, Space, Tag, App } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router'
import { useObservationByEncounter } from '../../hooks/query/use-observation'

interface VitalSigns {
  systolicBloodPressure?: number
  diastolicBloodPressure?: number
  bloodPressureBodySite?: string
  bloodPressurePosition?: string
  temperature?: number
  temperatureMethod?: string
  pulseRate?: number
  pulseRateBodySite?: string
  respiratoryRate?: number
  height?: number
  weight?: number
  bmi?: number
  oxygenSaturation?: number
}

interface Anamnesis {
  chiefComplaint?: string
  historyOfPresentIllness?: string
  historyOfPastIllness?: string
  allergyHistory?: string
}

interface PhysicalExamination {
  consciousness?: string
  generalCondition?: string
  additionalNotes?: string
}

interface PatientData {
  id: string
  encounterId: string
  queueNumber: number
  patient: {
    id: string
    name: string
    medicalRecordNumber: string
    gender: 'male' | 'female'
    age: number
  }
  poli: {
    name: string
  }
  doctor: {
    name: string
  }
}

const MedicalRecordDetail = () => {
  const navigate = useNavigate()
  const { encounterId } = useParams<{ encounterId: string }>()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({})
  const [anamnesis, setAnamnesis] = useState<Anamnesis>({})
  const [physicalExamination, setPhysicalExamination] = useState<PhysicalExamination>({})

  // Fetch observations
  const { data: observationsData, isLoading: observationsLoading } =
    useObservationByEncounter(encounterId)

  useEffect(() => {
    loadEncounterData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterId])

  useEffect(() => {
    if (observationsData?.success && observationsData?.result) {
      transformObservations(observationsData.result)
    }
  }, [observationsData])

  const loadEncounterData = async () => {
    if (!encounterId) return

    setLoading(true)
    try {
      const fn = window.api?.query?.encounter?.getById
      if (!fn) throw new Error('API encounter tidak tersedia')

      const response = await fn({ id: encounterId })

      if (response.success && response.data) {
        const enc = response.data as any

        // Calculate age
        const validDate = enc.patient?.birthDate ? new Date(enc.patient.birthDate) : null
        const age = validDate ? new Date().getFullYear() - validDate.getFullYear() : 0

        const mappedData: PatientData = {
          id: enc.id,
          encounterId: enc.id,
          queueNumber: parseInt(enc.encounterCode?.split('-')?.[1] || '0'),
          patient: {
            id: enc.patient?.id || '',
            name: enc.patient?.name || 'Unknown',
            medicalRecordNumber: enc.patient?.medicalRecordNumber || '',
            gender: (enc.patient?.gender === 'male' ? 'male' : 'female') as any,
            age: age
          },
          poli: {
            name: enc.serviceType ? String(enc.serviceType) : '-'
          },
          doctor: {
            name: 'Dr. Umum' // TODO: Get from encounter data
          }
        }

        setPatientData(mappedData)
      } else {
        message.error('Data pasien tidak ditemukan')
        navigate('/dashboard/doctor-medical-records')
      }
    } catch (error) {
      message.error('Gagal memuat data encounter')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const transformObservations = (result: any) => {
    const { grouped } = result
    const vital: VitalSigns = {}
    const anam: Anamnesis = {}
    const physExam: PhysicalExamination = {}

    // Transform vital signs
    if (grouped?.vitalSigns) {
      grouped.vitalSigns.forEach((obs: any) => {
        const code = obs.codeCoding?.[0]?.code

        switch (code) {
          case '8480-6': // Systolic BP
            vital.systolicBloodPressure = obs.valueQuantity?.value
            break
          case '8462-4': // Diastolic BP
            vital.diastolicBloodPressure = obs.valueQuantity?.value
            break
          case '8310-5': // Temperature
            vital.temperature = obs.valueQuantity?.value
            break
          case '8867-4': // Heart rate
            vital.pulseRate = obs.valueQuantity?.value
            break
          case '9279-1': // Respiratory rate
            vital.respiratoryRate = obs.valueQuantity?.value
            break
          case '8302-2': // Height
            vital.height = obs.valueQuantity?.value
            break
          case '29463-7': // Weight
            vital.weight = obs.valueQuantity?.value
            break
          case '39156-5': // BMI
            vital.bmi = obs.valueQuantity?.value
            break
          case '2708-6': // Oxygen saturation
            vital.oxygenSaturation = obs.valueQuantity?.value
            break
        }
      })
    }

    // Transform anamnesis
    if (grouped?.anamnesis) {
      grouped.anamnesis.forEach((obs: any) => {
        const code = obs.codeCoding?.[0]?.code

        switch (code) {
          case 'chief-complaint':
            anam.chiefComplaint = obs.valueString
            break
          case 'history-present-illness':
            anam.historyOfPresentIllness = obs.valueString
            break
          case 'history-past-illness':
            anam.historyOfPastIllness = obs.valueString
            break
          case 'allergy-history':
            anam.allergyHistory = obs.valueString
            break
        }
      })
    }

    // Transform physical examination
    if (grouped?.physicalExam) {
      grouped.physicalExam.forEach((obs: any) => {
        const code = obs.codeCoding?.[0]?.code

        switch (code) {
          case 'consciousness':
            physExam.consciousness = obs.valueString
            break
          case 'general-condition':
            physExam.generalCondition = obs.valueString
            break
          case 'physical-exam-notes':
            physExam.additionalNotes = obs.valueString
            break
        }
      })
    }

    setVitalSigns(vital)
    setAnamnesis(anam)
    setPhysicalExamination(physExam)
  }

  const getBMICategory = (bmi: number): { text: string; color: string } => {
    if (bmi < 18.5) return { text: 'Kurus', color: 'blue' }
    if (bmi < 25) return { text: 'Normal', color: 'green' }
    if (bmi < 30) return { text: 'Gemuk', color: 'orange' }
    return { text: 'Obesitas', color: 'red' }
  }

  if (loading || observationsLoading) {
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
            <div className="text-3xl font-bold text-blue-600">{patientData.queueNumber}</div>
          </Col>
          <Col span={5}>
            <div className="text-gray-500 text-sm">No. Rekam Medis</div>
            <div className="text-lg font-semibold">{patientData.patient.medicalRecordNumber}</div>
          </Col>
          <Col span={5}>
            <div className="text-gray-500 text-sm">Nama Pasien</div>
            <div className="text-lg font-semibold">{patientData.patient.name}</div>
          </Col>
          <Col span={5}>
            <div className="text-gray-500 text-sm">Jenis Kelamin / Umur</div>
            <div className="text-lg">
              {patientData.patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'} /{' '}
              {patientData.patient.age} tahun
            </div>
          </Col>
          <Col span={5}>
            <div className="text-gray-500 text-sm">Poli</div>
            <div className="text-lg">{patientData.poli.name}</div>
          </Col>
        </Row>
      </Card>

      {/* Vital Signs Card */}
      <Card title="Tanda Vital (Vital Signs)" className="mb-4">
        <Descriptions bordered column={3}>
          {vitalSigns.systolicBloodPressure && vitalSigns.diastolicBloodPressure && (
            <Descriptions.Item label="Tekanan Darah">
              <strong>
                {vitalSigns.systolicBloodPressure}/{vitalSigns.diastolicBloodPressure} mmHg
              </strong>
            </Descriptions.Item>
          )}
          {vitalSigns.temperature && (
            <Descriptions.Item label="Suhu Tubuh">
              <strong>{vitalSigns.temperature}°C</strong>
            </Descriptions.Item>
          )}
          {vitalSigns.pulseRate && (
            <Descriptions.Item label="Nadi">
              <strong>{vitalSigns.pulseRate} bpm</strong>
            </Descriptions.Item>
          )}
          {vitalSigns.respiratoryRate && (
            <Descriptions.Item label="Pernapasan">
              <strong>{vitalSigns.respiratoryRate} /menit</strong>
            </Descriptions.Item>
          )}
          {vitalSigns.height && (
            <Descriptions.Item label="Tinggi Badan">
              <strong>{vitalSigns.height} cm</strong>
            </Descriptions.Item>
          )}
          {vitalSigns.weight && (
            <Descriptions.Item label="Berat Badan">
              <strong>{vitalSigns.weight} kg</strong>
            </Descriptions.Item>
          )}
          {vitalSigns.bmi && (
            <Descriptions.Item label="BMI (Body Mass Index)" span={2}>
              <Space>
                <strong>{vitalSigns.bmi}</strong>
                <Tag color={getBMICategory(vitalSigns.bmi).color}>
                  {getBMICategory(vitalSigns.bmi).text}
                </Tag>
              </Space>
            </Descriptions.Item>
          )}
          {vitalSigns.oxygenSaturation && (
            <Descriptions.Item label="SpO2">
              <strong>{vitalSigns.oxygenSaturation}%</strong>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Anamnesis Card */}
      <Card title="Anamnesis" className="mb-4">
        <Descriptions bordered column={1}>
          {anamnesis.chiefComplaint && (
            <Descriptions.Item label="Keluhan Utama">{anamnesis.chiefComplaint}</Descriptions.Item>
          )}
          {anamnesis.historyOfPresentIllness && (
            <Descriptions.Item label="Riwayat Penyakit Sekarang">
              {anamnesis.historyOfPresentIllness}
            </Descriptions.Item>
          )}
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
          {physicalExamination.consciousness && (
            <Descriptions.Item label="Kesadaran">
              <strong>{physicalExamination.consciousness}</strong>
            </Descriptions.Item>
          )}
          {physicalExamination.generalCondition && (
            <Descriptions.Item label="Keadaan Umum">
              <strong>{physicalExamination.generalCondition}</strong>
            </Descriptions.Item>
          )}
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
