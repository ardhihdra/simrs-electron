import type { ReactNode } from 'react'

import { DesktopBadge } from '../atoms/DesktopBadge'
import { DesktopButton } from '../atoms/DesktopButton'

export type DesktopMenuShellNavItem = {
  key: string
  label: ReactNode
  icon?: ReactNode
  badge?: ReactNode
}

export type DesktopMenuShellTabItem = {
  key: string
  label: ReactNode
  closable?: boolean
}

const DEFAULT_MODULES: DesktopMenuShellNavItem[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'pendaftaran', label: 'Pendaftaran', badge: <DesktopBadge tone="accent">24</DesktopBadge> },
  { key: 'rawat-jalan', label: 'Rawat Jalan', badge: <DesktopBadge tone="accent">142</DesktopBadge> },
  { key: 'rawat-inap', label: 'Rawat Inap' },
  { key: 'igd', label: 'IGD', badge: <DesktopBadge tone="warning">7</DesktopBadge> }
]

const DEFAULT_SIDEBAR_ITEMS: DesktopMenuShellNavItem[] = [
  { key: 'pendaftaran-baru', label: 'Pendaftaran Baru' },
  { key: 'cari-pasien', label: 'Cari Pasien' },
  {
    key: 'antrian-pendaftaran',
    label: 'Antrian Pendaftaran',
    badge: <DesktopBadge>8</DesktopBadge>
  }
]

const DEFAULT_TABS: DesktopMenuShellTabItem[] = [
  { key: 'pendaftaran-baru', label: 'Pendaftaran Baru', closable: true },
  { key: 'cari-pasien', label: 'Cari Pasien', closable: true },
  { key: 'antrian-pendaftaran', label: 'Antrian Pendaftaran', closable: true }
]

export interface DesktopMenuShellProps {
  title?: string
  subtitle?: string
  brandMark?: ReactNode
  brandTitle?: string
  brandSubtitle?: string
  moduleItems?: DesktopMenuShellNavItem[]
  activeModuleKey?: string
  onModuleSelect?: (key: string) => void
  sidebarItems?: DesktopMenuShellNavItem[]
  activeSidebarKey?: string
  onSidebarSelect?: (key: string) => void
  sidebarCollapsed?: boolean
  sidebarFooter?: ReactNode
  tabs?: DesktopMenuShellTabItem[]
  activeTabKey?: string
  onTabSelect?: (key: string) => void
  onTabClose?: (key: string) => void
  headerActions?: ReactNode
  statusBar?: ReactNode
  children?: ReactNode
}

