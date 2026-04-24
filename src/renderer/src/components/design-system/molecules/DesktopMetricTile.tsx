import React from 'react'

export type DesktopMetricTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const METRIC_TONE_CLASSNAME: Record<DesktopMetricTone, string> = {
  neutral:
    'border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text)]',
  success:
    'border-[color-mix(in_srgb,var(--ds-color-success)_26%,white)] bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] text-[var(--ds-color-success)]',
  warning:
    'border-[color-mix(in_srgb,var(--ds-color-warning)_26%,white)] bg-[color-mix(in_srgb,var(--ds-color-warning)_12%,white)] text-[var(--ds-color-warning)]',
  danger:
    'border-[color-mix(in_srgb,var(--ds-color-danger)_26%,white)] bg-[color-mix(in_srgb,var(--ds-color-danger)_10%,white)] text-[var(--ds-color-danger)]',
  info:
    'border-[color-mix(in_srgb,var(--ds-color-info)_24%,white)] bg-[color-mix(in_srgb,var(--ds-color-info)_10%,white)] text-[var(--ds-color-info)]'
}

export interface DesktopMetricTileProps {
  label: string
  value: string
  unit?: string
  tone?: DesktopMetricTone
}

export function DesktopMetricTile({
  label,
  value,
  unit,
  tone = 'neutral'
}: DesktopMetricTileProps) {
  return (
    <div className={`rounded-[var(--ds-radius-md)] border px-[var(--ds-space-md)] py-[var(--ds-space-sm)] ${METRIC_TONE_CLASSNAME[tone]}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.06em]">
        {label}
      </div>
      <div className="mt-[var(--ds-space-xxs)] flex items-baseline gap-[2px]">
        <b className="font-mono text-[17px] leading-none">{value}</b>
        {unit ? <span className="text-[10px] text-[var(--ds-color-text-muted)]">{unit}</span> : null}
      </div>
    </div>
  )
}
