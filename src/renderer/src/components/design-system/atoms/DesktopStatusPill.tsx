import React, { type ReactNode } from 'react'

export type DesktopStatusPillTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'violet'

const TONE_CLASSNAME: Record<DesktopStatusPillTone, string> = {
  neutral:
    'border-[var(--ds-color-border)] bg-[var(--ds-color-surface-raised)] text-[var(--ds-color-text-subtle)]',
  accent:
    'border-[var(--ds-color-accent)] bg-[var(--ds-color-accent-soft)] text-[var(--ds-color-accent)]',
  success:
    'border-[var(--ds-color-success)] bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] text-[var(--ds-color-success)]',
  warning:
    'border-[var(--ds-color-warning)] bg-[color-mix(in_srgb,var(--ds-color-warning)_12%,white)] text-[var(--ds-color-warning)]',
  danger:
    'border-[var(--ds-color-danger)] bg-[color-mix(in_srgb,var(--ds-color-danger)_10%,white)] text-[var(--ds-color-danger)]',
  info:
    'border-[var(--ds-color-info)] bg-[color-mix(in_srgb,var(--ds-color-info)_10%,white)] text-[var(--ds-color-info)]',
  violet:
    'border-[var(--ds-color-violet)] bg-[var(--ds-color-violet-soft)] text-[var(--ds-color-violet)]'
}

const TONE_DOT_CLASSNAME: Record<DesktopStatusPillTone, string> = {
  neutral: 'bg-[var(--ds-color-text-subtle)]',
  accent: 'bg-[var(--ds-color-accent)]',
  success: 'bg-[var(--ds-color-success)]',
  warning: 'bg-[var(--ds-color-warning)]',
  danger: 'bg-[var(--ds-color-danger)]',
  info: 'bg-[var(--ds-color-info)]',
  violet: 'bg-[var(--ds-color-violet)]'
}

export interface DesktopStatusPillProps {
  children: ReactNode
  tone?: DesktopStatusPillTone
}

export function DesktopStatusPill({
  children,
  tone = 'neutral'
}: DesktopStatusPillProps) {
  return (
    <span
      className={`desktop-status-pill inline-flex items-center gap-[4px] rounded-[var(--ds-radius-sm)] border px-[7px] py-[2px] text-[10.5px] font-semibold ${TONE_CLASSNAME[tone]}`}
    >
      <span className={`h-[5px] w-[5px] rounded-[999px] ${TONE_DOT_CLASSNAME[tone]}`} />
      <span>{children}</span>
    </span>
  )
}
