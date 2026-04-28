import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { App, Spin, Empty, Button, Modal, theme } from 'antd'
import { CheckCircleOutlined, LockOutlined } from '@ant-design/icons'
import { useAllergyByEncounter } from '@renderer/hooks/query/use-allergy'
import { useEncounterDetail } from '@renderer/hooks/query/use-encounter'
import { getPatientMedicalRecord } from '@renderer/services/doctor.service'
import { EncounterStatus, EncounterType } from '@shared/encounter'
import {
  EXAM_WINDOW_CLOSE_ALLOW_ONCE_CHANNEL,
  EXAM_WINDOW_CLOSE_REQUEST_CHANNEL
} from '@shared/window-close-guard'
import dayjs from 'dayjs'
import { PatientWithMedicalRecord } from '../../types/doctor.types'
import { Gender } from '../../types/nurse.types'
import { DoctorInpatientWorkspace } from './doctor-inpatient-workspace'
import { DoctorOutpatientWorkspace } from './doctor-outpatient-workspace'
import { DoctorEmergencyWorkspace } from './doctor-emergency-workspace'
import { showApiError } from '@renderer/utils/form-feedback'
import { client } from '@renderer/utils/client'
import {
  DesktopDispositionWorkflow,
  type DesktopDispositionConfirmPayload,
  type DesktopDispositionOption
} from '../../components/design-system/organisms/DesktopDispositionWorkflow'

const DOCTOR_DISPOSITION_OPTIONS: DesktopDispositionOption[] = [
  {
    key: 'pulang',
    label: 'Pulang',
    subtitle: 'Pulang ke rumah',
    dischargeDisposition: 'home',
    color: 'var(--ds-color-success)',
    softColor: 'color-mix(in srgb, var(--ds-color-success) 10%, white)',
    tone: 'success'
  },
  {
    key: 'rujuk-e',
    label: 'Rujuk',
    subtitle: 'Ke fasilitas kesehatan lain',
    dischargeDisposition: 'other-hcf',
    color: 'var(--ds-color-violet)',
    softColor: 'var(--ds-color-violet-soft)',
    tone: 'violet'
  },
  {
    key: 'meninggal',
    label: 'Meninggal',
    subtitle: 'Pasien dinyatakan meninggal',
    dischargeDisposition: 'exp',
    color: 'var(--ds-color-text-subtle)',
    softColor: 'var(--ds-color-surface-muted)',
    tone: 'neutral'
  },
  {
    key: 'paksa',
    label: 'Pulang Paksa',
    subtitle: 'Atas permintaan sendiri (APS)',
    dischargeDisposition: 'aadvice',
    color: 'var(--ds-color-warning)',
    softColor: 'color-mix(in srgb, var(--ds-color-warning) 12%, white)',
    tone: 'warning'
  }
]

const DOCTOR_DISPOSITION_BANNER_META = {
  label: 'DR',
  name: 'Dokter',
  colorName: 'EMR',
  badgeTone: 'accent' as const,
  background: 'var(--ds-color-accent-soft)',
  borderColor: 'var(--ds-color-accent)',
  color: 'var(--ds-color-accent)'
}

type DoctorWorkspaceVisitInfo = {
  poliName: string
  doctorName: string
  visitDate: string
  paymentMethod: string
}

type DoctorDischargeDisposition = 'home' | 'other-hcf' | 'exp' | 'aadvice'

type DoctorWorkspaceExtraFields = PatientWithMedicalRecord & {
  serviceType?: string
  doctorName?: string
  visitDate?: string | Date
}

const getDoctorWorkspaceVisitInfo = (data: PatientWithMedicalRecord): DoctorWorkspaceVisitInfo => {
  const extra = data as DoctorWorkspaceExtraFields

  return {
    poliName: extra.serviceType || 'Poli Umum',
    doctorName: extra.doctorName || 'Dr. Dokter',
    visitDate: extra.visitDate
      ? dayjs(extra.visitDate).format('DD MMM YYYY, HH:mm')
      : dayjs().format('DD MMM YYYY, HH:mm'),
    paymentMethod: data.paymentMethod || 'Umum'
  }
}

