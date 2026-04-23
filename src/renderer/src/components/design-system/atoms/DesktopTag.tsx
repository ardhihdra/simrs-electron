import React, { type ReactNode } from 'react'

import { DesktopIcon } from './DesktopIcon'

export type DesktopTagTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

const TAG_CLASSNAME: Record<DesktopTagTone, string> = {
  neutral: 'border-ds-border bg-ds-surface text-ds-muted',
  accent: 'border-ds-accent/20 bg-ds-accent-soft text-ds-accent',
  success:
    'border-[color-mix(in_srgb,var(--ds-color-success)_18%,white)] bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] text-ds-success',
  warning:
    'border-[color-mix(in_srgb,var(--ds-color-warning)_20%,white)] bg-[color-mix(in_srgb,var(--ds-color-warning)_12%,white)] text-ds-warning',
  danger:
    'border-[color-mix(in_srgb,var(--ds-color-danger)_22%,white)] bg-[color-mix(in_srgb,var(--ds-color-danger)_10%,white)] text-ds-danger'
}

export interface DesktopTagProps {
  children: ReactNode
  tone?: DesktopTagTone
  icon?: ReactNode
  onClose?: () => void
}

export function DesktopTag({
  children,
  tone = 'neutral',
  icon,
  onClose
}: DesktopTagProps) {
  return (
    <span
      className={`inline-flex min-h-[var(--ds-button-h-sm)] items-center gap-[var(--ds-space-xs)] rounded-[var(--ds-radius-pill)] border px-[var(--ds-space-sm)] text-[length:var(--ds-font-size-label)] font-semibold ${TAG_CLASSNAME[tone]}`}
    >
      {icon ? <span className="flex items-center">{icon}</span> : null}
      <span>{children}</span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="flex h-[18px] w-[18px] items-center justify-center rounded-[var(--ds-radius-pill)] hover:bg-[color-mix(in_srgb,currentColor_10%,transparent)]"
        >
          <DesktopIcon name="x" size={12} />
        </button>
      ) : null}
    </span>
  )
}
