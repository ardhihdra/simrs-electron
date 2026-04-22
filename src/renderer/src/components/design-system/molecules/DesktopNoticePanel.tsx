import React, { type ReactNode } from 'react'

export type DesktopNoticePanelTone = 'neutral' | 'danger' | 'warning' | 'success' | 'violet'

const TONE_CLASSNAME: Record<DesktopNoticePanelTone, string> = {
  neutral:
    'border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text)]',
  danger:
    'border-[var(--ds-color-danger)] bg-[color-mix(in_srgb,var(--ds-color-danger)_10%,white)] text-[var(--ds-color-danger)]',
  warning:
    'border-[var(--ds-color-warning)] bg-[color-mix(in_srgb,var(--ds-color-warning)_12%,white)] text-[var(--ds-color-warning)]',
  success:
    'border-[var(--ds-color-success)] bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] text-[var(--ds-color-success)]',
  violet:
    'border-[var(--ds-color-violet)] bg-[var(--ds-color-violet-soft)] text-[var(--ds-color-violet)]'
}

export interface DesktopNoticePanelProps {
  title: ReactNode
  description?: ReactNode
  tone?: DesktopNoticePanelTone
  leading?: ReactNode
}

export function DesktopNoticePanel({
  title,
  description,
  tone = 'neutral',
  leading
}: DesktopNoticePanelProps) {
  return (
    <div
      className={`flex items-center gap-[12px] rounded-[var(--ds-radius-md)] border px-[14px] py-[10px] ${TONE_CLASSNAME[tone]}`}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0">
        <div className="text-[12px] font-semibold">{title}</div>
        {description ? <div className="text-[11px] text-[var(--ds-color-text-muted)]">{description}</div> : null}
      </div>
    </div>
  )
}
