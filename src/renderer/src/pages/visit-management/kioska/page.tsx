import { ArrowLeftOutlined } from '@ant-design/icons'
import { Visibility } from '@renderer/components/atoms/Visibility'
import { App, Button, Input, theme, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { KioskSelectDoctor } from './components/kiosk-select-doctor'
import { KioskSelectPoli } from './components/kiosk-select-poli'
import { fetchKioskaPatients, registerKioskaQueue } from './public-client'

type AntrianType = 'rawat_jalan' | 'rawat_inap' | 'penunjang' | 'checkin'

type Step =
  | 'antrian_type'
  | 'has_mrn'
  | 'scan_mrn'
  | 'poli'
  | 'dokter'
  | 'ambil_antrian'
  | 'input_kode_antrian'

const antrianTypeData: { label: string; value: AntrianType }[] = [
  { label: 'Rawat Jalan', value: 'rawat_jalan' },
  { label: 'Rawat Inap', value: 'rawat_inap' },
  { label: 'Pemeriksaan Penunjang', value: 'penunjang' },
  { label: 'Check-in', value: 'checkin' }
]

export default function KioskaGlobalPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { token } = theme.useToken()

  const [step, setStep] = useState<Step>('antrian_type')
  const [stepHistory, setStepHistory] = useState<Step[]>([])

  const [antrianType, setAntrianType] = useState<AntrianType>('rawat_jalan')
  const [hasMrn, setHasMrn] = useState<boolean | null>(null)

  const [kodeAntrian, setKodeAntrian] = useState('')

  // rawat jalan state
  const [mrn, setMrn] = useState('')
  const [doctorId, setDoctorId] = useState<number | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [poli, setPoli] = useState<any>(null)

  const [matchedPatient, setMatchedPatient] = useState<any>(null)
  const [isResolvingPatient, setIsResolvingPatient] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const kioskGradient = `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`

  // ===== resolve patient =====
  useEffect(() => {
    const normalizedMrn = String(mrn || '').trim()

    if (!normalizedMrn) {
      setMatchedPatient(null)
      setIsResolvingPatient(false)
      return
    }

    let cancelled = false

    const timer = setTimeout(() => {
      void (async () => {
        try {
          setIsResolvingPatient(true)

          const patients = await fetchKioskaPatients({
            medicalRecordNumber: normalizedMrn
          })

          if (cancelled) return

          const exactMatch =
            patients.find(
              (p) =>
                String(p.medicalRecordNumber || '')
                  .trim()
                  .toLowerCase() === normalizedMrn.toLowerCase()
            ) ||
            patients[0] ||
            null

          setMatchedPatient(exactMatch)
        } catch (error: any) {
          if (cancelled) return
          setMatchedPatient(null)
          message.error(error?.message || 'Gagal mencari data pasien')
        } finally {
          if (!cancelled) setIsResolvingPatient(false)
        }
      })()
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [mrn, message])

  // ===== summary =====
  const formatStepSummary = () => {
    if (antrianType !== 'rawat_jalan') return null

    const parts: string[] = []

    if (mrn) parts.push(mrn)
    if (poli?.name) parts.push(poli.name)
    if (selectedDoctor?.doctorName) parts.push(selectedDoctor.doctorName)

    return parts.length ? parts.join(' → ') : null
  }

  // ===== navigation =====
  const goTo = (next: Step) => {
    setStepHistory((prev) => [...prev, step])
    setStep(next)
  }

  const goBack = () => {
    setStepHistory((prev) => {
      if (!prev.length) return prev
      const next = [...prev]
      const last = next.pop()
      if (last) setStep(last)
      return next
    })
  }

  const resetFlow = () => {
    setStep('antrian_type')
    setStepHistory([])
    setMrn('')
    setKodeAntrian('')
    setHasMrn(null)
    setPoli(null)
    setDoctorId(null)
    setSelectedDoctor(null)
    setMatchedPatient(null)
  }

  // ===== handlers =====
  const handleSelectAntrianType = (type: AntrianType) => {
    setAntrianType(type)

    if (type === 'rawat_jalan') {
      goTo('has_mrn')
      return
    }

    if (type === 'checkin') {
      goTo('input_kode_antrian')
      return
    }

    message.info('Fitur belum tersedia')
  }

  const handleHasMrn = (value: boolean) => {
    setHasMrn(value)

    if (value) {
      goTo('scan_mrn')
      return
    }

    goTo('ambil_antrian')
  }

  const handleSubmitMrn = () => {
    if (!mrn) {
      message.error('MRN wajib diisi')
      return
    }

    goTo('poli')
  }

  const handleSubmitCheckin = async () => {
    if (!kodeAntrian) {
      message.error('Kode antrian wajib diisi')
      return
    }

    message.success('Check-in berhasil')
    resetFlow()
  }

  // ===== CREATE ANTRIAN (UPDATED) =====
  const handleAmbilAntrian = async () => {
    try {
      if (isSubmitting) return

      const queueDate = new Date().toISOString()
      const normalizedMrn = String(mrn || '').trim()

      if (!poli) {
        message.error('Poli wajib dipilih')
        return
      }

      if (!selectedDoctor) {
        message.error('Dokter wajib dipilih')
        return
      }

      if (normalizedMrn && !matchedPatient?.id) {
        message.error('Pasien tidak ditemukan')
        return
      }

      setIsSubmitting(true)

      const result = await registerKioskaQueue({
        queueDate,
        visitDate: queueDate,
        practitionerId: Number(selectedDoctor.doctorId),
        doctorScheduleId: Number(selectedDoctor.doctorScheduleId),
        patientId: matchedPatient?.id,
        registrationType: 'OFFLINE',
        paymentMethod: 'CASH',
        reason: 'Registrasi Kioska',
        notes: normalizedMrn ? `KIOSKA_MRN:${normalizedMrn}` : undefined
      })

      message.success(`Nomor antrian berhasil diambil dengan nomor ${JSON.stringify(result)}`)

      resetFlow()
    } catch (error: any) {
      message.error(error?.message || 'Gagal mengambil antrian')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ===== render =====
  return (
    <div
      className="h-screen flex flex-col items-center justify-between p-4"
      style={{ background: kioskGradient }}
    >
      <div className="rounded bg-white p-4 w-full">
        <Typography.Title level={1}>Ambil Nomor Antrian</Typography.Title>
      </div>

      <div className="rounded-2xl bg-white p-4 w-1/2 grid gap-8 min-h-60 shadow">
        {step !== 'antrian_type' && (
          <div className="flex items-center justify-between gap-4">
            <Button size="large" onClick={goBack} icon={<ArrowLeftOutlined />}>
              Kembali
            </Button>

            {formatStepSummary() && (
              <div className="flex-1 text-right text-sm text-gray-500 font-medium truncate">
                {formatStepSummary()}
              </div>
            )}
          </div>
        )}

        <Visibility visible={step === 'antrian_type'}>
          <div className="grid grid-cols-2 gap-4">
            {antrianTypeData.map((item) => (
              <Button
                key={item.value}
                size="large"
                className="h-36! text-2xl!"
                onClick={() => handleSelectAntrianType(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </Visibility>

        <Visibility visible={step === 'has_mrn'}>
          <div className="flex flex-col gap-4">
            <Typography.Title level={3}>Apakah Anda punya MRN?</Typography.Title>
            <div className="flex gap-4">
              <Button className="w-full h-24!" onClick={() => handleHasMrn(true)}>
                Ya
              </Button>
              <Button className="w-full h-24!" onClick={() => handleHasMrn(false)}>
                Tidak
              </Button>
            </div>
          </div>
        </Visibility>

        <Visibility visible={step === 'scan_mrn'}>
          <div className="flex flex-col gap-4">
            <Typography.Title level={3}>Scan / Input MRN</Typography.Title>
            <Input value={mrn} onChange={(e) => setMrn(e.target.value)} />

            {isResolvingPatient && (
              <Typography.Text type="secondary">Mencari pasien...</Typography.Text>
            )}

            {mrn && !isResolvingPatient && !matchedPatient && (
              <Typography.Text type="danger">Pasien tidak ditemukan</Typography.Text>
            )}

            <Button type="primary" onClick={handleSubmitMrn}>
              Lanjut
            </Button>
          </div>
        </Visibility>

        <Visibility visible={step === 'poli'}>
          <KioskSelectPoli
            onSelect={(poli: any) => {
              setPoli(poli)
              goTo('dokter')
            }}
          />
        </Visibility>

        <Visibility visible={step === 'dokter'}>
          <KioskSelectDoctor
            poliId={poli?.id}
            onChange={(doctorScheduleId, doctor) => {
              setDoctorId(doctor.doctorId)
              setSelectedDoctor(doctor)
              goTo('ambil_antrian')
            }}
          />
        </Visibility>

        <Visibility visible={step === 'ambil_antrian'}>
          <Button
            loading={isSubmitting}
            type="primary"
            className="h-20 text-xl"
            onClick={handleAmbilAntrian}
          >
            Ambil Nomor
          </Button>
        </Visibility>

        <Visibility visible={step === 'input_kode_antrian'}>
          <div className="flex flex-col gap-4">
            <Input value={kodeAntrian} onChange={(e) => setKodeAntrian(e.target.value)} />
            <Button type="primary" onClick={handleSubmitCheckin}>
              Check-in
            </Button>
          </div>
        </Visibility>
      </div>

      <div className="rounded bg-white p-4">
        <Typography.Text>Ikuti instruksi di layar</Typography.Text>
      </div>
    </div>
  )
}
