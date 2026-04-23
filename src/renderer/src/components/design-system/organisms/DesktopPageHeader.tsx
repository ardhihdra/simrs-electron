import type { ReactNode } from 'react'

import { DesktopTag } from '../atoms/DesktopTag'

export interface DesktopPageHeaderProps {
  title: string
  subtitle?: string
  eyebrow?: string
  metadata?: ReactNode
  actions?: ReactNode
  status?: string
}

export function DesktopPageHeader({
  title,
  subtitle,
  eyebrow,
  metadata,
  actions,
  status
}: DesktopPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-[var(--ds-space-md)] rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-card-padding)] py-[var(--ds-space-lg)] shadow-[var(--ds-shadow-xs)]">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <div className="mb-[var(--ds-space-xs)] text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
            {eyebrow}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-[var(--ds-space-sm)]">
          <h2 className="text-[length:var(--ds-font-size-title)] font-semibold text-[var(--ds-color-text)]">
            {title}
          </h2>
          {status ? <DesktopTag tone="accent">{status}</DesktopTag> : null}
        </div>
        {subtitle ? (
          <p className="mt-[var(--ds-space-xs)] text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]">
            {subtitle}
          </p>
        ) : null}
        {metadata ? <div className="mt-[var(--ds-space-sm)]">{metadata}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-[var(--ds-space-sm)]">{actions}</div> : null}
    </div>
  )
}
