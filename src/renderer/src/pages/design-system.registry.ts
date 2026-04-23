import type { DesktopAvatarProps } from '@renderer/components/design-system/atoms/DesktopAvatar'
import type { DesktopBadgeTone } from '@renderer/components/design-system/atoms/DesktopBadge'
import type { DesktopButtonProps } from '@renderer/components/design-system/atoms/DesktopButton'
import type { DesktopIconProps } from '@renderer/components/design-system/atoms/DesktopIcon'
import type { DesktopKeyboardShortcutProps } from '@renderer/components/design-system/atoms/DesktopKeyboardShortcut'
import type { DesktopProgressBarProps } from '@renderer/components/design-system/atoms/DesktopProgressBar'
import type { DesktopStatusDotProps } from '@renderer/components/design-system/atoms/DesktopStatusDot'
import type { DesktopTagProps } from '@renderer/components/design-system/atoms/DesktopTag'
import type { DesktopCardProps } from '@renderer/components/design-system/molecules/DesktopCard'
import type { DesktopFormFieldProps } from '@renderer/components/design-system/molecules/DesktopFormField'
import type { DesktopInputProps } from '@renderer/components/design-system/molecules/DesktopInput'
import type { DesktopInputFieldProps } from '@renderer/components/design-system/molecules/DesktopInputField'
import type { DesktopNotificationItemProps } from '@renderer/components/design-system/molecules/DesktopNotificationItem'
import type { DesktopSegmentedControlProps } from '@renderer/components/design-system/molecules/DesktopSegmentedControl'
import type { DesktopStatCardProps } from '@renderer/components/design-system/molecules/DesktopStatCard'
import type { DesktopContentTabsProps } from '@renderer/components/design-system/organisms/DesktopContentTabs'
import type { DesktopDocTabsProps } from '@renderer/components/design-system/organisms/DesktopDocTabs'
import type { DesktopGenericTableProps } from '@renderer/components/design-system/organisms/DesktopGenericTable'
import type { DesktopMenuShellProps } from '@renderer/components/design-system/organisms/DesktopMenuShell'
import type { DesktopModuleBarProps } from '@renderer/components/design-system/organisms/DesktopModuleBar'
import type { DesktopPageHeaderProps } from '@renderer/components/design-system/organisms/DesktopPageHeader'
import type { DesktopPageListProps } from '@renderer/components/design-system/organisms/DesktopPageList'
import type { DesktopStatusBarProps } from '@renderer/components/design-system/organisms/DesktopStatusBar'
import type { DesktopTableProps } from '@renderer/components/design-system/organisms/DesktopTable'

export type DesignSystemCategory =
  | 'Actions'
  | 'Identity & Status'
  | 'Inputs & Forms'
  | 'Navigation & Shell'
  | 'Data Display'

export type DesignSystemCatalogItem = {
  id: string
  componentName: string
  title: string
  category: DesignSystemCategory
  description: string
  props: Array<{ name: string; type: string; description: string }>
  codeSnippet: string
}

