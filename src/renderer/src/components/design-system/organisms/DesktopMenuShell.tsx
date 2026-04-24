import type { ReactNode } from 'react'

import { DesktopBadge } from '../atoms/DesktopBadge'
import { DesktopButton } from '../atoms/DesktopButton'
import { DesktopIcon } from '../atoms/DesktopIcon'
import { DesktopPageHeader } from './DesktopPageHeader'
import { DesktopDocTabs } from './DesktopDocTabs'
import { DesktopModuleBar } from './DesktopModuleBar'
import { DesktopPageList } from './DesktopPageList'
import { DesktopStatusBar } from './DesktopStatusBar'
import type {
  DesktopDocTabItem,
  DesktopModuleBarItem,
  DesktopPageListGroup
} from './desktop-shell.helpers'

export type DesktopMenuShellNavItem = DesktopModuleBarItem
export type DesktopMenuShellTabItem = DesktopDocTabItem

const DEFAULT_MODULES: DesktopMenuShellNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <DesktopIcon name="dashboard" size={14} /> },
  {
    key: 'pendaftaran',
    label: 'Pendaftaran',
    icon: <DesktopIcon name="id" size={14} />,
    badge: <DesktopBadge tone="accent">24</DesktopBadge>
  },
  {
    key: 'rawat-jalan',
    label: 'Rawat Jalan',
    icon: <DesktopIcon name="users" size={14} />,
    badge: <DesktopBadge tone="accent">142</DesktopBadge>
  },
  { key: 'rawat-inap', label: 'Rawat Inap', icon: <DesktopIcon name="bed" size={14} /> },
  {
    key: 'igd',
    label: 'IGD',
    icon: <DesktopIcon name="heart" size={14} />,
    badge: <DesktopBadge tone="warning">7</DesktopBadge>
  }
]

const DEFAULT_SIDEBAR_ITEMS: DesktopPageListGroup[] = [
  {
    key: 'operasional',
    label: 'Operasional',
    items: [
      {
        key: 'pendaftaran-baru',
        label: 'Pendaftaran Baru',
        icon: <DesktopIcon name="plus" size={14} />
      },
      {
        key: 'cari-pasien',
        label: 'Cari Pasien',
        icon: <DesktopIcon name="search" size={14} />
      },
      {
        key: 'antrian-pendaftaran',
        label: 'Antrian Pendaftaran',
        icon: <DesktopIcon name="clock" size={14} />,
        badge: <DesktopBadge>8</DesktopBadge>
      }
    ]
  }
]

const DEFAULT_TABS: DesktopMenuShellTabItem[] = [
  {
    key: 'pendaftaran-baru',
    label: 'Pendaftaran Baru',
    closable: true,
    icon: <DesktopIcon name="plus" size={12} />
  },
  {
    key: 'cari-pasien',
    label: 'Cari Pasien',
    closable: true,
    icon: <DesktopIcon name="search" size={12} />
  },
  {
    key: 'antrian-pendaftaran',
    label: 'Antrian Pendaftaran',
    closable: true,
    icon: <DesktopIcon name="clock" size={12} />
  }
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
  sidebarItems?: DesktopPageListGroup[]
  sidebarIcon?: ReactNode
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
      <DesktopPageHeader
        eyebrow="Pendaftaran"
        title="Pendaftaran Baru"
        subtitle="Layout hybrid menjaga module bar, page list, MDI tabs, dan content region tetap padat seperti desktop app operasional."
        status="Desktop Preview"
        actions={<DesktopButton emphasis="primary">Buat Pendaftaran</DesktopButton>}
      />

      <div className="mt-ds-space-lg grid gap-ds-space-lg xl:grid-cols-[1.2fr_0.8fr]">
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
  sidebarIcon,
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
  const flattenedSidebarItems = sidebarItems.flatMap((group) => group.items)
  const resolvedActiveModuleKey = activeModuleKey ?? moduleItems[1]?.key ?? moduleItems[0]?.key
  const resolvedActiveSidebarKey = activeSidebarKey ?? flattenedSidebarItems[0]?.key
  const resolvedActiveTabKey = activeTabKey ?? tabs[0]?.key
  const resolvedStatusBar = statusBar ?? (
    <DesktopStatusBar
      leftItems={[
        {
          key: 'server',
          content: <span className="font-semibold text-ds-muted">Server online</span>
        },
        { key: 'shift', content: <span>Shift pagi</span> }
      ]}
      rightItems={[{ key: 'preview', content: <span>SIMRS Desktop Preview</span> }]}
    />
  )

  return (
    <div className="flex h-screen min-h-ds-shell-min flex-col overflow-hidden bg-ds-background text-ds-text">
      <DesktopModuleBar
        items={moduleItems}
        activeKey={resolvedActiveModuleKey}
        brandMark={brandMark}
        brandTitle={brandTitle}
        brandSubtitle={brandSubtitle}
        actions={headerActions}
        onSelect={onModuleSelect}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <DesktopPageList
          groups={sidebarItems}
          icon={sidebarIcon}
          activeKey={resolvedActiveSidebarKey}
          title={title}
          subtitle={subtitle}
          collapsed={sidebarCollapsed}
          footer={sidebarFooter}
          onSelect={onSidebarSelect}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-ds-background-elevated">
          <DesktopDocTabs
            tabs={tabs}
            activeKey={resolvedActiveTabKey}
            onTabSelect={onTabSelect}
            onTabClose={onTabClose}
          />

          <div className="flex-1 overflow-y-auto p-ds-page-padding">
            {children ?? <DefaultPreviewContent />}
          </div>
        </div>
      </div>

      {resolvedStatusBar}
    </div>
  )
}
