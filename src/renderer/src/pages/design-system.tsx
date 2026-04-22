import { DesktopAvatar } from '@renderer/components/design-system/atoms/DesktopAvatar'
import { DesktopBadge } from '@renderer/components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '@renderer/components/design-system/atoms/DesktopButton'
import { DesktopIcon } from '@renderer/components/design-system/atoms/DesktopIcon'
import { DesktopKeyboardShortcut } from '@renderer/components/design-system/atoms/DesktopKeyboardShortcut'
import { DesktopProgressBar } from '@renderer/components/design-system/atoms/DesktopProgressBar'
import { DesktopStatusDot } from '@renderer/components/design-system/atoms/DesktopStatusDot'
import { DesktopTag } from '@renderer/components/design-system/atoms/DesktopTag'
import {
  desktopThemeTokens,
  type DesktopThemeTokens
} from '@renderer/components/design-system/foundation/desktop-theme'
import { CopyCodeButton } from '@renderer/components/design-system/molecules/CopyCodeButton'
import { DesktopCard } from '@renderer/components/design-system/molecules/DesktopCard'
import { DesktopFormField } from '@renderer/components/design-system/molecules/DesktopFormField'
import { DesktopInput } from '@renderer/components/design-system/molecules/DesktopInput'
import { DesktopInputField } from '@renderer/components/design-system/molecules/DesktopInputField'
import { DesktopNotificationItem } from '@renderer/components/design-system/molecules/DesktopNotificationItem'
import { DesktopSegmentedControl } from '@renderer/components/design-system/molecules/DesktopSegmentedControl'
import { DesktopStatCard } from '@renderer/components/design-system/molecules/DesktopStatCard'
import { DesktopContentTabs } from '@renderer/components/design-system/organisms/DesktopContentTabs'
import { DesktopDocTabs } from '@renderer/components/design-system/organisms/DesktopDocTabs'
import {
  DesktopGenericTable,
  type DesktopGenericTableProps
} from '@renderer/components/design-system/organisms/DesktopGenericTable'
import { DesktopMenuShell } from '@renderer/components/design-system/organisms/DesktopMenuShell'
import { DesktopModuleBar } from '@renderer/components/design-system/organisms/DesktopModuleBar'
import { DesktopPageHeader } from '@renderer/components/design-system/organisms/DesktopPageHeader'
import { DesktopPageList } from '@renderer/components/design-system/organisms/DesktopPageList'
import { DesktopStatusBar } from '@renderer/components/design-system/organisms/DesktopStatusBar'
import { DesktopTable } from '@renderer/components/design-system/organisms/DesktopTable'
import { THEME_REGISTRY } from '@renderer/themes'
import type { ColumnsType } from 'antd/es/table'
import type * as React from 'react'
import {
  DESIGN_SYSTEM_COMPONENTS,
  type DesignSystemCatalogItem,
  type DesignSystemCategory
} from './design-system.registry'

type VisitQueueRow = {
  id: string
  queueNo: string
  patient: string
  doctor: string
  payer: string
  status: string
}

type SwatchDefinition = {
  key: string
  label: string
  description: string
  value: string
}

type DesktopCardComponentProps = React.ComponentProps<typeof DesktopCard>

const CATEGORY_ORDER: DesignSystemCategory[] = [
  'Actions',
  'Identity & Status',
  'Inputs & Forms',
  'Navigation & Shell',
  'Data Display'
]

const TYPOGRAPHY_PREVIEW = [
  {
    key: 'hero',
    label: 'Hero',
    size: desktopThemeTokens.typography.heroFontSize,
    weight: 700,
    sample: 'Antrian operasional dirancang desktop-first'
  },
  {
    key: 'title',
    label: 'Title',
    size: desktopThemeTokens.typography.titleFontSize,
    weight: 700,
    sample: 'Ringkasan pendaftaran pasien hari ini'
  },
  {
    key: 'body',
    label: 'Body',
    size: desktopThemeTokens.typography.baseFontSize,
    weight: 500,
    sample: 'Inter dipakai sebagai font utama untuk menjaga keterbacaan dan density tinggi.'
  },
  {
    key: 'label',
    label: 'Label',
    size: desktopThemeTokens.typography.labelFontSize,
    weight: 700,
    sample: 'POLI TUJUAN'
  },
  {
    key: 'caption',
    label: 'Caption',
    size: desktopThemeTokens.typography.captionFontSize,
    weight: 600,
    sample: 'Desktop theme tokens'
  }
] as const

