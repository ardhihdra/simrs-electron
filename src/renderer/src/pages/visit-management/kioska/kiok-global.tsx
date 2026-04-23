import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, theme, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

import { KioskaWizardStepIndicator } from './global/components/kioska-wizard-step-indicator'
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
  const now = () => new Date()
  const [timeLabel, setTimeLabel] = useState(() => now().toLocaleTimeString())
  const [dateLabel, setDateLabel] = useState(() =>
    now().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  )

  useEffect(() => {
    const interval = window.setInterval(() => {
      const d = new Date()
      setTimeLabel(d.toLocaleTimeString())
      setDateLabel(
        d.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      )
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  return { timeLabel, dateLabel }
}

const navbarList = [
  { label: '① Beranda', target: 'antrian_type', steps: ['antrian_type', 'penunjang_type'] },
  {
    label: '② Rawat Jalan › Penjamin',
    target: 'payment_method',
    steps: ['payment_method', 'has_mrn', 'scan_mrn']
  },
  { label: '③ Rawat Jalan › Poli', target: 'poli', steps: ['poli'] },
  { label: '④ Rawat Jalan › Dokter', target: 'dokter', steps: ['dokter'] },
  { label: '⑤ Tiket Antrian (RJ)', target: 'ambil_antrian', steps: ['ambil_antrian'] },
  { label: '⑥ Check-in Online', target: 'input_kode_antrian', steps: ['input_kode_antrian'] },
  { label: '⑦ Tiket Antrian (Langsung)', target: 'non_medic_kiosk', steps: ['non_medic_kiosk'] }
] as const

function KioskaGlobalContent() {
  const { token } = theme.useToken()
  const { goBack, goTo, state } = useKioskaGlobalFlow()
  const { timeLabel, dateLabel } = useCurrentTimeLabel()
  const location = useLocation()
  const initialPaymentMethod = resolveInitialKioskaRegistrationPaymentMethodFromPath(
    location.pathname
  )
  const currentPaymentMethod =
    state.antrianType === 'rawat_jalan'
      ? (state.rawatJalan.paymentMethod ?? initialPaymentMethod)
      : (state.publicQueue.paymentMethod ?? null)
  const isInsuranceRegistration = currentPaymentMethod === 'ASURANSI'

  // const kioskGradient = `colorFillSecondary`
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
    <div className="h-screen overflow-hidden px-4 py-4 md:px-6 md:py-6 bg-[oklch(0.975 0.004 240)]">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] flex-col gap-4 ">
        <header className="rounded-lg border border-white/70 bg-white/95 p-2 shadow-sm backdrop-blur flex items-center gap-3 self-center my-6">
          {canGoBack && (
            <div onClick={goBack} className="cursor-pointer shrink-0">
              <ArrowLeftOutlined />
            </div>
          )}
          <nav className="flex flex-wrap items-center justify-center gap-1.5 flex-1">
            {navbarList.map(({ label, target, steps }) => {
              const isActive = (steps as readonly string[]).includes(state.step)
              return (
                <button
                  key={label}
                  onClick={() => goTo(target)}
                  style={{ color: token.colorTextTertiary }}
                  className={[
                    'whitespace-nowrap rounded-md border px-3 py-1 text-[11.5px] font-medium cursor-pointer',
                    isActive
                      ? 'border-blue-500 bg-blue-50 font-semibold text-blue-600'
                      : 'border-transparent hover:bg-slate-100 hover:text-slate-600'
                  ].join(' ')}
                >
                  {label}
                </button>
              )
            })}
          </nav>
        </header>

        <main className="flex min-h-0 flex-1">
          {/* main card */}
          <div className="relative mx-auto flex w-[1080px] h-[720px] scale-105 mt-8 flex-shrink-0 flex-col overflow-hidden rounded-[16px] border-2 border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface)] [zoom:var(--kiosk-zoom,1)] [box-shadow:var(--ds-shadow-md),0_20px_60px_-10px_rgba(15,23,42,0.18)]">
            {/* header */}
            <div className="flex h-16 flex-shrink-0 items-center gap-4 px-7 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] bg-[var(--ds-color-accent)] text-[15px] font-extrabold text-white">
                  RS
                </div>
                <div className="flex flex-col leading-[1.15]">
                  <span className="text-sm font-bold text-slate-800">SIMRS Sentosa</span>
                  <span className="text-[10.5px] tracking-wide text-slate-400">
                    Jl. Sentosa No. 1, Jakarta
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col items-center gap-0.5">
                <Typography.Text className="block text-[13px] font-semibold text-slate-600">
                  Selamat datang --{' '}
                  {summary ||
                    (isInsuranceRegistration ? 'Pendaftaran Asuransi' : 'Ambil Nomor Antrian')}
                </Typography.Text>
              </div>

              <div className="text-right">
                <div
                  className="text-lg font-semibold text-slate-800"
                  style={{
                    fontFamily: 'var(--ds-font-mono)',
                    letterSpacing: '-0.2px',
                    fontFeatureSettings: '"cv11", "ss01"'
                  }}
                >
                  {timeLabel}
                </div>
                <div className="text-[10.5px] text-slate-400">{dateLabel}</div>
              </div>
            </div>
            <KioskaWizardStepIndicator step={state.step} />

            <div className="min-h-0 flex-1 py-4 px-6">
              <div className={isNonMedicKioskStep ? 'h-full overflow-auto' : 'h-[34rem]'}>
                {renderStep()}
              </div>
            </div>

            {/* card footer */}
            <div className="flex h-8 flex-shrink-0 items-center justify-center gap-4 border-t border-[var(--ds-color-border)] bg-[var(--ds-color-surface-2)] text-[10.5px] text-slate-400">
              <span>Sentuh layar untuk mulai</span>
              <div className="h-1 w-1 rounded-full bg-[var(--ds-color-border-strong)]" />
              <span>Butuh bantuan? Hubungi petugas di loket</span>
              <div className="h-1 w-1 rounded-full bg-[var(--ds-color-border-strong)]" />
              <span>ID Mesin: KSK-01</span>
            </div>
          </div>
        </main>
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
