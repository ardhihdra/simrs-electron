import React from 'react'

export type DesktopStatus = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent'

const STATUS_DOT_CLASSNAME: Record<DesktopStatus, string> = {
  neutral: 'bg-ds-subtle',
  success: 'bg-ds-success',
  warning: 'bg-ds-warning',
  danger: 'bg-ds-danger',
  info: 'bg-ds-info',
  accent: 'bg-ds-accent'
}

export interface DesktopStatusDotProps {
  status?: DesktopStatus
  label?: string
}

export function DesktopStatusDot({ status = 'neutral', label }: DesktopStatusDotProps) {
  return (
    <span className="inline-flex items-center gap-[var(--ds-space-xs)] text-[length:var(--ds-font-size-label)] font-semibold text-[var(--ds-color-text-muted)]">
      <span
        className={`h-[10px] w-[10px] rounded-[var(--ds-radius-pill)] ${STATUS_DOT_CLASSNAME[status]}`}
      />
      {label ? <span>{label}</span> : null}
    </span>
  )
}