export const DESIGN_SYSTEM_COMPONENTS: DesignSystemCatalogItem[] = [
  {
    id: 'desktop-button',
    componentName: 'DesktopButton',
    title: 'DesktopButton',
    category: 'Actions',
    description: 'Primary action wrapper untuk button AntD dengan state desktop, toolbar, dan quiet actions.',
    props: [
      { name: 'emphasis', type: "DesktopButtonProps['emphasis']", description: 'Varian visual action.' },
      { name: 'size', type: "ButtonProps['size']", description: 'Scale control dari token desktop.' },
      { name: 'icon', type: 'ReactNode', description: 'Icon optional untuk action button.' }
    ] satisfies Array<{ name: keyof DesktopButtonProps | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopButton emphasis=\"primary\" icon={<DesktopIcon name=\"plus\" />}>\n  Buat Pendaftaran\n</DesktopButton>"
  },
  {
    id: 'desktop-badge',
    componentName: 'DesktopBadge',
    title: 'DesktopBadge',
    category: 'Identity & Status',
    description: 'Status pill ringkas untuk counts dan semantic states kecil.',
    props: [
      { name: 'tone', type: 'DesktopBadgeTone', description: 'Tone semantic badge.' },
      { name: 'children', type: 'ReactNode', description: 'Label badge.' }
    ] satisfies Array<{ name: keyof { tone?: DesktopBadgeTone; children: unknown } | string; type: string; description: string }>,
    codeSnippet: '<DesktopBadge tone="success">Online</DesktopBadge>'
  },
  {
    id: 'desktop-tag',
    componentName: 'DesktopTag',
    title: 'DesktopTag',
    category: 'Identity & Status',
    description: 'Chip/tag desktop untuk filter aktif, label state, dan removable tokens.',
    props: [
      { name: 'tone', type: "DesktopTagProps['tone']", description: 'Tone semantic tag.' },
      { name: 'icon', type: 'ReactNode', description: 'Icon optional di sisi kiri.' },
      { name: 'onClose', type: '() => void', description: 'Handler close optional untuk removable tag.' }
    ] satisfies Array<{ name: keyof DesktopTagProps | string; type: string; description: string }>,
    codeSnippet: '<DesktopTag tone="accent">BPJS Aktif</DesktopTag>'
  },
  {
    id: 'desktop-avatar',
    componentName: 'DesktopAvatar',
    title: 'DesktopAvatar',
    category: 'Identity & Status',
    description: 'Avatar desktop untuk user, assignee, atau notifikasi operasional.',
    props: [
      { name: 'label', type: 'string', description: 'Initial/fallback label.' },
      { name: 'size', type: "DesktopAvatarProps['size']", description: 'Ukuran avatar.' },
      { name: 'tone', type: "DesktopAvatarProps['tone']", description: 'Tone visual avatar.' }
    ] satisfies Array<{ name: keyof DesktopAvatarProps | string; type: string; description: string }>,
    codeSnippet: '<DesktopAvatar label="SW" size="md" />'
  },
  {
    id: 'desktop-status-dot',
    componentName: 'DesktopStatusDot',
    title: 'DesktopStatusDot',
    category: 'Identity & Status',
    description: 'Penanda status kecil untuk koneksi, queue state, atau live indicator.',
    props: [
      { name: 'status', type: "DesktopStatusDotProps['status']", description: 'Semantic status warna dot.' },
      { name: 'label', type: 'string', description: 'Teks pendamping optional.' }
    ] satisfies Array<{ name: keyof DesktopStatusDotProps | string; type: string; description: string }>,
    codeSnippet: '<DesktopStatusDot status="success" label="Terhubung" />'
  },
  {
    id: 'desktop-progress-bar',
    componentName: 'DesktopProgressBar',
    title: 'DesktopProgressBar',
    category: 'Identity & Status',
    description: 'Progress bar padat untuk SLA, proses sinkronisasi, atau completion state.',
    props: [
      { name: 'value', type: 'number', description: 'Persentase progress.' },
      { name: 'status', type: "DesktopProgressBarProps['status']", description: 'Status progres AntD.' },
      { name: 'showLabel', type: 'boolean', description: 'Tampilkan label persentase di bawah bar.' }
    ] satisfies Array<{ name: keyof DesktopProgressBarProps | string; type: string; description: string }>,
    codeSnippet: '<DesktopProgressBar value={72} />'
  },
  {
    id: 'desktop-icon',
    componentName: 'DesktopIcon',
    title: 'DesktopIcon',
    category: 'Identity & Status',
    description: 'Registry icon custom berbasis referensi desktop untuk shell dan komponen baru.',
    props: [
      { name: 'name', type: "DesktopIconProps['name']", description: 'Nama icon dari registry desktop.' },
      { name: 'size', type: 'number', description: 'Ukuran icon.' },
      { name: 'strokeWidth', type: 'number', description: 'Ketebalan stroke icon.' }
    ] satisfies Array<{ name: keyof DesktopIconProps | string; type: string; description: string }>,
    codeSnippet: '<DesktopIcon name="dashboard" size={16} />'
  },
  {
    id: 'desktop-keyboard-shortcut',
    componentName: 'DesktopKeyboardShortcut',
    title: 'DesktopKeyboardShortcut',
    category: 'Actions',
    description: 'Representasi shortcut keyboard dalam format desktop app klasik.',
    props: [
      { name: 'keys', type: 'string[]', description: 'Urutan tombol shortcut.' }
    ] satisfies Array<{ name: keyof DesktopKeyboardShortcutProps | string; type: string; description: string }>,
    codeSnippet: '<DesktopKeyboardShortcut keys={["Ctrl", "P"]} />'
  },
  {
    id: 'desktop-input',
    componentName: 'DesktopInput',
    title: 'DesktopInput',
    category: 'Inputs & Forms',
    description: 'Primitive input/select/textarea desktop tanpa label atau helper text.',
    props: [
      { name: 'type', type: "DesktopInputProps['type']", description: 'Mode input, textarea, atau select.' },
      { name: 'placeholder', type: 'string', description: 'Placeholder control.' },
      { name: 'options', type: 'DesktopInputOption[]', description: 'Options select.' }
    ] satisfies Array<{ name: keyof DesktopInputProps | string; type: string; description: string }>,
    codeSnippet: '<DesktopInput type="input" placeholder="Cari pasien" />'
  },
  {
    id: 'desktop-input-field',
    componentName: 'DesktopInputField',
    title: 'DesktopInputField',
    category: 'Inputs & Forms',
    description: 'Wrapper field kompatibel untuk input/select/textarea dengan label, hint, dan sizing desktop.',
    props: [
      { name: 'label', type: 'string', description: 'Label field.' },
      { name: 'type', type: "DesktopInputFieldProps['type']", description: 'Mode input, textarea, atau select.' },
      { name: 'options', type: 'DesktopInputFieldOption[]', description: 'Options untuk mode select.' }
    ] satisfies Array<{ name: keyof DesktopInputFieldProps | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopInputField\n  label=\"Poli Tujuan\"\n  type=\"select\"\n  placeholder=\"Pilih poli\"\n  options={[\n    { label: 'Poli Anak', value: 'anak' },\n    { label: 'Poli Interna', value: 'interna' }\n  ]}\n/>"
  },
  {
    id: 'desktop-segmented-control',
    componentName: 'DesktopSegmentedControl',
    title: 'DesktopSegmentedControl',
    category: 'Inputs & Forms',
    description: 'Segmented switcher untuk mode tampilan, filter status, atau scope data.',
    props: [
      { name: 'value', type: 'string', description: 'Value aktif.' },
      { name: 'options', type: 'DesktopSegmentedOption[]', description: 'Pilihan segment.' },
      { name: 'onChange', type: '(value: string) => void', description: 'Callback saat value berubah.' }
    ] satisfies Array<{ name: keyof DesktopSegmentedControlProps | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopSegmentedControl\n  value=\"active\"\n  options={[\n    { label: 'Aktif', value: 'active' },\n    { label: 'Selesai', value: 'done' }\n  ]}\n/>"
  },
  {
    id: 'desktop-form-field',
    componentName: 'DesktopFormField',
    title: 'DesktopFormField',
    category: 'Inputs & Forms',
    description: 'Field wrapper reusable untuk label, hint, error, dan layout kontrol form.',
    props: [
      { name: 'label', type: 'string', description: 'Label field.' },
      { name: 'hint', type: 'string', description: 'Helper text optional.' },
      { name: 'error', type: 'string', description: 'Pesan error optional.' }
    ] satisfies Array<{ name: keyof DesktopFormFieldProps | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopFormField label=\"Nomor RM\" hint=\"Masukkan nomor rekam medis\">\n  <DesktopInput placeholder=\"Cari pasien\" />\n</DesktopFormField>"
  },
  {
    id: 'desktop-card',
    componentName: 'DesktopCard',
    title: 'DesktopCard',
    category: 'Identity & Status',
    description: 'Surface utama desktop untuk section, stat block, atau grouped content.',
    props: [
      { name: 'title', type: 'string', description: 'Judul utama card.' },
      { name: 'subtitle', type: 'string | undefined', description: 'Teks pendukung card.' },
      { name: 'extra', type: 'ReactNode', description: 'Area aksi kecil pada header.' }
    ] satisfies Array<{ name: keyof DesktopCardProps | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopCard\n  title=\"Ringkasan Antrian\"\n  subtitle=\"Snapshot operasional hari ini\"\n  extra={<DesktopBadge tone=\"accent\">Live</DesktopBadge>}\n>\n  <div>Isi konten card</div>\n</DesktopCard>"
  },
  {
    id: 'desktop-stat-card',
    componentName: 'DesktopStatCard',
    title: 'DesktopStatCard',
    category: 'Identity & Status',
    description: 'Card khusus metrik desktop dengan value, delta, dan icon trend.',
    props: [
      { name: 'title', type: 'string', description: 'Label metrik.' },
      { name: 'value', type: 'string', description: 'Nilai utama yang ditampilkan.' },
      { name: 'delta', type: 'string', description: 'Perubahan nilai optional.' }
    ] satisfies Array<{ name: keyof DesktopStatCardProps | string; type: string; description: string }>,
    codeSnippet: '<DesktopStatCard title="Pasien Hari Ini" value="128" delta="+8.2%" trend="up" />'
  },
  {
    id: 'desktop-content-tabs',
    componentName: 'DesktopContentTabs',
    title: 'DesktopContentTabs',
    category: 'Navigation & Shell',
    description: 'Tabs isi halaman untuk berpindah antar sub-view konten utama.',
    props: [
      { name: 'items', type: 'DesktopContentTabItem[]', description: 'Daftar content tabs.' },
      { name: 'activeKey', type: 'string', description: 'Key tab aktif.' },
      { name: 'onChange', type: '(key: string) => void', description: 'Callback perpindahan tab.' }
    ] satisfies Array<{ name: keyof DesktopContentTabsProps | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopContentTabs\n  items={[\n    { key: 'overview', label: 'Overview', children: <div>Overview</div> },\n    { key: 'detail', label: 'Detail', children: <div>Detail</div> }\n  ]}\n/>"
  },
  {
    id: 'desktop-doc-tabs',
    componentName: 'DesktopDocTabs',
    title: 'DesktopDocTabs',
    category: 'Navigation & Shell',
    description: 'MDI-style document tabs untuk shell desktop dengan close state.',
    props: [
      { name: 'tabs', type: 'DesktopDocTabItem[]', description: 'Daftar doc tabs.' },
      { name: 'activeKey', type: 'string', description: 'Key tab aktif.' },
      { name: 'onTabClose', type: '(key: string) => void', description: 'Callback close tab.' }
    ] satisfies Array<{ name: keyof DesktopDocTabsProps | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopDocTabs\n  tabs={[\n    { key: 'reg', label: 'Pendaftaran Baru', closable: true },\n    { key: 'queue', label: 'Antrian Pendaftaran', closable: true }\n  ]}\n/>"
  },
  {
    id: 'desktop-table',
    componentName: 'DesktopTable',
    title: 'DesktopTable',
    category: 'Data Display',
    description: 'Primitive table desktop untuk data padat dengan loading overlay dan styling konsisten.',
    props: [
      { name: 'columns', type: 'ColumnsType<T>', description: 'Kolom tabel.' },
      { name: 'dataSource', type: 'T[]', description: 'Rows yang akan dirender.' },
      { name: 'loadingOverlay', type: 'boolean', description: 'Tampilkan overlay loading di atas table.' }
    ] satisfies Array<{ name: keyof DesktopTableProps<any> | string; type: string; description: string }>,
    codeSnippet: '<DesktopTable rowKey="id" columns={columns} dataSource={rows} />'
  },
  {
    id: 'desktop-menu-shell',
    componentName: 'DesktopMenuShell',
    title: 'DesktopMenuShell',
    category: 'Navigation & Shell',
    description: 'Template hybrid shell yang menyusun module bar, page list, MDI tabs, dan status bar.',
    props: [
      { name: 'title', type: 'string | undefined', description: 'Heading content preview.' },
      { name: 'subtitle', type: 'string | undefined', description: 'Subheading content preview.' },
      { name: 'moduleItems', type: 'DesktopModuleBarItem[]', description: 'Daftar modul pada module bar.' }
    ] satisfies Array<{ name: keyof DesktopMenuShellProps | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopMenuShell\n  title=\"Pendaftaran Pasien\"\n  subtitle=\"Hybrid shell preview dari design system desktop\"\n/>"
  },
  {
    id: 'desktop-page-header',
    componentName: 'DesktopPageHeader',
    title: 'DesktopPageHeader',
    category: 'Navigation & Shell',
    description: 'Header halaman desktop untuk title, subtitle, metadata, dan action group.',
    props: [
      { name: 'title', type: 'string', description: 'Judul utama halaman.' },
      { name: 'subtitle', type: 'string', description: 'Teks pendamping.' },
      { name: 'actions', type: 'ReactNode', description: 'Action group di sisi kanan.' }
    ] satisfies Array<{ name: keyof DesktopPageHeaderProps | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopPageHeader\n  title=\"Rawat Jalan\"\n  subtitle=\"Queue operasional poli hari ini\"\n  status=\"Live\"\n/>"
  },
  {
    id: 'desktop-module-bar',
    componentName: 'DesktopModuleBar',
    title: 'DesktopModuleBar',
    category: 'Navigation & Shell',
    description: 'Navigasi modul tingkat atas dengan brand block dan quick actions.',
    props: [
      { name: 'items', type: 'DesktopModuleBarItem[]', description: 'Daftar module items.' },
      { name: 'activeKey', type: 'string', description: 'Module aktif.' },
      { name: 'onSelect', type: '(key: string) => void', description: 'Callback saat modul dipilih.' }
    ] satisfies Array<{ name: keyof DesktopModuleBarProps | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopModuleBar\n  items={[\n    { key: 'dashboard', label: 'Dashboard', icon: <DesktopIcon name='dashboard' /> },\n    { key: 'registration', label: 'Pendaftaran', icon: <DesktopIcon name='id' /> }\n  ]}\n/>"
  },
  {
    id: 'desktop-page-list',
    componentName: 'DesktopPageList',
    title: 'DesktopPageList',
    category: 'Navigation & Shell',
    description: 'Daftar page vertikal bergroup untuk modul desktop aktif.',
    props: [
      { name: 'groups', type: 'DesktopPageListGroup[]', description: 'Group page yang dirender.' },
      { name: 'activeKey', type: 'string', description: 'Page aktif.' },
      { name: 'collapsed', type: 'boolean', description: 'State collapsed sidebar.' }
    ] satisfies Array<{ name: keyof DesktopPageListProps | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopPageList\n  groups={[\n    {\n      key: 'ops',\n      label: 'Operasional',\n      items: [{ key: 'queue', label: 'Antrian Aktif', icon: <DesktopIcon name='clock' /> }]\n    }\n  ]}\n/>"
  },
  {
    id: 'desktop-status-bar',
    componentName: 'DesktopStatusBar',
    title: 'DesktopStatusBar',
    category: 'Navigation & Shell',
    description: 'Status bar bawah untuk koneksi, context runtime, dan info operasional cepat.',
    props: [
      { name: 'leftItems', type: 'DesktopStatusBarItem[]', description: 'Item sisi kiri.' },
      { name: 'rightItems', type: 'DesktopStatusBarItem[]', description: 'Item sisi kanan.' }
    ] satisfies Array<{ name: keyof DesktopStatusBarProps | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopStatusBar\n  leftItems={[{ key: 'server', content: <span>Server online</span> }]}\n  rightItems={[{ key: 'version', content: <span>v4.12.1</span> }]}\n/>"
  },
  {
    id: 'desktop-notification-item',
    componentName: 'DesktopNotificationItem',
    title: 'DesktopNotificationItem',
    category: 'Data Display',
    description: 'Row notifikasi desktop untuk inbox operasional dan alert singkat.',
    props: [
      { name: 'title', type: 'string', description: 'Judul notifikasi.' },
      { name: 'body', type: 'string', description: 'Isi notifikasi.' },
      { name: 'time', type: 'string', description: 'Waktu atau metadata ringkas.' }
    ] satisfies Array<{ name: keyof DesktopNotificationItemProps | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopNotificationItem\n  id=\"notif-1\"\n  title=\"Bridging BPJS selesai\"\n  body=\"SEP pasien A-003 berhasil diterbitkan.\"\n  time=\"2 menit lalu\"\n/>"
  },
  {
    id: 'desktop-generic-table',
    componentName: 'DesktopGenericTable',
    title: 'DesktopGenericTable',
    category: 'Data Display',
    description: 'Wrapper table desktop yang menjaga kontrak dasar GenericTable lama untuk migrasi bertahap.',
    props: [
      { name: 'columns', type: 'ColumnsType<T>', description: 'Kolom tabel.' },
      { name: 'dataSource', type: 'T[]', description: 'Rows yang akan dirender.' },
      {
        name: 'action',
        type: 'DesktopTableActionConfig<T> | undefined',
        description: 'Action menu optional per row, termasuk fixedRight dan button type.'
      }
    ] satisfies Array<{ name: keyof DesktopGenericTableProps<any> | string; type: string; description: string }>,
    codeSnippet:
      "<DesktopGenericTable\n  rowKey=\"id\"\n  columns={columns}\n  dataSource={rows}\n  action={{\n    fixedRight: true,\n    items: (record) => [\n      { label: 'Lihat Detail', type: 'link', onClick: () => openDetail(record) },\n      { label: 'Batalkan', danger: true, type: 'text', onClick: () => cancelRow(record) }\n    ]\n  }}\n/>"
  }
]
