import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { App, Spin, Empty, Button } from 'antd'
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { getPatientMedicalRecord } from '@renderer/services/doctor.service'
import { PatientWithMedicalRecord } from '../../types/doctor.types'
import { Gender } from '../../types/nurse.types'
import dayjs from 'dayjs'
import { useEncounterDetail } from '@renderer/hooks/query/use-encounter'
import { useAllergyByEncounter } from '@renderer/hooks/query/use-allergy'
import { EncounterStatus, EncounterType } from '@shared/encounter'
import { DoctorInpatientWorkspace } from './doctor-inpatient-workspace'
import { DoctorOutpatientWorkspace } from './doctor-outpatient-workspace'
import { DoctorEmergencyWorkspace } from './doctor-emergency-workspace'
import DischargeModal from '@renderer/components/organisms/visit-management/DischargeModal'
import { showApiError } from '@renderer/utils/form-feedback'

const DoctorWorkspace = () => {
  const { encounterId } = useParams<{ encounterId: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState<PatientWithMedicalRecord | null>(null)
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false)

  const { data: encounterDetail } = useEncounterDetail(encounterId)

  const { data: allergyData } = useAllergyByEncounter(encounterId || '')

  const loadData = useCallback(async () => {
    if (!encounterId) return

    setLoading(true)
    try {
      const data = await getPatientMedicalRecord(encounterId)
      if (data) {
        setPatientData(data)
      } else {
        message.error('Data pasien tidak ditemukan')
        navigate('/dashboard/doctor')
      }
    } catch (error) {
      showApiError(message, error, 'Gagal memuat data medis pasien')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [encounterId, message, navigate])

  useEffect(() => {
    loadData()
  }, [encounterId, loadData])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Memuat Rekam Medis..." />
      </div>
    )
  }

  if (!patientData) {
    return <Empty description="Data pasien tidak ditemukan" />
  }

  const handleBack = () => {
    navigate('/dashboard/doctor')
  }

  const handleFinishEncounter = () => {
    setDischargeModalOpen(true)
  }

  const patient = patientData.patient
  const age = patient.birthDate ? dayjs().diff(dayjs(patient.birthDate), 'year') : 0

  const poliName = (patientData as any).serviceType || 'Poli Umum'
  const doctorName = (patientData as any).doctorName || 'Dr. Dokter'
  const visitDate = (patientData as any).visitDate
    ? dayjs((patientData as any).visitDate).format('DD MMM YYYY, HH:mm')
    : dayjs().format('DD MMM YYYY, HH:mm')
  const paymentMethod = patientData.paymentMethod || 'Umum'

  const allergies =
    allergyData?.result && Array.isArray(allergyData.result) && allergyData.result.length > 0
      ? allergyData.result
        .map((a: any) => a.note)
        .filter(Boolean)
        .join(', ')
      : '-'

  const currentStatus = encounterDetail?.result?.status || EncounterStatus.IN_PROGRESS

  const patientInfoCardData = {
    patient: {
      medicalRecordNumber: patient.medicalRecordNumber || '-',
      name: patient.name || 'Unknown',
      gender: patient.gender === Gender.MALE ? 'MALE' : 'FEMALE',
      age: age,
      identityNumber: patient.identityNumber || '-'
    },
    poli: {
      name: poliName
    },
    doctor: {
      name: doctorName
    },
    visitDate: visitDate,
    paymentMethod: paymentMethod,
    status: currentStatus,
    allergies: allergies
  }

  return (
    <div className="flex flex-col h-screen rounded-lg overflow-hidden">
      <div className="flex-1 px-4 py-4 overflow-hidden relative flex flex-col min-h-0">
        {currentStatus === EncounterStatus.FINISHED && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-[2px] rounded-lg">
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md">
              <LockOutlined className="text-5xl text-red-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Pemeriksaan Selesai</h3>
              <p className="text-gray-600 mb-6">
                Encounter ini telah diselesaikan. Formulir dikunci dan tidak dapat diubah lagi.
              </p>
              <Button
                type="primary"
                onClick={() => {
                  handleBack()
                }}
              >
                Kembali ke Dashboard
              </Button>
            </div>
          </div>
        )}

        {encounterDetail?.result?.encounterType === EncounterType.IMP ? (
          <DoctorInpatientWorkspace
            encounterId={encounterId || ''}
            patientData={patientData}
            patientInfoCardData={patientInfoCardData}
            action={
              currentStatus === EncounterStatus.IN_PROGRESS ? (
                <Button
                  type="primary"
                  onClick={handleFinishEncounter}
                  icon={<CheckCircleOutlined />}
                  size="small"
                >
                  Selesaikan Pemeriksaan
                </Button>
              ) : undefined
            }
          />
        ) : encounterDetail?.result?.encounterType === EncounterType.EMER ? (
          <DoctorEmergencyWorkspace
            encounterId={encounterId || ''}
            patientData={patientData}
            patientInfoCardData={patientInfoCardData}
            action={
              currentStatus === EncounterStatus.IN_PROGRESS ? (
                <Button
                  type="primary"
                  onClick={handleFinishEncounter}
                  icon={<CheckCircleOutlined />}
                  size="small"
                >
                  Selesaikan Pemeriksaan
                </Button>
              ) : undefined
            }
          />
        ) : (
          <DoctorOutpatientWorkspace
            encounterId={encounterId || ''}
            patientData={patientData}
            patientInfoCardData={patientInfoCardData}
            action={
              currentStatus === EncounterStatus.IN_PROGRESS ? (
                <Button
                  type="primary"
                  onClick={handleFinishEncounter}
                  icon={<CheckCircleOutlined />}
                  size="small"
                >
                  Selesaikan Pemeriksaan
                </Button>
              ) : undefined
            }
          />
        )}
      </div>

      <DischargeModal
        open={dischargeModalOpen}
        record={{ patientName: patientData?.patient?.name, encounterId }}
        onClose={() => setDischargeModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  )
}

export default DoctorWorkspace
