import React, { type ReactNode } from 'react'

export type DesktopTriageBadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

const TONE_CLASSNAME: Record<DesktopTriageBadgeTone, string> = {
  neutral:
    'border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-subtle)]',
  accent:
    'border-[var(--ds-color-accent)] bg-[var(--ds-color-accent-soft)] text-[var(--ds-color-accent)]',
  success:
    'border-[var(--ds-color-success)] bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] text-[var(--ds-color-success)]',
  warning:
    'border-[var(--ds-color-warning)] bg-[color-mix(in_srgb,var(--ds-color-warning)_12%,white)] text-[var(--ds-color-warning)]',
  danger:
    'border-[var(--ds-color-danger)] bg-[color-mix(in_srgb,var(--ds-color-danger)_10%,white)] text-[var(--ds-color-danger)]'
}

export interface DesktopTriageBadgeProps {
  children: ReactNode
  tone?: DesktopTriageBadgeTone
  compact?: boolean
}

export function DesktopTriageBadge({
  children,
  tone = 'neutral',
  compact = false
}: DesktopTriageBadgeProps) {
  return (
    <span
      className={`desktop-triage-badge inline-flex items-center rounded-[var(--ds-radius-sm)] border font-mono font-bold tracking-[0.02em] ${
        compact ? 'px-[5px] py-[1px] text-[10px]' : 'px-[7px] py-[2px] text-[11px]'
      } ${TONE_CLASSNAME[tone]}`}
    >
      {children}
    </span>
  )
}
