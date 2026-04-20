import { DesktopBadge } from '../atoms/DesktopBadge'
import { DesktopButton } from '../atoms/DesktopButton'

const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'pendaftaran', label: 'Pendaftaran', badge: '24' },
  { key: 'rawat-jalan', label: 'Rawat Jalan', badge: '142' },
  { key: 'rawat-inap', label: 'Rawat Inap' },
  { key: 'igd', label: 'IGD', badge: '7' }
]

const PAGE_GROUPS = [
  {
    title: 'Operasional',
    items: [
      { label: 'Pendaftaran Baru', active: true },
      { label: 'Cari Pasien' },
      { label: 'Antrian Pendaftaran', badge: '8' }
    ]
  },
  {
    title: 'BPJS',
    items: [{ label: 'Cek Eligibilitas' }, { label: 'Penerbitan SEP' }]
  }
]

const DOC_TABS = ['Pendaftaran Baru', 'Cari Pasien', 'Antrian Pendaftaran']

export interface DesktopMenuShellProps {
  title?: string
  subtitle?: string
}

export function DesktopMenuShell({
  title = 'Pendaftaran Pasien',
  subtitle = 'Hybrid shell preview dari design system desktop'
}: DesktopMenuShellProps) {
  return (
    <div className="overflow-hidden rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-background)] shadow-[var(--ds-shadow-md)]">
      <div className="flex h-[var(--ds-layout-modulebar-h)] items-center gap-[var(--ds-space-xs)] border-b border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-sm)]">
        <div className="mr-[var(--ds-space-sm)] flex items-center gap-[var(--ds-space-xs)] border-r border-[var(--ds-color-border)] pr-[var(--ds-space-md)]">
          <div className="flex h-[var(--ds-layout-module-brand-size)] w-[var(--ds-layout-module-brand-size)] items-center justify-center rounded-[var(--ds-radius-md)] bg-[var(--ds-color-accent)] text-[var(--ds-color-accent-text)] text-[length:var(--ds-font-size-body)] font-bold">
            S
          </div>
          <div className="leading-[1.15]">
            <div className="text-[length:var(--ds-font-size-body)] font-semibold text-[var(--ds-color-text)]">
              SIMRS Desktop
            </div>
            <div className="text-[length:var(--ds-font-size-caption)] uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
              Hybrid Layout
            </div>
          </div>
        </div>
        {MODULES.map((module) => (
          <button
            key={module.key}
            className={`flex h-[var(--ds-layout-module-nav-h)] items-center gap-[var(--ds-space-xs)] rounded-[var(--ds-radius-md)] px-[var(--ds-space-md)] text-[length:var(--ds-font-size-body)] font-medium ${
              module.key === 'pendaftaran'
                ? 'bg-[var(--ds-color-accent-soft)] text-[var(--ds-color-accent)]'
                : 'text-[var(--ds-color-text-muted)] hover:bg-[var(--ds-color-surface-muted)]'
            }`}
            type="button"
          >
            <span>{module.label}</span>
            {module.badge ? <DesktopBadge tone="accent">{module.badge}</DesktopBadge> : null}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-[var(--ds-space-sm)]">
          <DesktopButton emphasis="ghost" size="small">
            Search
          </DesktopButton>
          <div className="rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-sm)] py-[var(--ds-space-xs)] text-[length:var(--ds-font-size-label)] text-[var(--ds-color-text-muted)]">
            Sri Wulandari · Admin
          </div>
        </div>
      </div>

      <div className="grid min-h-[var(--ds-layout-shell-min-h)] grid-cols-[var(--ds-layout-pagelist-w)_1fr]">
        <aside className="border-r border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)]">
          <div className="border-b border-[var(--ds-color-border)] px-[var(--ds-card-padding)] py-[var(--ds-space-md)]">
            <div className="text-[length:var(--ds-font-size-body)] font-semibold text-[var(--ds-color-text)]">
              {title}
            </div>
            <div className="mt-[var(--ds-space-xxs)] text-[length:var(--ds-font-size-label)] text-[var(--ds-color-text-muted)]">
              {subtitle}
            </div>
          </div>
          <div className="space-y-[var(--ds-space-sm)] p-[var(--ds-space-sm)]">
            {PAGE_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="px-[var(--ds-space-sm)] py-[var(--ds-space-xs)] text-[length:var(--ds-font-size-caption)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                  {group.title}
                </div>
                <div className="space-y-[var(--ds-space-xxs)]">
                  {group.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={`flex h-[var(--ds-menu-item-h)] w-full items-center gap-[var(--ds-space-xs)] rounded-[var(--ds-radius-md)] px-[var(--ds-space-md)] text-left text-[length:var(--ds-font-size-body)] ${
                        item.active
                          ? 'border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] font-semibold text-[var(--ds-color-accent)]'
                          : 'text-[var(--ds-color-text-muted)] hover:bg-[var(--ds-color-surface)]'
                      }`}
                    >
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? <DesktopBadge>{item.badge}</DesktopBadge> : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="flex h-[var(--ds-layout-doc-tab-h)] items-end gap-[var(--ds-layout-doc-tab-gap)] overflow-x-auto border-b border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-sm)]">
            {DOC_TABS.map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={`mt-[var(--ds-layout-doc-tab-offset-y)] flex h-[var(--ds-layout-doc-tab-button-h)] max-w-[var(--ds-layout-doc-tab-max-w)] items-center rounded-t-[var(--ds-radius-md)] border border-[var(--ds-color-border)] px-[var(--ds-space-md)] text-[length:var(--ds-font-size-label)] ${
                  index === 0
                    ? 'border-b-transparent bg-[var(--ds-color-surface)] font-semibold text-[var(--ds-color-text)]'
                    : 'bg-[var(--ds-color-surface-raised)] text-[var(--ds-color-text-muted)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 p-[var(--ds-layout-page-padding)]">
            <div className="mb-[var(--ds-space-lg)] flex items-end gap-[var(--ds-space-md)]">
              <div className="min-w-0 flex-1">
                <h3 className="text-[length:var(--ds-font-size-title)] font-semibold text-[var(--ds-color-text)]">
                  Pendaftaran Baru
                </h3>
                <p className="mt-[var(--ds-space-xxs)] text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]">
                  Layout hybrid menjaga module bar, page list, MDI tabs, dan content region tetap
                  padat seperti desktop app operasional.
                </p>
              </div>
              <DesktopButton emphasis="primary">Buat Pendaftaran</DesktopButton>
            </div>

            <div className="grid gap-[var(--ds-space-lg)] xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-card-padding)] shadow-[var(--ds-shadow-xs)]">
                <div className="mb-[var(--ds-space-md)] text-[length:var(--ds-font-size-body)] font-semibold text-[var(--ds-color-text)]">
                  Form Panel
                </div>
                <div className="grid gap-[var(--ds-space-sm)] lg:grid-cols-2">
                  <div className="rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)] text-[length:var(--ds-font-size-label)] text-[var(--ds-color-text-muted)]">
                    Nomor RM
                  </div>
                  <div className="rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)] text-[length:var(--ds-font-size-label)] text-[var(--ds-color-text-muted)]">
                    Tanggal Kunjungan
                  </div>
                  <div className="rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)] text-[length:var(--ds-font-size-label)] text-[var(--ds-color-text-muted)]">
                    Poli Tujuan
                  </div>
                  <div className="rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)] text-[length:var(--ds-font-size-label)] text-[var(--ds-color-text-muted)]">
                    Metode Bayar
                  </div>
                </div>
              </div>
              <div className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-card-padding)] shadow-[var(--ds-shadow-xs)]">
                <div className="mb-[var(--ds-space-md)] text-[length:var(--ds-font-size-body)] font-semibold text-[var(--ds-color-text)]">
                  Summary
                </div>
                <div className="space-y-[var(--ds-space-sm)] text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]">
                  <div className="flex items-center justify-between rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)]">
                    <span>Antrian aktif</span>
                    <DesktopBadge tone="accent">08</DesktopBadge>
                  </div>
                  <div className="flex items-center justify-between rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)]">
                    <span>BPJS pending</span>
                    <DesktopBadge tone="warning">03</DesktopBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-[var(--ds-layout-statusbar-h)] items-center gap-[var(--ds-space-md)] border-t border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-md)] text-[length:var(--ds-font-size-caption)] text-[var(--ds-color-text-subtle)]">
            <span className="font-semibold text-[var(--ds-color-text-muted)]">Server online</span>
            <span>Shift pagi</span>
            <span className="ml-auto">SIMRS Desktop Preview</span>
          </div>
        </div>
      </div>
    </div>
  )
}
