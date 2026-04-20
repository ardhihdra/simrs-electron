import { Card } from 'antd'
import type * as React from 'react'

type AntdCardProps = React.ComponentProps<typeof Card>

export interface DesktopCardProps {
  title: string
  subtitle?: string
  extra?: AntdCardProps['extra']
  children: AntdCardProps['children']
  compact?: boolean
}

export function DesktopCard({
  title,
  subtitle,
  extra,
  children,
  compact = false
}: DesktopCardProps) {
  return (
    <Card
      bordered={false}
      className="desktop-card !rounded-[var(--ds-radius-lg)] !border !border-[var(--ds-color-border)] !bg-[var(--ds-color-surface)] !shadow-[var(--ds-shadow-xs)]"
      styles={{
        body: {
          padding: compact ? 'var(--ds-card-padding-compact)' : 'var(--ds-card-padding)'
        }
      }}
    >
      <div className="mb-[var(--ds-space-md)] flex items-start gap-[var(--ds-space-md)]">
        <div className="min-w-0 flex-1">
          <h3 className="text-[length:var(--ds-font-size-body)] font-semibold text-[var(--ds-color-text)]">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-[var(--ds-space-xxs)] text-[length:var(--ds-font-size-label)] text-[var(--ds-color-text-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {extra ? <div className="shrink-0">{extra}</div> : null}
      </div>
      {children}
    </Card>
  )
}
