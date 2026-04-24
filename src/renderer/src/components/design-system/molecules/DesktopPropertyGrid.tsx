import React from 'react'

export type DesktopPropertyItem = {
  label: string
  value: string
  mono?: boolean
  muted?: boolean
}

export interface DesktopPropertyGridProps {
  items: DesktopPropertyItem[]
  columns?: 1 | 2 | 3
}

export function DesktopPropertyGrid({
  items,
  columns = 2
}: DesktopPropertyGridProps) {
  const gridClassName =
    columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2'

  return (
    <div className={`grid gap-[var(--ds-space-sm)] ${gridClassName}`}>
      {items.map((item) => (
        <div key={item.label} className="grid gap-[var(--ds-space-xxs)]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ds-color-text-subtle)]">
            {item.label}
          </div>
          <div
            className={`${item.mono ? 'font-mono' : ''} ${item.muted ? 'text-[var(--ds-color-text-muted)] font-normal' : 'text-[var(--ds-color-text)] font-semibold'} text-[length:var(--ds-font-size-body)]`}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}
