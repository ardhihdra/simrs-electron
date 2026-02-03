import { useState, useEffect } from 'react'
import { Button, App, Spin, Card } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router'
import { PatientQueue } from '../../types/nurse.types'
import { PatientStatus } from '../../types/nurse.types'
import { PatientInfoCard } from '../../components/molecules/PatientInfoCard'
import { InitialAssessmentForm } from '../../components/organisms/Assessment/InitialAssessmentForm'

const MedicalRecordForm = () => {
  const navigate = useNavigate()
  const { encounterId } = useParams<{ encounterId: string }>()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState<PatientQueue | null>(null)

  useEffect(() => {
    loadPatientData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterId])

  const loadPatientData = async () => {
    if (!encounterId) return

    setLoading(true)
    try {
      const fn = window.api?.query?.encounter?.getById
      if (!fn) throw new Error('API encounter tidak tersedia')

      const response = await fn({ id: encounterId })

      if (response.success && response.data) {
        const enc = response.data as any
        const validDate = enc.patient?.birthDate ? new Date(enc.patient.birthDate) : null
        const age = validDate ? new Date().getFullYear() - validDate.getFullYear() : 0

        const mappedData: PatientQueue = {
          id: enc.id,
          encounterId: enc.id,
          queueNumber: parseInt(enc.encounterCode?.split('-')?.[1] || '0'),
          patient: {
            id: enc.patient?.id || '',
            name: enc.patient?.name || 'Unknown',
            medicalRecordNumber: enc.patient?.medicalRecordNumber || '',
            gender: (enc.patient?.gender === 'male' ? 'MALE' : 'FEMALE') as any,
            birthDate: enc.patient?.birthDate || '',
            age: age,
            phone: '',
            address: '',
            identityNumber: enc.patient?.nik || ''
          },
          poli: {
            id: '1',
            code: 'POL',
            name: enc.serviceType ? String(enc.serviceType) : '-'
          },
          doctor: {
            id: 'doc1',
            name: 'Dr. Umum',
            specialization: 'General',
            sipNumber: '-'
          },
          status: PatientStatus.EXAMINING,
          registrationDate:
            typeof enc.visitDate === 'object'
              ? enc.visitDate.toISOString()
              : String(enc.visitDate || new Date().toISOString())
        }

        setPatientData(mappedData)
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  if (!patientData || !encounterId) {
    return null
  }

  return (
    <div className="p-4">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/dashboard/nurse-calling')}
        className="mb-4"
      >
        Kembali ke Antrian
      </Button>
      <Card>
        <div className="flex flex-col gap-4">
          <PatientInfoCard
            patientData={{
              ...patientData,
              visitDate: patientData.registrationDate,
              status: String(patientData.status)
            }}
          />

          <InitialAssessmentForm
            encounterId={encounterId}
            patientData={patientData}
            mode="outpatient"
            role="nurse"
          />
        </div>
      </Card>
    </div>
  )
}

export default MedicalRecordForm