const COLOR_SWATCHES: SwatchDefinition[] = [
  {
    key: 'accent',
    label: 'Accent',
    description: 'Biru operasional utama untuk action dan focus state.',
    value: desktopThemeTokens.colors.accent
  },
  {
    key: 'accent-soft',
    label: 'Accent Soft',
    description: 'Background selected state dan badge.',
    value: desktopThemeTokens.colors.accentSoft
  },
  {
    key: 'surface',
    label: 'Surface',
    description: 'Permukaan card dan panel utama.',
    value: desktopThemeTokens.colors.surface
  },
  {
    key: 'background',
    label: 'Background',
    description: 'Canvas shell hybrid dan page background.',
    value: desktopThemeTokens.colors.background
  },
  {
    key: 'border',
    label: 'Border',
    description: 'Divider, table line, dan card outline.',
    value: desktopThemeTokens.colors.border
  },
  {
    key: 'text',
    label: 'Text',
    description: 'Body text utama.',
    value: desktopThemeTokens.colors.text
  },
  {
    key: 'success',
    label: 'Success',
    description: 'Status sukses dan highlight operasional.',
    value: desktopThemeTokens.colors.success
  },
  {
    key: 'danger',
    label: 'Danger',
    description: 'Destructive action dan warning kritis.',
    value: desktopThemeTokens.colors.danger
  }
]

const QUEUE_ROWS: VisitQueueRow[] = [
  {
    id: 'VIS-001',
    queueNo: 'A-001',
    patient: 'Dian Permata',
    doctor: 'dr. Putri Handayani',
    payer: 'BPJS',
    status: 'Menunggu Verifikasi'
  },
  {
    id: 'VIS-002',
    queueNo: 'A-002',
    patient: 'Lukman Hakim',
    doctor: 'dr. Fajar Nugraha',
    payer: 'Umum',
    status: 'Siap Dipanggil'
  },
  {
    id: 'VIS-003',
    queueNo: 'A-003',
    patient: 'Maya Rahmawati',
    doctor: 'dr. Nita Safitri',
    payer: 'Asuransi',
    status: 'Dokumen Kurang'
  }
]

const TABLE_COLUMNS: ColumnsType<VisitQueueRow> = [
  { title: 'No. Antrian', dataIndex: 'queueNo', key: 'queueNo', width: 120 },
  { title: 'Pasien', dataIndex: 'patient', key: 'patient' },
  { title: 'Dokter', dataIndex: 'doctor', key: 'doctor' },
  { title: 'Pembayar', dataIndex: 'payer', key: 'payer', width: 120 },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 180,
    render: (value: string) => {
      const tone =
        value === 'Siap Dipanggil'
          ? 'success'
          : value === 'Dokumen Kurang'
            ? 'warning'
            : 'accent'

      return <DesktopBadge tone={tone}>{value}</DesktopBadge>
    }
  }
]

const TABLE_ACTION: DesktopGenericTableProps<VisitQueueRow>['action'] = {
  fixedRight: true,
  items: (record) => [
    {
      label: 'Lihat Detail',
      icon: <DesktopIcon name="search" size={14} />,
      type: 'link',
      onClick: () => void record.id
    },
    {
      label: 'Ubah Data',
      icon: <DesktopIcon name="settings" size={14} />,
      type: 'link',
      onClick: () => void record.id
    },
    {
      label: 'Batalkan',
      icon: <DesktopIcon name="x" size={14} />,
      danger: true,
      type: 'text',
      confirm: {
        title: `Batalkan antrian ${record.queueNo}?`,
        description: 'Tindakan ini hanya preview untuk dokumentasi design system.'
      },
      onClick: () => void record.id
    }
  ]
}

function swatchStyle(color: string) {
  return { backgroundColor: color }
}

function groupCatalogItems() {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: DESIGN_SYSTEM_COMPONENTS.filter((item) => item.category === category)
  }))
}

function TokenPanel({
  title,
  subtitle,
  children,
  extra
}: {
  title: string
  subtitle: string
  children: DesktopCardComponentProps['children']
  extra?: DesktopCardComponentProps['extra']
}) {
  return (
    <DesktopCard title={title} subtitle={subtitle} extra={extra}>
      {children}
    </DesktopCard>
  )
}