function DefaultPreviewContent() {
  return (
    <>
      <div className="mb-ds-space-lg flex items-end gap-ds-space-md">
        <div className="min-w-0 flex-1">
          <h3 className="text-ds-title font-semibold text-ds-text">Pendaftaran Baru</h3>
          <p className="mt-ds-space-xxs text-ds-body text-ds-muted">
            Layout hybrid menjaga module bar, page list, MDI tabs, dan content region tetap padat
            seperti desktop app operasional.
          </p>
        </div>
        <DesktopButton emphasis="primary">Buat Pendaftaran</DesktopButton>
      </div>

      <div className="grid gap-ds-space-lg xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-ds-lg border border-ds-border bg-ds-surface p-ds-card-padding shadow-ds-xs">
          <div className="mb-ds-space-md text-ds-body font-semibold text-ds-text">Form Panel</div>
          <div className="grid gap-ds-space-sm lg:grid-cols-2">
            <div className="rounded-ds-md bg-ds-surface-muted px-ds-space-md py-ds-space-sm text-ds-label text-ds-muted">
              Nomor RM
            </div>
            <div className="rounded-ds-md bg-ds-surface-muted px-ds-space-md py-ds-space-sm text-ds-label text-ds-muted">
              Tanggal Kunjungan
            </div>
            <div className="rounded-ds-md bg-ds-surface-muted px-ds-space-md py-ds-space-sm text-ds-label text-ds-muted">
              Poli Tujuan
            </div>
            <div className="rounded-ds-md bg-ds-surface-muted px-ds-space-md py-ds-space-sm text-ds-label text-ds-muted">
              Metode Bayar
            </div>
          </div>
        </div>
        <div className="rounded-ds-lg border border-ds-border bg-ds-surface p-ds-card-padding shadow-ds-xs">
          <div className="mb-ds-space-md text-ds-body font-semibold text-ds-text">Summary</div>
          <div className="space-y-ds-space-sm text-ds-body text-ds-muted">
            <div className="flex items-center justify-between rounded-ds-md bg-ds-surface-muted px-ds-space-md py-ds-space-sm">
              <span>Antrian aktif</span>
              <DesktopBadge tone="accent">08</DesktopBadge>
            </div>
            <div className="flex items-center justify-between rounded-ds-md bg-ds-surface-muted px-ds-space-md py-ds-space-sm">
              <span>BPJS pending</span>
              <DesktopBadge tone="warning">03</DesktopBadge>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function DesktopMenuShell({
  title = 'Pendaftaran Pasien',
  subtitle = 'Hybrid shell preview dari design system desktop',
  brandMark,
  brandTitle = 'SIMRS Desktop',
  brandSubtitle = 'Hybrid Layout',
  moduleItems = DEFAULT_MODULES,
  activeModuleKey,
  onModuleSelect,
  sidebarItems = DEFAULT_SIDEBAR_ITEMS,
  activeSidebarKey,
  onSidebarSelect,
  sidebarCollapsed = false,
  sidebarFooter,
  tabs = DEFAULT_TABS,
  activeTabKey,
  onTabSelect,
  onTabClose,
  headerActions,
  statusBar,
  children
}: DesktopMenuShellProps) {
  const resolvedActiveModuleKey = activeModuleKey ?? moduleItems[1]?.key ?? moduleItems[0]?.key
  const resolvedActiveSidebarKey = activeSidebarKey ?? sidebarItems[0]?.key
  const resolvedActiveTabKey = activeTabKey ?? tabs[0]?.key

  return (
    <div className="flex h-screen min-h-ds-shell-min overflow-hidden bg-ds-background text-ds-text">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-ds-modulebar items-center gap-ds-space-xs border-b border-ds-border bg-ds-surface px-ds-space-sm">
          <div className="mr-ds-space-sm flex items-center gap-ds-space-xs border-r border-ds-border pr-ds-space-md">
            <div className="flex h-ds-module-brand w-ds-module-brand items-center justify-center overflow-hidden rounded-ds-md bg-ds-accent text-ds-accent-text text-ds-body font-bold">
              {brandMark ?? 'S'}
            </div>
            <div className="leading-[1.15]">
              <div className="text-ds-body font-semibold text-ds-text">{brandTitle}</div>
              <div className="text-ds-caption uppercase tracking-[0.08em] text-ds-subtle">
                {brandSubtitle}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-ds-space-xs overflow-x-auto">
            {moduleItems.map((module) => {
              const isActive = module.key === resolvedActiveModuleKey

              return (
                <button
                  key={module.key}
                  className={`flex h-ds-module-nav shrink-0 items-center gap-ds-space-xs rounded-ds-md px-ds-space-md text-ds-body font-medium transition-colors ${
                    isActive
                      ? 'bg-ds-accent-soft text-ds-accent'
                      : 'text-ds-muted hover:bg-ds-surface-muted hover:text-ds-text'
                  }`}
                  onClick={() => onModuleSelect?.(module.key)}
                  type="button"
                >
                  {module.icon ? (
                    <span className="flex h-ds-space-md w-ds-space-md items-center justify-center">
                      {module.icon}
                    </span>
                  ) : null}
                  <span>{module.label}</span>
                  {module.badge}
                </button>
              )
            })}
          </div>

          {headerActions ? (
            <div className="ml-ds-space-sm flex items-center gap-ds-space-sm">{headerActions}</div>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            className={`flex shrink-0 flex-col border-r border-ds-border bg-ds-surface-muted transition-[width] duration-200 ${
              sidebarCollapsed ? 'w-20' : 'w-ds-pagelist'
            }`}
          >
            <div className="border-b border-ds-border px-ds-card-padding py-ds-space-md">
              <div className={`text-ds-body font-semibold text-ds-text ${sidebarCollapsed ? 'hidden' : ''}`}>
                {title}
              </div>
              <div className={`mt-ds-space-xxs text-ds-label text-ds-muted ${sidebarCollapsed ? 'hidden' : ''}`}>
                {subtitle}
              </div>
            </div>

            <div className="flex-1 space-y-ds-space-xxs overflow-y-auto p-ds-space-sm">
              {sidebarItems.map((item) => {
                const isActive = item.key === resolvedActiveSidebarKey

                return (
                  <button
                    key={item.key}
                    className={`flex h-ds-menu-item w-full items-center gap-ds-space-xs rounded-ds-md px-ds-space-md text-left text-ds-body transition-colors ${
                      isActive
                        ? 'border border-ds-border bg-ds-surface font-semibold text-ds-accent'
                        : 'text-ds-muted hover:bg-ds-surface hover:text-ds-text'
                    } ${sidebarCollapsed ? 'justify-center px-ds-space-sm' : ''}`}
                    onClick={() => onSidebarSelect?.(item.key)}
                    type="button"
                  >
                    {item.icon ? (
                      <span className="flex h-ds-space-md w-ds-space-md items-center justify-center">
                        {item.icon}
                      </span>
                    ) : null}
                    <span className={`min-w-0 flex-1 truncate ${sidebarCollapsed ? 'hidden' : ''}`}>
                      {item.label}
                    </span>
                    {!sidebarCollapsed ? item.badge : null}
                  </button>
                )
              })}
            </div>

            {sidebarFooter ? (
              <div className="border-t border-ds-border px-ds-space-sm py-ds-space-sm">{sidebarFooter}</div>
            ) : null}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex h-ds-doc-tab items-end gap-ds-doc-tab-gap overflow-x-auto border-b border-ds-border bg-ds-surface-muted px-ds-space-sm">
              {tabs.map((tab) => {
                const isActive = tab.key === resolvedActiveTabKey

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
                    <span className="truncate">{tab.label}</span>
                    {tab.closable && onTabClose ? (
                      <span
                        aria-hidden="true"
                        className="rounded-ds-pill px-ds-space-xs py-[2px] text-ds-caption text-ds-subtle hover:bg-ds-surface-muted hover:text-ds-text"
                        onClick={(event) => {
                          event.stopPropagation()
                          onTabClose(tab.key)
                        }}
                      >
                        x
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-ds-page-padding">
              {children ?? <DefaultPreviewContent />}
            </div>

            <div className="flex h-ds-statusbar items-center gap-ds-space-md border-t border-ds-border bg-ds-surface px-ds-space-md text-ds-caption text-ds-subtle">
              {statusBar ?? (
                <>
                  <span className="font-semibold text-ds-muted">Server online</span>
                  <span>Shift pagi</span>
                  <span className="ml-auto">SIMRS Desktop Preview</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
