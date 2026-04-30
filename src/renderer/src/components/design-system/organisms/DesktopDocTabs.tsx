/**
 * purpose: Render desktop document tabs with active, dirty, and close states.
 * main callers: desktop shell/workspace pages that show multi-document tabs.
 * key dependencies: DesktopIcon, desktop-shell.helpers active-key resolver.
 * main/public functions: DesktopDocTabs (component), DesktopDocTabsProps (public props contract).
 * important side effects: invokes onTabSelect/onTabClose callbacks from user interactions.
 */
import type { ReactNode } from 'react'

import { DesktopIcon } from '../atoms/DesktopIcon'
import { getActiveDesktopKey, type DesktopDocTabItem } from './desktop-shell.helpers'

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
  onTabClose
}: DesktopDocTabsProps) {
  const resolvedActiveKey = getActiveDesktopKey(tabs, activeKey)

  return (
    <div className="flex h-ds-doc-tab items-end gap-ds-doc-tab-gap overflow-x-auto border-b border-ds-border bg-ds-background-elevated px-ds-space-sm">
      {tabs.map((tab) => {
        const isActive = tab.key === resolvedActiveKey

        return (
          <button
            key={tab.key}
            className={`mt-ds-doc-tab-offset flex h-ds-doc-tab-button max-w-ds-doc-tab-max shrink-0 items-center gap-ds-space-xs rounded-t-ds-md border border-ds-border pl-ds-space-md pr-ds-space-xxs text-ds-label transition-colors ${
              isActive
                ? 'border-b-transparent bg-ds-surface font-semibold text-ds-text border-t-ds-accent border-t-2'
                : 'border-b-transparent bg-ds-surface-muted-raised text-ds-muted hover:bg-ds-surface hover:text-ds-text'
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
    </div>
  )
}
