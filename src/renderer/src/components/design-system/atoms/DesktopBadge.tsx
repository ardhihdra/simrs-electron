import React, { type ReactNode } from 'react'

export type DesktopBadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

const BADGE_CLASSNAME: Record<DesktopBadgeTone, string> = {
  neutral: 'bg-ds-surface-muted text-ds-muted',
  accent: 'bg-ds-accent-soft text-ds-accent',
  success: 'bg-[color-mix(in_srgb,var(--ds-color-success)_14%,white)] text-[var(--ds-color-success)]',
  warning: 'bg-[color-mix(in_srgb,var(--ds-color-warning)_16%,white)] text-[var(--ds-color-warning)]',
  danger: 'bg-[color-mix(in_srgb,var(--ds-color-danger)_14%,white)] text-[var(--ds-color-danger)]',
  info: 'bg-[color-mix(in_srgb,var(--ds-color-info)_14%,white)] text-[var(--ds-color-info)]'
}

export function DesktopBadge({
  children,
  tone = 'neutral'
}: {
  children: ReactNode
  tone?: DesktopBadgeTone
}) {
  return (
    <span
      className={`inline-flex h-[22px] items-center rounded-ds-pill px-ds-space-sm text-ds-label font-semibold tracking-[0.04em] ${BADGE_CLASSNAME[tone]}`}
    >
      {children}
    </span>
  )
}
