import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { App, Spin, Empty, Button, Modal, Select } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { getPatientMedicalRecord } from '@renderer/services/doctor.service'
import { PatientWithMedicalRecord } from '../../types/doctor.types'
import dayjs from 'dayjs'
import { Gender } from '../../types/nurse.types'
import { useEncounterDetail, useUpdateEncounter } from '@renderer/hooks/query/use-encounter'
import { useAllergyByEncounter } from '@renderer/hooks/query/use-allergy'
import { EncounterStatus, EncounterType, ArrivalType } from '@shared/encounter'
import { DoctorInpatientWorkspace } from './doctor-inpatient-workspace'
import { DoctorOutpatientWorkspace } from './doctor-outpatient-workspace'
import { DoctorEmergencyWorkspace } from './doctor-emergency-workspace'

const DoctorWorkspace = () => {
  const { encounterId } = useParams<{ encounterId: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState<PatientWithMedicalRecord | null>(null)
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<EncounterStatus | null>(null)

  const { data: encounterDetail } = useEncounterDetail(encounterId)
  const updateEncounter = useUpdateEncounter()

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
      message.error('Gagal memuat data medis pasien')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [encounterId, message, navigate])

  useEffect(() => {
    loadData()
  }, [encounterId, loadData])

  const handleStatusUpdate = () => {
    if (!encounterId || !selectedStatus) return

    updateEncounter.mutate(
      {
        id: encounterId,
        status: selectedStatus,
        patientId: patientData?.patient.id || '',
        visitDate: new Date(),
        serviceType: 'outpatient',
        encounterType: EncounterType.AMB,
        arrivalType: ArrivalType.WALK_IN,
        endTime: null,
        startTime: new Date(),
      },
      {
        onSuccess: () => {
          message.success('Status berhasil diperbarui')
          setIsStatusModalVisible(false)
        },
        onError: () => {
          message.error('Gagal memperbarui status')
        }
      }
    )
  }

  const openStatusModal = () => {
    if (encounterDetail?.result?.status) {
      setSelectedStatus(encounterDetail.result.status as EncounterStatus)
    }
    setIsStatusModalVisible(true)
  }

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
            onEditStatus={openStatusModal}
          />
        ) : encounterDetail?.result?.encounterType === EncounterType.EMER ? (
          <DoctorEmergencyWorkspace
            encounterId={encounterId || ''}
            patientData={patientData}
            patientInfoCardData={patientInfoCardData}
            onEditStatus={openStatusModal}
          />
        ) : (
          <DoctorOutpatientWorkspace
            encounterId={encounterId || ''}
            patientData={patientData}
            patientInfoCardData={patientInfoCardData}
            onEditStatus={openStatusModal}
          />
        )}
      </div>

      <Modal
        title="Update Status Encounter"
        open={isStatusModalVisible}
        onOk={handleStatusUpdate}
        onCancel={() => setIsStatusModalVisible(false)}
        confirmLoading={updateEncounter.isPending}
        okText="Simpan"
        cancelText="Batal"
      >
        <div className="py-4">
          <p className="mb-2">Pilih status baru untuk kunjungan ini:</p>
          <Select
            value={selectedStatus}
            onChange={(val) => setSelectedStatus(val as EncounterStatus)}
            style={{ width: '100%' }}
            options={[
              { label: 'Finished', value: EncounterStatus.FINISHED },
              { label: 'Cancelled', value: EncounterStatus.CANCELLED }
            ]}
          />
        </div>
      </Modal>
    </div>
  )
}

export default DoctorWorkspace
