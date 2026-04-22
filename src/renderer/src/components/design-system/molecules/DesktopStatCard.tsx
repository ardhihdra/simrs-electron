import React, { type ReactNode } from 'react'

import { DesktopIcon } from '../atoms/DesktopIcon'
import { DesktopStatusDot, type DesktopStatus } from '../atoms/DesktopStatusDot'
import { DesktopCard } from './DesktopCard'

export interface DesktopStatCardProps {
  title: string
  value: string
  delta?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: ReactNode
  status?: DesktopStatus
  subtitle?: string
}

export function DesktopStatCard({
  title,
  value,
  delta,
  trend = 'neutral',
  icon,
  status = 'accent',
  subtitle
}: DesktopStatCardProps) {
  const trendIcon =
    trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'activity'

  return (
    <DesktopCard
      title={title}
      subtitle={subtitle}
      extra={
        <span className="flex h-[var(--ds-input-h-sm)] w-[var(--ds-input-h-sm)] items-center justify-center rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-accent)]">
          {icon ?? <DesktopIcon name="chart" size={16} />}
        </span>
      }
      compact
    >
      <div className="space-y-[var(--ds-space-sm)]">
        <div className="text-[length:var(--ds-font-size-title)] font-semibold leading-none text-[var(--ds-color-text)]">
          {value}
        </div>
        <div className="flex items-center justify-between gap-[var(--ds-space-sm)]">
          <DesktopStatusDot status={status} label="Live" />
          {delta ? (
            <span className="inline-flex items-center gap-[var(--ds-space-xxs)] text-[length:var(--ds-font-size-label)] font-semibold text-[var(--ds-color-text-muted)]">
              <DesktopIcon name={trendIcon} size={12} />
              {delta}
            </span>
          ) : null}
        </div>
      </div>
    </DesktopCard>
  )
}