function ShowcaseCard({
  item,
  children
}: {
  item: DesignSystemCatalogItem
  children: DesktopCardComponentProps['children']
}) {
  return (
    <DesktopCard
      title={item.title}
      subtitle={item.description}
      extra={<CopyCodeButton value={item.codeSnippet} />}
    >
      <div className="grid gap-[var(--ds-space-lg)] xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-card-padding)]">
          <div className="mb-[var(--ds-space-sm)] text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
            Preview
          </div>
          {children}
        </div>
        <div className="space-y-[var(--ds-space-md)]">
          <div>
            <div className="mb-[var(--ds-space-sm)] text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
              Payload Props
            </div>
            <div className="overflow-hidden rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)]">
              {item.props.map((prop, index) => (
                <div
                  key={prop.name}
                  className={`grid grid-cols-[132px_1fr] gap-[var(--ds-space-sm)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)] ${
                    index === 0 ? '' : 'border-t border-[var(--ds-color-border)]'
                  }`}
                >
                  <div className="text-[length:var(--ds-font-size-body)] font-semibold text-[var(--ds-color-text)]">
                    {prop.name}
                  </div>
                  <div>
                    <div className="font-mono text-[length:var(--ds-font-size-label)] text-[var(--ds-color-accent)]">
                      {prop.type}
                    </div>
                    <div className="mt-[var(--ds-space-xxs)] text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]">
                      {prop.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-[var(--ds-space-sm)] flex items-center justify-between gap-[var(--ds-space-sm)]">
              <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                Usage Snippet
              </div>
              <CopyCodeButton value={item.codeSnippet} label="Copy JSX" />
            </div>
            <pre className="overflow-x-auto rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-card-padding)] text-[length:var(--ds-font-size-label)] leading-[1.6] text-[var(--ds-color-text)]">
              <code>{item.codeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </DesktopCard>
  )
}

function renderComponentPreview(itemId: string) {
  switch (itemId) {
    case 'desktop-button':
      return (
        <div className="flex flex-wrap gap-[var(--ds-space-sm)]">
          <DesktopButton emphasis="primary" icon={<DesktopIcon name="plus" size={14} />}>
            Primary
          </DesktopButton>
          <DesktopButton emphasis="secondary">Secondary</DesktopButton>
          <DesktopButton emphasis="toolbar" icon={<DesktopIcon name="filter" size={14} />}>
            Toolbar
          </DesktopButton>
          <DesktopButton emphasis="quiet">Quiet</DesktopButton>
          <DesktopButton emphasis="danger">Batalkan</DesktopButton>
        </div>
      )

    case 'desktop-badge':
      return (
        <div className="flex flex-wrap gap-[var(--ds-space-sm)]">
          <DesktopBadge tone="accent">24 Baru</DesktopBadge>
          <DesktopBadge tone="success">Online</DesktopBadge>
          <DesktopBadge tone="warning">Pending</DesktopBadge>
          <DesktopBadge tone="danger">Rejected</DesktopBadge>
        </div>
      )

    case 'desktop-tag':
      return (
        <div className="flex flex-wrap gap-[var(--ds-space-sm)]">
          <DesktopTag tone="accent">BPJS</DesktopTag>
          <DesktopTag tone="success" icon={<DesktopIcon name="check" size={12} />}>
            Tervalidasi
          </DesktopTag>
          <DesktopTag tone="warning">Perlu Review</DesktopTag>
        </div>
      )

    case 'desktop-avatar':
      return (
        <div className="flex items-center gap-[var(--ds-space-sm)]">
          <DesktopAvatar label="SW" />
          <DesktopAvatar label="RJ" size="lg" />
          <DesktopAvatar icon={<DesktopIcon name="bell" size={14} />} tone="neutral" />
        </div>
      )

    case 'desktop-status-dot':
      return (
        <div className="flex flex-wrap gap-[var(--ds-space-md)]">
          <DesktopStatusDot status="success" label="Server online" />
          <DesktopStatusDot status="warning" label="Sinkronisasi tertunda" />
          <DesktopStatusDot status="danger" label="Bridging gagal" />
        </div>
      )

    case 'desktop-progress-bar':
      return <DesktopProgressBar value={72} />

    case 'desktop-icon':
      return (
        <div className="grid grid-cols-4 gap-[var(--ds-space-sm)] md:grid-cols-6">
          {['dashboard', 'users', 'bed', 'bell', 'shield', 'chart', 'plus', 'filter'].map(
            (name) => (
              <div
                key={name}
                className="flex flex-col items-center gap-[var(--ds-space-xs)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-sm)]"
              >
                <DesktopIcon name={name} size={18} />
                <span className="text-[length:var(--ds-font-size-caption)] text-[var(--ds-color-text-muted)]">
                  {name}
                </span>
              </div>
            )
          )}
        </div>
      )

    case 'desktop-keyboard-shortcut':
      return (
        <div className="flex flex-wrap gap-[var(--ds-space-md)]">
          <DesktopKeyboardShortcut keys={['Ctrl', 'P']} />
          <DesktopKeyboardShortcut keys={['Ctrl', 'Shift', 'F']} />
          <DesktopKeyboardShortcut keys={['Alt', 'F4']} />
        </div>
      )

    case 'desktop-input':
      return (
        <div className="grid gap-[var(--ds-space-md)] lg:grid-cols-2">
          <DesktopInput placeholder="Cari pasien" />
          <DesktopInput
            type="select"
            placeholder="Pilih poli"
            options={[
              { label: 'Poli Anak', value: 'anak' },
              { label: 'Poli Interna', value: 'interna' }
            ]}
          />
        </div>
      )

    case 'desktop-input-field':
      return (
        <div className="grid gap-[var(--ds-space-md)] lg:grid-cols-2">
          <DesktopInputField
            label="Nomor Rekam Medis"
            placeholder="Cari pasien"
            hint="Gunakan pencarian cepat dengan nomor RM atau nama."
            required
          />
          <DesktopInputField
            label="Poli Tujuan"
            type="select"
            placeholder="Pilih poli"
            options={[
              { label: 'Poli Anak', value: 'anak' },
              { label: 'Poli Interna', value: 'interna' },
              { label: 'Poli Bedah', value: 'bedah' }
            ]}
          />
        </div>
      )

    case 'desktop-segmented-control':
      return (
        <DesktopSegmentedControl
          value="active"
          options={[
            { label: 'Aktif', value: 'active' },
            { label: 'Selesai', value: 'done' },
            { label: 'Arsip', value: 'archive' }
          ]}
        />
      )

    case 'desktop-form-field':
      return (
        <DesktopFormField label="Nomor SEP" hint="Nomor akan diverifikasi otomatis.">
          <DesktopInput placeholder="Masukkan nomor SEP" />
        </DesktopFormField>
      )

    case 'desktop-card':
      return (
        <DesktopCard
          title="Ringkasan Antrian"
          subtitle="Snapshot operasional 08:30 WIB"
          extra={<DesktopBadge tone="accent">Live</DesktopBadge>}
          compact
        >
          <div className="space-y-[var(--ds-space-sm)] text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]">
            <div className="flex items-center justify-between rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)]">
              <span>Antrian aktif</span>
              <strong className="text-[var(--ds-color-text)]">18</strong>
            </div>
            <div className="flex items-center justify-between rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)]">
              <span>SEP pending</span>
              <DesktopBadge tone="warning">03</DesktopBadge>
            </div>
          </div>
        </DesktopCard>
      )

    case 'desktop-stat-card':
      return <DesktopStatCard title="Pasien Hari Ini" value="128" delta="+8.2%" trend="up" />

    case 'desktop-content-tabs':
      return (
        <DesktopContentTabs
          items={[
            { key: 'overview', label: 'Overview', children: <div className="py-4">Overview tab</div> },
            { key: 'detail', label: 'Detail', children: <div className="py-4">Detail tab</div> }
          ]}
          activeKey="overview"
        />
      )

    case 'desktop-doc-tabs':
      return (
        <DesktopDocTabs
          activeKey="queue"
          tabs={[
            {
              key: 'registration',
              label: 'Pendaftaran Baru',
              closable: true,
              icon: <DesktopIcon name="plus" size={12} />
            },
            {
              key: 'queue',
              label: 'Antrian Pendaftaran',
              closable: true,
              dirty: true,
              icon: <DesktopIcon name="clock" size={12} />
            }
          ]}
        />
      )

    case 'desktop-table':
      return <DesktopTable rowKey="id" columns={TABLE_COLUMNS} dataSource={QUEUE_ROWS} />

    case 'desktop-menu-shell':
      return <DesktopMenuShell />

    case 'desktop-page-header':
      return (
        <DesktopPageHeader
          eyebrow="Rawat Jalan"
          title="Antrian Aktif"
          subtitle="Queue operasional poli hari ini"
          status="Live"
          actions={
            <div className="flex gap-[var(--ds-space-sm)]">
              <DesktopButton emphasis="toolbar" icon={<DesktopIcon name="filter" size={14} />}>
                Filter
              </DesktopButton>
              <DesktopButton emphasis="primary" icon={<DesktopIcon name="plus" size={14} />}>
                Panggil Berikutnya
              </DesktopButton>
            </div>
          }
        />
      )

    case 'desktop-module-bar':
      return (
        <DesktopModuleBar
          activeKey="registration"
          items={[
            { key: 'dashboard', label: 'Dashboard', icon: <DesktopIcon name="dashboard" size={14} /> },
            {
              key: 'registration',
              label: 'Pendaftaran',
              icon: <DesktopIcon name="id" size={14} />,
              badge: <DesktopBadge tone="accent">24</DesktopBadge>
            },
            {
              key: 'outpatient',
              label: 'Rawat Jalan',
              icon: <DesktopIcon name="users" size={14} />,
              badge: <DesktopBadge tone="accent">142</DesktopBadge>
            }
          ]}
        />
      )

    case 'desktop-page-list':
      return (
        <DesktopPageList
          activeKey="queue"
          groups={[
            {
              key: 'ops',
              label: 'Operasional',
              items: [
                {
                  key: 'registration',
                  label: 'Pendaftaran Baru',
                  icon: <DesktopIcon name="plus" size={14} />
                },
                {
                  key: 'queue',
                  label: 'Antrian Aktif',
                  icon: <DesktopIcon name="clock" size={14} />,
                  badge: <DesktopBadge>8</DesktopBadge>
                }
              ]
            }
          ]}
        />
      )

    case 'desktop-status-bar':
      return (
        <DesktopStatusBar
          leftItems={[
            { key: 'server', content: <DesktopStatusDot status="success" label="Terhubung" /> },
            { key: 'shift', content: <span>Shift pagi</span> }
          ]}
          rightItems={[
            { key: 'records', content: <span>Record 142/142</span> },
            { key: 'version', content: <span>v4.12.1</span> }
          ]}
        />
      )

    case 'desktop-notification-item':
      return (
        <DesktopNotificationItem
          id="notif-1"
          title="Bridging BPJS selesai"
          body="SEP pasien A-003 berhasil diterbitkan dan siap dicetak."
          time="2 menit lalu"
          status="success"
          avatarLabel="BP"
          unread
          action={<DesktopButton emphasis="ghost">Buka</DesktopButton>}
        />
      )

    case 'desktop-generic-table':
      return (
        <DesktopGenericTable<VisitQueueRow>
          rowKey="id"
          columns={TABLE_COLUMNS}
          dataSource={QUEUE_ROWS}
          action={TABLE_ACTION}
        />
      )

    default:
      return null
  }
}

function formatTokenValue(value: number) {
  return `${value}px`
}

function renderSpacingPreview(scale: DesktopThemeTokens['spacing']) {
  return Object.entries(scale).map(([name, value]) => (
    <div
      key={name}
      className="grid grid-cols-[60px_1fr_56px] items-center gap-[var(--ds-space-sm)]"
    >
      <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.06em] text-[var(--ds-color-text-subtle)]">
        {name}
      </div>
      <div className="rounded-[var(--ds-radius-sm)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-sm)] py-[var(--ds-space-sm)]">
        <div
          className="h-[10px] rounded-[var(--ds-radius-pill)] bg-[var(--ds-color-accent)]"
          style={{ width: formatTokenValue(value) }}
        />
      </div>
      <div className="text-right font-mono text-[length:var(--ds-font-size-label)] text-[var(--ds-color-text-muted)]">
        {formatTokenValue(value)}
      </div>
    </div>
  ))
}

function DesignSystemPage() {
  const activeTheme = THEME_REGISTRY.desktop

  return (
    <div className="min-h-screen bg-[var(--ds-color-background)] px-[var(--ds-layout-page-padding)] py-[var(--ds-space-xl)] text-[var(--ds-color-text)]">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-[var(--ds-layout-section-gap)]">
        <DesktopCard
          title="Desktop Design System"
          subtitle="Source of truth untuk wrapper AntD, token visual, dan hybrid shell preview di Electron renderer."
          extra={<DesktopBadge tone="accent">desktop</DesktopBadge>}
        >
          <div className="grid gap-[var(--ds-space-lg)] xl:grid-cols-[1.3fr_0.7fr]">
            <div>
              <div
                className="text-[length:var(--ds-font-size-hero)] font-semibold leading-[1.1] text-[var(--ds-color-text)]"
                style={{ fontSize: 'var(--ds-font-size-hero)' }}
              >
                Layout hybrid, density desktop, dan tokenized overrides untuk Ant Design.
              </div>
              <p className="mt-[var(--ds-space-md)] max-w-[980px] text-[length:var(--ds-font-size-body)] leading-[1.7] text-[var(--ds-color-text-muted)]">
                Halaman ini adalah katalog hidup untuk theme <strong>desktop</strong>. Semua
                wrapper baru hidup paralel dengan komponen legacy, memakai token terpusat, dan
                wajib tampil di sini lengkap dengan payload props serta usage snippet JSX.
              </p>
              <div className="mt-[var(--ds-space-lg)] flex flex-wrap gap-[var(--ds-space-sm)]">
                <DesktopButton emphasis="primary" icon={<DesktopIcon name="plus" size={14} />}>
                  Primary Action
                </DesktopButton>
                <DesktopButton emphasis="toolbar" icon={<DesktopIcon name="filter" size={14} />}>
                  Filter Toolbar
                </DesktopButton>
                <DesktopBadge tone="success">Inter bundled locally</DesktopBadge>
              </div>
            </div>
            <div className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-card-padding)] shadow-[var(--ds-shadow-xs)]">
              <div className="mb-[var(--ds-space-md)] text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                Theme Scope
              </div>
              <div className="space-y-[var(--ds-space-md)]">
                <div>
                  <div className="text-[length:var(--ds-font-size-body)] font-semibold text-[var(--ds-color-text)]">
                    Theme aktif
                  </div>
                  <div className="mt-[var(--ds-space-xxs)] text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]">
                    {activeTheme?.desc}
                  </div>
                </div>
                <div className="grid gap-[var(--ds-space-sm)]">
                  <div className="flex items-center justify-between rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)]">
                    <span className="text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]">
                      Provider boundary
                    </span>
                    <DesktopBadge tone="accent">Isolated</DesktopBadge>
                  </div>
                  <div className="flex items-center justify-between rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)]">
                    <span className="text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]">
                      Theme exposure
                    </span>
                    <DesktopBadge tone="success">Local only</DesktopBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DesktopCard>

        <div className="grid gap-[var(--ds-space-lg)] xl:grid-cols-2">
          <TokenPanel
            title="Typography"
            subtitle="Inter sebagai font utama dengan scale teks yang dikunci lewat token."
            extra={
              <span className="font-mono text-[length:var(--ds-font-size-label)] text-[var(--ds-color-accent)]">
                {desktopThemeTokens.typography.fontFamilySans}
              </span>
            }
          >
            <div className="space-y-[var(--ds-space-sm)]">
              {TYPOGRAPHY_PREVIEW.map((item) => (
                <div
                  key={item.key}
                  className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)]"
                >
                  <div className="mb-[var(--ds-space-xxs)] flex items-center justify-between gap-[var(--ds-space-sm)]">
                    <span className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                      {item.label}
                    </span>
                    <span className="font-mono text-[length:var(--ds-font-size-label)] text-[var(--ds-color-text-muted)]">
                      {item.size}px / {desktopThemeTokens.typography.lineHeight}
                    </span>
                  </div>
                  <div
                    className="text-[var(--ds-color-text)]"
                    style={{ fontSize: item.size, fontWeight: item.weight }}
                  >
                    {item.sample}
                  </div>
                </div>
              ))}
            </div>
          </TokenPanel>

          <TokenPanel
            title="Color Tone"
            subtitle="Accent biru, neutral surfaces, dan semantic states untuk desktop operations."
          >
            <div className="grid gap-[var(--ds-space-sm)] lg:grid-cols-2">
              {COLOR_SWATCHES.map((swatch) => (
                <div
                  key={swatch.key}
                  className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-sm)]"
                >
                  <div className="mb-[var(--ds-space-sm)] flex items-center gap-[var(--ds-space-sm)]">
                    <div
                      className="h-[26px] w-[26px] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)]"
                      style={swatchStyle(swatch.value)}
                    />
                    <div>
                      <div className="text-[length:var(--ds-font-size-body)] font-semibold text-[var(--ds-color-text)]">
                        {swatch.label}
                      </div>
                      <div className="font-mono text-[length:var(--ds-font-size-label)] text-[var(--ds-color-text-muted)]">
                        {swatch.value}
                      </div>
                    </div>
                  </div>
                  <div className="text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]">
                    {swatch.description}
                  </div>
                </div>
              ))}
            </div>
          </TokenPanel>
        </div>

        <div className="grid gap-[var(--ds-space-lg)] xl:grid-cols-[0.9fr_1.1fr]">
          <TokenPanel
            title="Spacing & Sizing"
            subtitle="Semua gap, control height, dan density desktop harus berasal dari token."
          >
            <div className="space-y-[var(--ds-space-sm)]">{renderSpacingPreview(desktopThemeTokens.spacing)}</div>
            <div className="mt-[var(--ds-space-lg)] grid gap-[var(--ds-space-sm)] lg:grid-cols-2">
              <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-sm)]">
                <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                  Layout
                </div>
                <div className="mt-[var(--ds-space-sm)] space-y-[var(--ds-space-xs)] text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]">
                  <div className="flex justify-between">
                    <span>Module bar</span>
                    <span className="font-mono">{formatTokenValue(desktopThemeTokens.layout.moduleBarHeight)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Page list width</span>
                    <span className="font-mono">{formatTokenValue(desktopThemeTokens.layout.pageListWidth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Doc tab</span>
                    <span className="font-mono">{formatTokenValue(desktopThemeTokens.layout.docTabHeight)}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-sm)]">
                <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                  Components
                </div>
                <div className="mt-[var(--ds-space-sm)] space-y-[var(--ds-space-xs)] text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]">
                  <div className="flex justify-between">
                    <span>Button</span>
                    <span className="font-mono">{formatTokenValue(desktopThemeTokens.components.button.controlHeight)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Input</span>
                    <span className="font-mono">{formatTokenValue(desktopThemeTokens.components.input.controlHeight)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table header</span>
                    <span className="font-mono">{formatTokenValue(desktopThemeTokens.components.table.headerHeight)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table row</span>
                    <span className="font-mono">{formatTokenValue(desktopThemeTokens.components.table.rowHeight)}</span>
                  </div>
                </div>
              </div>
            </div>
          </TokenPanel>

          <TokenPanel
            title="Radius & Shadow"
            subtitle="Desktop surface memakai radius moderat dan bayangan tipis agar tetap padat."
          >
            <div className="grid gap-[var(--ds-space-md)] lg:grid-cols-2">
              <div className="space-y-[var(--ds-space-sm)]">
                {Object.entries(desktopThemeTokens.radius).map(([name, value]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)]"
                  >
                    <span className="text-[length:var(--ds-font-size-body)] font-semibold text-[var(--ds-color-text)]">
                      {name}
                    </span>
                    <div
                      className="h-[36px] w-[72px] border border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface)]"
                      style={{ borderRadius: value }}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-[var(--ds-space-sm)]">
                {Object.entries(desktopThemeTokens.shadow).map(([name, value]) => (
                  <div
                    key={name}
                    className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-md)]"
                  >
                    <div className="mb-[var(--ds-space-xs)] text-[length:var(--ds-font-size-body)] font-semibold text-[var(--ds-color-text)]">
                      {name}
                    </div>
                    <div
                      className="rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface)] px-[var(--ds-space-md)] py-[var(--ds-space-lg)] text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]"
                      style={{ boxShadow: value }}
                    >
                      Shadow sample
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TokenPanel>
        </div>

        <DesktopCard
          title="Hybrid Shell Preview"
          subtitle="Template shell yang meniru module bar, page list, MDI tabs, dan status bar dari referensi hybrid."
          extra={<DesktopBadge tone="accent">template</DesktopBadge>}
        >
          <DesktopMenuShell />
        </DesktopCard>

        {groupCatalogItems().map(({ category, items }) => (
          <DesktopCard
            key={category}
            title={category}
            subtitle={`Showcase komponen ${category.toLowerCase()} yang tersedia di desktop design system.`}
            extra={<DesktopBadge tone="accent">{items.length} entries</DesktopBadge>}
          >
            <div className="space-y-[var(--ds-space-lg)]">
              {items.map((item) => (
                <ShowcaseCard key={item.id} item={item}>
                  {renderComponentPreview(item.id)}
                </ShowcaseCard>
              ))}
            </div>
          </DesktopCard>
        ))}
      </div>
    </div>
  )
}

export default DesignSystemPage
