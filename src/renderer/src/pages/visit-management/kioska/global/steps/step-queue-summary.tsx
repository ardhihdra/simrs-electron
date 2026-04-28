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

type QueueResult = {
  queueNumber: string
  serviceName: string
  subLabel?: string
  infoNote?: string
  issuedAt: string
}

function splitQueueNumber(queueNumber: string): { prefix: string; num: string } {
  const match = queueNumber.match(/^(.*?)(\d+)$/)
  return match ? { prefix: match[1], num: match[2] } : { prefix: '', num: queueNumber }
}

export function StepQueueSummary() {
  const { resetFlow, state } = useKioskaGlobalFlow()
  const location = useLocation()
  const initialPaymentMethod = resolveInitialKioskaRegistrationPaymentMethodFromPath(
    location.pathname
  )
  const paymentMethod = state.rawatJalan.paymentMethod ?? initialPaymentMethod
  const registrationServiceType =
    resolveKioskaRegistrationServiceTypeFromPaymentMethod(paymentMethod)
  const isInsuranceRegistration = paymentMethod === 'ASURANSI'
  const isRegistrationTicket = state.rawatJalan.hasMrn === false

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [queueResult, setQueueResult] = useState<QueueResult | null>(null)
  const [errorFeedback, setErrorFeedback] = useState<{
    title: string
    message: string
  } | null>(null)

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

        setQueueResult({
          queueNumber: result.ticketNo || '-',
          serviceName: isInsuranceRegistration ? 'Pendaftaran Asuransi' : 'Pendaftaran',
          subLabel: state.rawatJalan.location?.name,
          infoNote: `Silakan menuju loket ${isInsuranceRegistration ? 'pendaftaran asuransi' : 'pendaftaran'} dan tunjukkan nomor tiket ini.`,
          issuedAt: dayjs().format('HH:mm')
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

      const poliName = state.rawatJalan.poli?.name || '-'
      const doctorName = state.rawatJalan.selectedDoctor?.doctorName || '-'
      const paymentLabel = paymentMethod === 'ASURANSI' ? 'Asuransi' : 'Umum'

      setQueueResult({
        queueNumber: result.queueNumber,
        serviceName: `Rawat Jalan · ${poliName}`,
        subLabel: `${doctorName} · ${paymentLabel}`,
        infoNote: `Silakan cetak tiket ini dan tunggu di ruang tunggu ${poliName}. Pastikan membawa kartu identitas dan berkas pemeriksaan.`,
        issuedAt: dayjs().format('HH:mm')
      })
    } catch (error) {
      setErrorFeedback({
        title: 'Gagal Mengambil Antrian',
        message: error instanceof Error ? error.message : 'Gagal mengambil antrian'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (queueResult) {
    const { prefix, num } = splitQueueNumber(queueResult.queueNumber)

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-10 py-6">
        {/* Success badge */}
        <div className="flex items-center gap-2.5" style={{ marginBottom: -4 }}>
          <div
            className="grid place-items-center rounded-full bg-ds-success/15 text-ds-success"
            style={{ width: 40, height: 40 }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-sm font-bold text-ds-success">Nomor antrian berhasil diambil</span>
        </div>

        {/* Ticket card */}
        <div
          className="relative overflow-hidden rounded-[20px] border border-ds-border bg-ds-surface text-center shadow-ds-md"
          style={{ minWidth: 400, padding: '32px 40px 28px' }}
        >
          {/* Top accent bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-ds-accent" />

          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-ds-accent">
            {queueResult.serviceName}
          </div>

          {queueResult.subLabel && (
            <div className="mb-1 text-xs text-ds-subtle">{queueResult.subLabel}</div>
          )}

          <div
            className="my-2 font-mono font-bold leading-none tracking-tight text-ds-text text-7xl"
            style={{ fontFamily: 'var(--ds-font-mono)' }}
          >
            {prefix && (
              <span
                className="text-5xl text-ds-subtle"
                style={{ fontFamily: 'var(--ds-font-mono)' }}
              >
                {prefix}-
              </span>
            )}
            {num}
          </div>

          <hr className="my-4 border-0 border-t border-dashed border-ds-border" />

          <div className="grid grid-cols-3 gap-0">
            <div className="border-r border-dashed border-ds-border px-3 py-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-ds-subtle">
                Saat ini dilayani
              </div>
              <div
                className="text-sm font-bold text-ds-text"
                style={{ fontFamily: 'var(--ds-font-mono)' }}
              >
                -
              </div>
            </div>
            <div className="border-r border-dashed border-ds-border px-3 py-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-ds-subtle">
                Estimasi tunggu
              </div>
              <div
                className="text-sm font-bold text-ds-text"
                style={{ fontFamily: 'var(--ds-font-mono)' }}
              >
                -
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-ds-subtle">
                Diterbitkan
              </div>
              <div
                className="text-sm font-bold text-ds-text"
                style={{ fontFamily: 'var(--ds-font-mono)' }}
              >
                {queueResult.issuedAt}
              </div>
            </div>
          </div>
        </div>

        {/* Info note */}
        {queueResult.infoNote && (
          <div className="max-w-[480px] rounded-ds-md border border-ds-accent bg-ds-accent-soft px-5 py-3 text-center text-xs leading-relaxed text-ds-accent">
            {queueResult.infoNote}
          </div>
        )}

        {/* Actions */}
        <div className="mt-2 flex gap-3">
          <button
            className="flex cursor-pointer items-center gap-2 rounded-ds-md border border-ds-border bg-ds-surface px-5 py-3 text-sm font-semibold text-ds-text transition-colors hover:bg-ds-surface-muted"
            onClick={() => window.print()}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Cetak Tiket
          </button>
          <button
            className="flex cursor-pointer items-center gap-2 rounded-ds-md bg-ds-accent px-5 py-3 text-sm font-semibold text-ds-accent-text transition-colors hover:bg-ds-accent/90"
            onClick={resetFlow}
          >
            Selesai
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    )
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
          className="scale-125 m-6"
          onClick={handleSubmit}
        >
          Ambil Nomor
        </Button>
      </div>

      <KioskFeedbackOverlay
        open={Boolean(errorFeedback)}
        tone="error"
        title={errorFeedback?.title || ''}
        message={errorFeedback?.message || ''}
        primaryLabel="Tutup"
        onPrimary={() => setErrorFeedback(null)}
      />
    </div>
  )
}
