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
  StepQueueSummary,
  StepScanMrn,
  StepSelectAntrianType,
  StepSelectDoctor,
  StepSelectPaymentMethod,
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
  const initialPaymentMethod = resolveInitialKioskaRegistrationPaymentMethodFromPath(location.pathname)
  const currentPaymentMethod = state.rawatJalan.paymentMethod ?? initialPaymentMethod
  const isInsuranceRegistration = currentPaymentMethod === 'ASURANSI'

  const kioskGradient = `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
  const summary = formatKioskaGlobalSummary(state)
  const canGoBack = state.history.length > 0

  const renderStep = () => {
    switch (state.step) {
      case 'antrian_type':
        return <StepSelectAntrianType />
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
                  {isInsuranceRegistration ? 'Pendaftaran Asuransi' : 'Rumah Sakit Anda'}
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
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-xl">
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
              <div className="h-[34rem]">{renderStep()}</div>
            </div>
          </div>
        </main>

        <footer className="rounded-[28px] border border-white/70 bg-white/95 px-6 py-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="text-left">
              <Typography.Text className="block text-sm font-semibold text-slate-800">
                Ikuti instruksi di layar
              </Typography.Text>
              <Typography.Text className="block text-xs text-slate-500">
                Periksa kembali data sebelum melanjutkan
              </Typography.Text>
            </div>

            <div className="hidden text-center md:flex md:flex-col">
              <Typography.Text className="text-xs text-slate-500">Butuh bantuan?</Typography.Text>
              <Typography.Text className="text-xs font-medium text-slate-700">
                Hubungi petugas loket
              </Typography.Text>
            </div>

            <div className="text-right">
              <Typography.Text className="block text-xs text-slate-400">Status</Typography.Text>
              <Typography.Text className="block text-xs font-medium text-emerald-600">
                Online
              </Typography.Text>
              <Typography.Text className="block text-xs text-slate-400">
                {timeLabel}
              </Typography.Text>
            </div>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3 text-center">
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
