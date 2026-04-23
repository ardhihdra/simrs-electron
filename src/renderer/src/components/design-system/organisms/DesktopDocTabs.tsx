import type { ReactNode } from 'react'

import { DesktopIcon } from '../atoms/DesktopIcon'
import {
  getActiveDesktopKey,
  type DesktopDocTabItem
} from './desktop-shell.helpers'

export type { DesktopDocTabItem } from './desktop-shell.helpers'

export interface DesktopDocTabsProps {
  tabs: DesktopDocTabItem[]
  activeKey?: string
  onTabSelect?: (key: string) => void
  onTabClose?: (key: string) => void
  addButton?: ReactNode
}

export function DesktopDocTabs({
  tabs,
  activeKey,
  onTabSelect,
  onTabClose,
  addButton
}: DesktopDocTabsProps) {
  const resolvedActiveKey = getActiveDesktopKey(tabs, activeKey)

  return (
    <div className="flex h-ds-doc-tab items-end gap-ds-doc-tab-gap overflow-x-auto border-b border-ds-border bg-ds-surface-muted px-ds-space-sm">
      {tabs.map((tab) => {
        const isActive = tab.key === resolvedActiveKey

        return (
          <button
            key={tab.key}
            className={`mt-ds-doc-tab-offset flex h-ds-doc-tab-button max-w-ds-doc-tab-max shrink-0 items-center gap-ds-space-xs rounded-t-ds-md border border-ds-border px-ds-space-md text-ds-label transition-colors ${
              isActive
                ? 'border-b-transparent bg-ds-surface font-semibold text-ds-text'
                : 'bg-ds-surface-raised text-ds-muted hover:bg-ds-surface hover:text-ds-text'
            }`}
            onClick={() => onTabSelect?.(tab.key)}
            type="button"
          >
            {tab.icon ? <span className="flex items-center">{tab.icon}</span> : null}
            <span className="truncate">{tab.label}</span>
            {tab.dirty ? (
              <span className="h-[7px] w-[7px] rounded-[var(--ds-radius-pill)] bg-[var(--ds-color-warning)]" />
            ) : null}
            {tab.closable && onTabClose ? (
              <span
                aria-hidden="true"
                className="flex h-[18px] w-[18px] items-center justify-center rounded-[var(--ds-radius-pill)] text-ds-caption text-ds-subtle hover:bg-ds-surface-muted hover:text-ds-text"
                onClick={(event) => {
                  event.stopPropagation()
                  onTabClose(tab.key)
                }}
              >
                <DesktopIcon name="x" size={10} />
              </span>
            ) : null}
          </button>
        )
      })}
      <div className="my-auto ml-[var(--ds-space-xs)] shrink-0">
        {addButton ?? (
          <button
            type="button"
            className="flex h-[var(--ds-button-h-sm)] w-[var(--ds-button-h-sm)] items-center justify-center rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)]"
          >
            <DesktopIcon name="plus" size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