const DoctorWorkspace = () => {
  const { encounterId } = useParams<{ encounterId: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { token } = theme.useToken()

  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState<PatientWithMedicalRecord | null>(null)
  const [dispositionWorkflowOpen, setDispositionWorkflowOpen] = useState(false)
  const [closeReminderOpen, setCloseReminderOpen] = useState(false)
  const [closeAfterFinish, setCloseAfterFinish] = useState(false)
  const closeConfirmOpenRef = useRef(false)

  const { data: encounterDetail } = useEncounterDetail(encounterId)
  const dischargeEncounterMutation = client.registration.dischargeEncounter.useMutation()

  const { data: allergyData } = useAllergyByEncounter(encounterId || '')
  const currentStatus = encounterDetail?.result?.status || EncounterStatus.IN_PROGRESS

  const loadData = useCallback(async () => {
    if (!encounterId) return

    setLoading(true)
    try {
      const data = await getPatientMedicalRecord(encounterId)
      console.log('getPatientMedicalRecord', data)
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

  const allowCloseWindow = useCallback(() => {
    if (!window.electron?.ipcRenderer) {
      window.close()
      return
    }
    window.electron.ipcRenderer.send(EXAM_WINDOW_CLOSE_ALLOW_ONCE_CHANNEL)
  }, [])

  const closeCloseReminder = useCallback(() => {
    closeConfirmOpenRef.current = false
    setCloseReminderOpen(false)
  }, [])

  const closeWindowFromReminder = useCallback(() => {
    closeCloseReminder()
    allowCloseWindow()
  }, [allowCloseWindow, closeCloseReminder])

  const openDispositionWorkflow = useCallback((shouldCloseAfterFinish = false) => {
    setCloseAfterFinish(shouldCloseAfterFinish)
    setDispositionWorkflowOpen(true)
  }, [])

  const finishEncounterFromCloseReminder = useCallback(() => {
    closeCloseReminder()
    openDispositionWorkflow(true)
  }, [closeCloseReminder, openDispositionWorkflow])

  useEffect(() => {
    const removeListener = window.electron.ipcRenderer.on(EXAM_WINDOW_CLOSE_REQUEST_CHANNEL, () => {
      if (currentStatus !== EncounterStatus.IN_PROGRESS) {
        allowCloseWindow()
        return
      }

      if (closeConfirmOpenRef.current) {
        return
      }

      closeConfirmOpenRef.current = true
      setCloseReminderOpen(true)
    })

    return () => {
      setCloseReminderOpen(false)
      closeConfirmOpenRef.current = false
      removeListener()
    }
  }, [allowCloseWindow, currentStatus])

  const handleDispositionBack = useCallback(() => {
    setDispositionWorkflowOpen(false)
    setCloseAfterFinish(false)
  }, [])

  const handleDispositionConfirm = useCallback(
    async (payload: DesktopDispositionConfirmPayload) => {
      if (!encounterId) return

      try {
        await dischargeEncounterMutation.mutateAsync({
          id: encounterId,
          dischargeDisposition: payload.dischargeDisposition as DoctorDischargeDisposition,
          dischargeNote: payload.note || undefined
        })

        message.success('Pemeriksaan berhasil diselesaikan')
        setDispositionWorkflowOpen(false)
        await loadData()

        if (closeAfterFinish) {
          setCloseAfterFinish(false)
          allowCloseWindow()
        }
      } catch (error) {
        showApiError(message, error, 'Gagal menyelesaikan pemeriksaan')
      }
    },
    [allowCloseWindow, closeAfterFinish, dischargeEncounterMutation, encounterId, loadData, message]
  )

  const getEncounterTypeLabel = () => {
    if (encounterDetail?.result?.encounterType === EncounterType.IMP) return 'Rawat Inap'
    if (encounterDetail?.result?.encounterType === EncounterType.EMER) return 'IGD'
    return 'Rawat Jalan'
  }

  const getPatientGenderLabel = () => {
    if (patientData?.patient.gender === Gender.MALE) return 'Laki-laki'
    if (patientData?.patient.gender === Gender.FEMALE) return 'Perempuan'
    return '-'
  }

  const handleFinishEncounter = () => {
    openDispositionWorkflow(false)
  }

  const allergies =
    allergyData?.result && Array.isArray(allergyData.result) && allergyData.result.length > 0
      ? allergyData.result
          .map((a: { note?: string | null }) => a.note)
          .filter(Boolean)
          .join(', ')
      : '-'

  if (patientData && dispositionWorkflowOpen) {
    const patient = patientData.patient
    const age = patient.birthDate ? dayjs().diff(dayjs(patient.birthDate), 'year') : 0
    const encounterTypeLabel = getEncounterTypeLabel()
    const { poliName, doctorName, visitDate, paymentMethod } =
      getDoctorWorkspaceVisitInfo(patientData)

    return (
      <div className="h-screen overflow-auto px-4 py-4">
        <DesktopDispositionWorkflow
          patient={{
            name: patient.name || 'Unknown',
            registrationNumber: encounterId || '-',
            ageLabel: age ? `${age} th` : '-',
            paymentLabel: paymentMethod,
            statusLabel: `Encounter ${encounterTypeLabel}`
          }}
          bannerMeta={DOCTOR_DISPOSITION_BANNER_META}
          summaryItems={[
            { label: 'Encounter', value: encounterId || '-', mono: true },
            { label: 'No. RM', value: patient.medicalRecordNumber || '-', mono: true },
            { label: 'Umur', value: age ? `${age} tahun` : '-' },
            { label: 'Jenis Kelamin', value: getPatientGenderLabel() },
            { label: 'Unit', value: poliName },
            { label: 'Dokter', value: doctorName },
            { label: 'Tanggal Kunjungan', value: visitDate, mono: true },
            { label: 'Penjamin', value: paymentMethod },
            { label: 'Alergi', value: allergies }
          ]}
          options={DOCTOR_DISPOSITION_OPTIONS}
          breadcrumbItems={['Dokter', 'EMR']}
          title="Disposisi Pemeriksaan"
          resumeDocumentLabel="Resume Medis"
          backendNote="Detail field mockup seperti instruksi DPJP, obat pulang, penyebab kematian, dan data klinis tambahan sebagian besar masih UI; yang dikirim dari disposisi umum baru dischargeDisposition dan dischargeNote."
          isSubmitting={dischargeEncounterMutation.isPending}
          onBack={handleDispositionBack}
          onConfirm={handleDispositionConfirm}
        />
      </div>
    )
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

  const { poliName, doctorName, visitDate, paymentMethod } =
    getDoctorWorkspaceVisitInfo(patientData)

  const closeReminderStatusLabel =
    currentStatus === EncounterStatus.IN_PROGRESS
      ? 'Sedang Diperiksa'
      : String(currentStatus || '-')
  const normalizeAnthropometry = (value?: number | null): number | null =>
    typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
  const heightCm = normalizeAnthropometry(patientData.nurseRecord?.vitalSigns?.height)
  const weightKg = normalizeAnthropometry(patientData.nurseRecord?.vitalSigns?.weight)

  const patientInfoCardData = {
    patient: {
      medicalRecordNumber: patient.medicalRecordNumber || '-',
      name: patient.name || 'Unknown',
      nik: patient.identityNumber || '-',
      gender: patient.gender === Gender.MALE ? 'MALE' : 'FEMALE',
      age: age,
      identityNumber: patient.identityNumber || '-',
      heightCm,
      weightKg,
      pregnancyStatus: patientData.pregnancyStatus || '-'
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

  const SelesaikanPemeriksaanButton = () => {
    return (
      <Button
        type="primary"
        onClick={handleFinishEncounter}
        icon={<CheckCircleOutlined />}
        size="small"
      >
        Selesaikan Pemeriksaan
      </Button>
    )
  }

  return (
    <div className="flex flex-col h-screen rounded-lg overflow-hidden">
      <div className="flex-1 px-4 py-4 overflow-hidden relative flex flex-col min-h-0">
        <Modal
          open={closeReminderOpen}
          centered
          onCancel={closeCloseReminder}
          width={620}
          title="Tutup halaman pemeriksaan?"
          styles={{ body: { paddingTop: 8 } }}
          okButtonProps={{ style: { display: 'none' } }}
          cancelButtonProps={{ style: { display: 'none' } }}
          footer={
            <div className="flex w-full justify-end gap-2">
              <Button onClick={closeCloseReminder}>Kembali</Button>
              <Button onClick={closeWindowFromReminder}>Tutup Halaman</Button>
              <Button type="primary" onClick={finishEncounterFromCloseReminder}>
                Selesaikan Pemeriksaan
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div
              className="rounded-xl border px-4 py-3"
              style={{
                background: token.colorFillAlter,
                borderColor: token.colorBorderSecondary
              }}
            >
              <p className="m-0 text-sm font-medium" style={{ color: token.colorText }}>
                Pastikan status pemeriksaan sudah sesuai sebelum menutup halaman.
              </p>
              <div
                className="inline-flex mt-2 px-2.5 py-1 rounded-md font-mono text-xs font-semibold"
                style={{
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  color: token.colorText
                }}
              >
                Status saat ini: {closeReminderStatusLabel}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div
                className="rounded-lg border px-3 py-2.5"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer
                }}
              >
                <div className="text-sm font-semibold" style={{ color: token.colorText }}>
                  Kembali
                </div>
                <div className="text-xs" style={{ color: token.colorTextSecondary }}>
                  Lanjutkan pengisian pemeriksaan tanpa menutup halaman.
                </div>
              </div>
              <div
                className="rounded-lg border px-3 py-2.5"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer
                }}
              >
                <div className="text-sm font-semibold" style={{ color: token.colorText }}>
                  Tutup Halaman
                </div>
                <div className="text-xs" style={{ color: token.colorTextSecondary }}>
                  Keluar sekarang tanpa mengubah status pemeriksaan.
                </div>
              </div>
              <div
                className="rounded-lg border px-3 py-2.5"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer
                }}
              >
                <div className="text-sm font-semibold" style={{ color: token.colorText }}>
                  Selesaikan Pemeriksaan
                </div>
                <div className="text-xs" style={{ color: token.colorTextSecondary }}>
                  Buka form disposisi, lalu tutup halaman otomatis setelah selesai.
                </div>
              </div>
            </div>
          </div>
        </Modal>

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
                <SelesaikanPemeriksaanButton />
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
                <SelesaikanPemeriksaanButton />
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
                <SelesaikanPemeriksaanButton />
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  )
}

export default DoctorWorkspace
