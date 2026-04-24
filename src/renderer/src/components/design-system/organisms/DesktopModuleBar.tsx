import type { ReactNode } from 'react'

import { DesktopBadge } from '../atoms/DesktopBadge'
import { DesktopIcon } from '../atoms/DesktopIcon'
import { getActiveDesktopKey, type DesktopModuleBarItem } from './desktop-shell.helpers'

export type { DesktopModuleBarItem } from './desktop-shell.helpers'

export interface DesktopModuleBarProps {
  items: DesktopModuleBarItem[]
  activeKey?: string
  brandMark?: ReactNode
  brandTitle?: string
  brandSubtitle?: string
  actions?: ReactNode
  onSelect?: (key: string) => void
}

export function DesktopModuleBar({
  items,
  activeKey,
  brandMark,
  brandTitle = 'SIMRS Desktop',
  brandSubtitle = 'Hybrid Layout',
  actions,
  onSelect
}: DesktopModuleBarProps) {
  const resolvedActiveKey = getActiveDesktopKey(items, activeKey)

  return (
    <div className="flex h-ds-modulebar items-center gap-ds-space-xs border-b border-ds-border bg-ds-surface px-ds-space-sm">
      <div className="flex self-stretch mr-ds-space-sm items-center gap-ds-space-xs border-r border-ds-border pr-ds-space-md">
        <div className="h-ds-module-brand w-ds-module-brand items-center justify-center overflow-hidden rounded-ds-md bg-ds-accent text-ds-accent-text text-ds-body font-bold p-0.5">
          {brandMark ?? 'S'}
        </div>
        <div className="leading-[1.15]">
          <div className="text-ds-body font-semibold text-ds-text">{brandTitle}</div>
          <div className="text-ds-caption uppercase tracking-[0.08em] text-ds-subtle opacity-60">
            {brandSubtitle}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-ds-space-xs overflow-x-auto">
        {items.map((item) => {
          const isActive = item.key === resolvedActiveKey

          return (
            <button
              key={item.key}
              className={`flex h-ds-module-nav shrink-0 items-center gap-ds-space-xs rounded-ds-md px-ds-space-md text-ds-body font-medium transition-colors ${
                isActive
                  ? 'bg-ds-accent-soft text-ds-accent'
                  : 'text-ds-muted hover:bg-ds-surface-muted hover:text-ds-text'
              }`}
              disabled={item.disabled}
              onClick={() => onSelect?.(item.key)}
              type="button"
            >
              {item.icon ? (
                <span className="flex h-ds-space-md w-ds-space-md items-center justify-center">
                  {item.icon}
                </span>
              ) : null}
              <span>{item.label}</span>
              {item.badge}
            </button>
          )
        })}
      </div>

      {actions ? (
        <div className="ml-ds-space-sm flex items-center gap-ds-space-sm">{actions}</div>
      ) : (
        <div className="ml-ds-space-sm flex items-center gap-ds-space-sm">
          <button
            type="button"
            className="flex h-[var(--ds-button-h-sm)] w-[var(--ds-button-h-sm)] items-center justify-center rounded-[var(--ds-radius-sm)] text-[var(--ds-color-text-muted)] hover:bg-[var(--ds-color-surface-muted)]"
          >
            <DesktopIcon name="search" size={14} />
          </button>
          <DesktopBadge tone="success">Online</DesktopBadge>
        </div>
      )}
    </div>
  )
}
