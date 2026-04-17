import { Button, Descriptions, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useLocation } from 'react-router'

import { calculateAge } from '@renderer/utils/calculateAge'

import { createKioskaRegistrationTicket, registerKioskaQueue } from '../../public-client'
import { KioskFeedbackOverlay } from '../components/kiosk-feedback-overlay'
import { useKioskaGlobalFlow } from '../kioska-global-context'
import {
  createKioskaRegistrationTicketPayload,
  resolveInitialKioskaRegistrationPaymentMethodFromPath,
  resolveKioskaRegistrationServiceTypeFromPaymentMethod
} from '../kioska-queue-submission'

export function StepQueueSummary() {
  const { resetFlow, state } = useKioskaGlobalFlow()
  const location = useLocation()
  const initialPaymentMethod = resolveInitialKioskaRegistrationPaymentMethodFromPath(location.pathname)
  const paymentMethod = state.rawatJalan.paymentMethod ?? initialPaymentMethod
  const registrationServiceType =
    resolveKioskaRegistrationServiceTypeFromPaymentMethod(paymentMethod)
  const isInsuranceRegistration = paymentMethod === 'ASURANSI'

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error'
    title: string
    message: string
  } | null>(null)
  const isRegistrationTicket = state.rawatJalan.hasMrn === false

  const handleSubmit = async () => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)

      if (isRegistrationTicket) {
        if (!state.rawatJalan.location?.id) {
          throw new Error('Lokasi kerja pendaftaran belum tersedia untuk kioska.')
        }

        const result = await createKioskaRegistrationTicket(
          createKioskaRegistrationTicketPayload(
            state.rawatJalan.location.id,
            dayjs().format('YYYY-MM-DD'),
            registrationServiceType
          )
        )

        setFeedback({
          tone: 'success',
          title: 'Nomor Pendaftaran Berhasil Diambil',
          message: `Nomor antrian pendaftaran Anda adalah ${result.ticketNo || '-'}. Silakan menuju loket ${
            isInsuranceRegistration ? 'pendaftaran asuransi' : 'pendaftaran'
          }.`
        })
        return
      }

      if (!paymentMethod) {
        throw new Error('Silakan pilih metode pembayaran terlebih dahulu.')
      }

      if (!state.rawatJalan.poli) {
        throw new Error('Silakan pilih poli terlebih dahulu sebelum mengambil nomor antrian.')
      }

      if (!state.rawatJalan.selectedDoctor) {
        throw new Error('Silakan pilih dokter terlebih dahulu sebelum mengambil nomor antrian.')
      }

      const normalizedMrn = state.rawatJalan.mrn.trim()
      if (normalizedMrn && !state.rawatJalan.matchedPatient?.id) {
        throw new Error('Periksa kembali MRN pasien sebelum melanjutkan proses antrian.')
      }

      const queueDate = new Date().toISOString()
      const result = await registerKioskaQueue({
        queueDate,
        visitDate: queueDate,
        practitionerId: Number(state.rawatJalan.selectedDoctor.doctorId),
        doctorScheduleId: Number(state.rawatJalan.selectedDoctor.doctorScheduleId),
        patientId: state.rawatJalan.matchedPatient?.id,
        registrationType: 'OFFLINE',
        paymentMethod,
        reason: 'Registrasi Kioska',
        notes: normalizedMrn ? `KIOSKA_MRN:${normalizedMrn}` : undefined
      })

      setFeedback({
        tone: 'success',
        title: 'Nomor Antrian Berhasil Diambil',
        message: `Nomor antrian Anda adalah ${result.queueNumber}. Silakan tunggu panggilan berikutnya.`
      })
    } catch (error) {
      setFeedback({
        tone: 'error',
        title: 'Gagal Mengambil Antrian',
        message: error instanceof Error ? error.message : 'Gagal mengambil antrian'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex h-full flex-col gap-6">
      <div className="text-center">
        <Typography.Title level={2} className="!mb-2">
          {isRegistrationTicket ? 'Konfirmasi Antrian Pendaftaran' : 'Konfirmasi Informasi Antrian'}
        </Typography.Title>
        <Typography.Text className="text-base text-slate-500">
          {isRegistrationTicket
            ? 'Pasien tanpa MRN akan diarahkan ke loket pendaftaran untuk proses registrasi awal.'
            : 'Pastikan data di bawah sudah sesuai sebelum mengambil nomor antrian.'}
        </Typography.Text>
      </div>

      <Descriptions
        title={isRegistrationTicket ? 'Ringkasan Pendaftaran' : 'Ringkasan Kunjungan'}
        column={1}
        bordered
        items={
          isRegistrationTicket
            ? [
                {
                  key: 'queue_target',
                  label: 'Tujuan',
                  children: isInsuranceRegistration
                    ? 'Loket Pendaftaran Asuransi'
                    : 'Loket Pendaftaran'
                },
                {
                  key: 'patient_type',
                  label: 'Jenis Pasien',
                  children: 'Pasien baru / belum memiliki MRN'
                },
                {
                  key: 'location',
                  label: 'Lokasi',
                  children: state.rawatJalan.location?.name || '-'
                },
                {
                  key: 'payment_method',
                  label: 'Metode Pembayaran',
                  children: paymentMethod === 'ASURANSI' ? 'Asuransi' : 'Cash'
                }
              ]
            : [
                {
                  key: 'poli',
                  label: 'Poli',
                  children: state.rawatJalan.poli?.name || '-'
                },
                {
                  key: 'doctor',
                  label: 'Dokter',
                  children: state.rawatJalan.selectedDoctor?.doctorName || '-'
                },
                {
                  key: 'payment_method',
                  label: 'Metode Pembayaran',
                  children: paymentMethod === 'ASURANSI' ? 'Asuransi' : 'Cash'
                },
                {
                  key: 'patient',
                  label: 'Pasien',
                  children: state.rawatJalan.matchedPatient?.name || 'Pasien baru / tanpa MRN'
                },
                {
                  key: 'address',
                  label: 'Alamat',
                  children: state.rawatJalan.matchedPatient?.address || '-'
                },
                {
                  key: 'age',
                  label: 'Umur',
                  children: state.rawatJalan.matchedPatient?.birthDate
                    ? calculateAge(state.rawatJalan.matchedPatient.birthDate)
                    : '-'
                }
              ]
        }
      />

      <div className="mt-auto flex justify-end">
        <Button
          loading={isSubmitting}
          type="primary"
          className="!h-16 !rounded-2xl !px-10 !text-xl"
          onClick={handleSubmit}
        >
          Ambil Nomor
        </Button>
      </div>

      <KioskFeedbackOverlay
        open={Boolean(feedback)}
        tone={feedback?.tone || 'success'}
        title={feedback?.title || ''}
        message={feedback?.message || ''}
        primaryLabel={feedback?.tone === 'success' ? 'Kembali ke Awal' : 'Tutup'}
        onPrimary={() => {
          if (feedback?.tone === 'success') {
            resetFlow()
          }
          setFeedback(null)
        }}
      />
    </div>
  )
}
