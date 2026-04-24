import type { KioskaGlobalStep } from '../kioska-global-types'

type StepState = 'done' | 'active' | 'default'

const WIZARD_PHASES: { label: string; steps: KioskaGlobalStep[] }[] = [
  { label: 'Penjamin', steps: ['payment_method'] },
  { label: 'Identitas Diri', steps: ['has_mrn', 'scan_mrn'] },
  { label: 'Pilih Poli', steps: ['poli'] },
  { label: 'Pilih Dokter', steps: ['dokter'] },
  { label: 'Nomor Antrian', steps: ['ambil_antrian'] }
]

const WIZARD_STEPS: KioskaGlobalStep[] = WIZARD_PHASES.flatMap((p) => p.steps)

function resolvePhaseIndex(step: KioskaGlobalStep): number {
  return WIZARD_PHASES.findIndex((phase) => (phase.steps as KioskaGlobalStep[]).includes(step))
}

function resolveStepState(phaseIndex: number, currentPhaseIndex: number): StepState {
  if (phaseIndex < currentPhaseIndex) return 'done'
  if (phaseIndex === currentPhaseIndex) return 'active'
  return 'default'
}

type Props = { step: KioskaGlobalStep }

export function KioskaWizardStepIndicator({ step }: Props) {
  if (!WIZARD_STEPS.includes(step)) return null

  const currentPhase = resolvePhaseIndex(step)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 32px 12px',
        background: 'var(--ds-color-surface)',
        borderBottom: '1px solid var(--ds-color-border)',
        flexShrink: 0,
        gap: 0
      }}
    >
      {WIZARD_PHASES.map((phase, idx) => {
        const state = resolveStepState(idx, currentPhase)
        return (
          <div key={phase.label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                  background:
                    state === 'active'
                      ? 'var(--ds-color-accent)'
                      : state === 'done'
                        ? 'var(--ds-color-success)'
                        : 'var(--ds-color-surface)',
                  border: `2px solid ${
                    state === 'active'
                      ? 'var(--ds-color-accent)'
                      : state === 'done'
                        ? 'var(--ds-color-success)'
                        : 'var(--ds-color-border-strong)'
                  }`,
                  color:
                    state === 'active' || state === 'done' ? 'white' : 'var(--ds-color-text-subtle)'
                }}
              >
                {state === 'done' ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: state === 'active' ? 700 : 500,
                  color:
                    state === 'active'
                      ? 'var(--ds-color-accent)'
                      : state === 'done'
                        ? 'var(--ds-color-success)'
                        : 'var(--ds-color-text-subtle)'
                }}
              >
                {phase.label}
              </span>
            </div>
            {idx < WIZARD_PHASES.length - 1 && (
              <div
                style={{
                  width: 48,
                  height: 2,
                  background:
                    state === 'done' ? 'var(--ds-color-success)' : 'var(--ds-color-border)',
                  margin: '0 8px'
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
