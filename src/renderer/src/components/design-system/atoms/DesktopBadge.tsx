import type { ReactNode } from 'react'

export type DesktopBadgeTone = 'neutral' | 'accent' | 'success' | 'warning'

const BADGE_CLASSNAME: Record<DesktopBadgeTone, string> = {
  neutral: 'bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-muted)]',
  accent: 'bg-[var(--ds-color-accent-soft)] text-[var(--ds-color-accent)]',
  success: 'bg-[color-mix(in_srgb,var(--ds-color-success)_14%,white)] text-[var(--ds-color-success)]',
  warning: 'bg-[color-mix(in_srgb,var(--ds-color-warning)_16%,white)] text-[var(--ds-color-warning)]'
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
      className={`inline-flex h-[22px] items-center rounded-[var(--ds-radius-pill)] px-[var(--ds-space-sm)] text-[length:var(--ds-font-size-label)] font-semibold tracking-[0.04em] ${BADGE_CLASSNAME[tone]}`}
    >
      {children}
    </span>
  )
}
