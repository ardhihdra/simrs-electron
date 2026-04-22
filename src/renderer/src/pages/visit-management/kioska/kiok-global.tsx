import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, theme, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

import { KioskaGlobalFlowProvider, useKioskaGlobalFlow } from './global/kioska-global-context'
import { formatKioskaGlobalSummary } from './global/kioska-global-flow'
import { resolveInitialKioskaRegistrationPaymentMethodFromPath } from './global/kioska-queue-submission'
import {
  StepCheckin,
  StepHasMrn,
  StepPublicQueueKiosk,
  StepQueueSummary,
  StepScanMrn,
  StepSelectAntrianType,
  StepSelectDoctor,
  StepSelectPaymentMethod,
  StepSelectPenunjangType,
  StepSelectPoli
} from './global/steps'

function useCurrentTimeLabel() {
  const [timeLabel, setTimeLabel] = useState(() => new Date().toLocaleTimeString())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLabel(new Date().toLocaleTimeString())
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  return timeLabel
}

function KioskaGlobalContent() {
  const { token } = theme.useToken()
  const { goBack, state } = useKioskaGlobalFlow()
  const timeLabel = useCurrentTimeLabel()
  const location = useLocation()
  const initialPaymentMethod = resolveInitialKioskaRegistrationPaymentMethodFromPath(
    location.pathname
  )
  const currentPaymentMethod =
    state.antrianType === 'rawat_jalan'
      ? (state.rawatJalan.paymentMethod ?? initialPaymentMethod)
      : (state.publicQueue.paymentMethod ?? null)
  const isInsuranceRegistration = currentPaymentMethod === 'ASURANSI'

  const kioskGradient = `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
  const summary = formatKioskaGlobalSummary(state)
  const canGoBack = state.history.length > 0
  const isNonMedicKioskStep = state.step === 'non_medic_kiosk'

  const renderStep = () => {
    switch (state.step) {
      case 'antrian_type':
        return <StepSelectAntrianType />
      case 'penunjang_type':
        return <StepSelectPenunjangType />
      case 'payment_method':
        return <StepSelectPaymentMethod />
      case 'has_mrn':
        return <StepHasMrn />
      case 'scan_mrn':
        return <StepScanMrn />
      case 'poli':
        return <StepSelectPoli />
      case 'dokter':
        return <StepSelectDoctor />
      case 'ambil_antrian':
        return <StepQueueSummary />
      case 'non_medic_kiosk':
        return <StepPublicQueueKiosk />
      case 'input_kode_antrian':
        return <StepCheckin />
      default:
        return null
    }
  }

  return (
    <div
      className="h-screen overflow-hidden px-4 py-4 md:px-6 md:py-6"
      style={{ background: kioskGradient }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] flex-col gap-4">
        <header className="rounded-[28px] border border-white/70 bg-white/95 px-6 py-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-blue-500 text-lg font-bold text-white">
                RS
              </div>
              <div>
                <Typography.Text className="block text-sm text-slate-500">
                  Sistem Antrian
                </Typography.Text>
                <Typography.Title level={4} className="!mb-0">
                  {isInsuranceRegistration ? 'Pendaftaran Asuransi' : 'Rumah Sakit Rahayu'}
                </Typography.Title>
              </div>
            </div>

            <div className="text-center">
              <Typography.Title level={2} className="!mb-1">
                {isInsuranceRegistration ? 'Ambil Nomor Antrian Asuransi' : 'Ambil Nomor Antrian'}
              </Typography.Title>
              <Typography.Text className="text-sm text-slate-500">
                {isInsuranceRegistration
                  ? 'Pilih layanan asuransi dan ikuti langkah berikutnya'
                  : 'Pilih layanan dan ikuti langkah berikutnya'}
              </Typography.Text>
            </div>

            <div className="text-right">
              <Typography.Text className="block text-xs text-slate-400">Waktu</Typography.Text>
              <Typography.Text className="block text-lg font-semibold text-slate-800">
                {timeLabel}
              </Typography.Text>
              <Typography.Text className="block text-xs font-medium text-emerald-600">
                Sistem Aktif
              </Typography.Text>
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1">
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-xl">
            <div className="flex min-h-20 items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 md:px-8">
              <Button
                size="large"
                icon={<ArrowLeftOutlined />}
                className={
                  canGoBack ? '!rounded-2xl' : '!pointer-events-none !rounded-2xl !opacity-0'
                }
                onClick={goBack}
              >
                Kembali
              </Button>

              <div className="min-w-0 flex-1 text-right">
                {summary ? (
                  <Typography.Text className="block truncate text-sm font-medium text-slate-500">
                    {summary}
                  </Typography.Text>
                ) : (
                  <span className="block h-5" />
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 px-6 py-6 md:px-8 md:py-8">
              <div className={isNonMedicKioskStep ? 'h-full overflow-auto' : 'h-[34rem]'}>
                {renderStep()}
              </div>
            </div>
          </div>
        </main>

        <footer className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-md backdrop-blur-sm">
          {/* 3-column info strip */}
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {/* Left — guidance */}
            <div className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              <div>
                <Typography.Text className="block text-xs font-semibold text-slate-800">
                  Ikuti instruksi di layar
                </Typography.Text>
                <Typography.Text className="block text-[11px] text-slate-400">
                  Periksa kembali data sebelum melanjutkan
                </Typography.Text>
              </div>
            </div>

            {/* Center — help */}
            <div className="flex items-center justify-center gap-3 px-5 py-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.87a16 16 0 0 0 5.45 5.45l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 15.92z" />
                </svg>
              </span>
              <div>
                <Typography.Text className="block text-[11px] text-slate-400">
                  Butuh bantuan?
                </Typography.Text>
                <Typography.Text className="block text-xs font-semibold text-slate-800">
                  Hubungi petugas loket
                </Typography.Text>
              </div>
            </div>

            {/* Right — status */}
            <div className="flex items-center justify-end gap-3 px-5 py-3">
              <div className="text-right">
                <Typography.Text className="block text-[11px] text-slate-400">
                  Status sistem
                </Typography.Text>
                <span className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </span>
            </div>
          </div>

          {/* Bottom notice */}
          <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50/70 px-6 py-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 shrink-0 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <Typography.Text className="text-[11px] text-slate-400">
              Sistem akan kembali ke halaman awal jika tidak ada aktivitas.
            </Typography.Text>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default function KioskaGlobalPage() {
  return (
    <KioskaGlobalFlowProvider>
      <KioskaGlobalContent />
    </KioskaGlobalFlowProvider>
  )
}
