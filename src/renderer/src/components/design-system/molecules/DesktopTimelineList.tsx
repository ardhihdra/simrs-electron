import React from 'react'

import { DesktopIcon } from '../atoms/DesktopIcon'

export type DesktopTimelineItem = {
  label: string
  time: string
  done: boolean
}

export interface DesktopTimelineListProps {
  items: DesktopTimelineItem[]
}

export function DesktopTimelineList({ items }: DesktopTimelineListProps) {
  return (
    <div className="grid gap-[var(--ds-space-sm)]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-[var(--ds-space-sm)]">
          <div
            className={`grid h-[20px] w-[20px] shrink-0 place-items-center rounded-[999px] border ${
              item.done
                ? 'border-[var(--ds-color-success)] bg-[var(--ds-color-success)] text-white'
                : 'border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-muted)]'
            }`}
          >
            {item.done ? <DesktopIcon name="check" size={9} /> : null}
          </div>
          <div className="flex flex-1 items-center justify-between gap-[var(--ds-space-sm)]">
            <span
              className={`text-[length:var(--ds-font-size-body)] ${
                item.done ? 'font-medium text-[var(--ds-color-text)]' : 'text-[var(--ds-color-text-muted)]'
              }`}
            >
              {item.label}
            </span>
            <span className="font-mono text-[11px] text-[var(--ds-color-text-muted)]">
              {item.time}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
