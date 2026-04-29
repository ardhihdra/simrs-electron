/**
 * purpose: Sidebar daftar halaman desktop (grouped page list) untuk shell design system.
 * main callers: `DesktopMenuShell` dan showcase `design-system.tsx`.
 * key dependencies: `desktop-shell.helpers` untuk normalisasi data dan resolusi key aktif.
 * main/public functions: `DesktopPageList`.
 * side effects: Merender navigasi page list dan memanggil `onSelect` saat item dipilih.
 */
import type { ReactNode } from 'react'

import {
  getActiveDesktopKey,
  normalizeDesktopPageListGroups,
  type DesktopPageListGroup
} from './desktop-shell.helpers'

export type { DesktopPageListGroup, DesktopPageListItem } from './desktop-shell.helpers'

export interface DesktopPageListProps {
  groups: DesktopPageListGroup[]
  activeKey?: string
  moduleIcon?: ReactNode
  title?: string
  subtitle?: string
  icon?: ReactNode
  collapsed?: boolean
  footer?: ReactNode
  onSelect?: (key: string) => void
}

export function DesktopPageList({
  groups,
  activeKey,
  moduleIcon,
  title = 'Pendaftaran Pasien',
  subtitle = 'Daftar page aktif pada modul saat ini',
  icon,
  collapsed = false,
  footer,
  onSelect
}: DesktopPageListProps) {
  const normalizedGroups = normalizeDesktopPageListGroups(groups)
  const resolvedActiveKey = getActiveDesktopKey(
    normalizedGroups.flatMap((group) => group.items),
    activeKey
  )

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-ds-border bg-ds-surface transition-[width] duration-200 ${
        collapsed ? 'w-20' : 'w-ds-pagelist'
      }`}
    >
      <div className="border-b border-ds-border px-ds-card-padding py-ds-space-md">
        <div className={`flex items-center gap-ds-space-sm ${collapsed ? 'justify-center' : ''}`}>
          {moduleIcon ? (
            <div className="grid h-[28px] w-[28px] shrink-0 place-items-center rounded-[6px] bg-ds-accent-soft text-ds-accent">
              {moduleIcon}
            </div>
          ) : null}
          <div className={collapsed ? 'hidden' : ''}>
            <div className="text-ds-body font-semibold text-ds-text">{title}</div>
            <div className="text-ds-label text-ds-muted">MODUL</div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-ds-space-sm overflow-y-auto p-ds-space-sm">
        {normalizedGroups.map((group) => (
          <div key={group.key}>
            {!collapsed ? (
              <div className="mb-[var(--ds-space-xs)] px-[var(--ds-space-sm)] text-[length:var(--ds-font-size-caption)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                {group.label}
              </div>
            ) : null}
            <div className="space-y-ds-space-xxs">
              {group.items.map((item) => {
                const isActive = item.key === resolvedActiveKey

                return (
                  <button
                    key={item.key}
                    className={`flex h-ds-menu-item w-full items-center gap-ds-space-xs rounded-ds-md border border-transparent px-ds-space-md text-left text-ds-body transition-colors ${
                      isActive
                        ? 'bg-ds-surface font-semibold text-ds-accent'
                        : 'text-ds-muted hover:bg-ds-surface hover:text-ds-text'
                    } ${collapsed ? 'justify-center px-ds-space-sm' : ''}`}
                    disabled={item.disabled}
                    onClick={() => onSelect?.(item.key)}
                    type="button"
                  >
                    {item.icon ? (
                      <span className="flex h-ds-space-md w-ds-space-md items-center justify-center">
                        {item.icon}
                      </span>
                    ) : null}
                    <span className={`min-w-0 flex-1 truncate ${collapsed ? 'hidden' : ''}`}>
                      {item.label}
                    </span>
                    {!collapsed ? item.badge : null}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {footer ? (
        <div className="border-t border-ds-border px-ds-space-sm py-ds-space-sm">{footer}</div>
      ) : null}
    </aside>
  )
}
