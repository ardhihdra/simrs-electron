import type { DesktopCardProps } from '@renderer/components/design-system/molecules/DesktopCard'
import type { DesktopInputFieldProps } from '@renderer/components/design-system/molecules/DesktopInputField'
import type { DesktopMenuShellProps } from '@renderer/components/design-system/organisms/DesktopMenuShell'
import type { DesktopGenericTableProps } from '@renderer/components/design-system/organisms/DesktopGenericTable'
import type { DesktopButtonProps } from '@renderer/components/design-system/atoms/DesktopButton'

export type DesignSystemCatalogItem = {
  id: string
  componentName: string
  title: string
  description: string
  props: Array<{ name: string; type: string; description: string }>
  codeSnippet: string
}

export const DESIGN_SYSTEM_COMPONENTS: DesignSystemCatalogItem[] = [
  {
    id: 'desktop-button',
    componentName: 'DesktopButton',
    title: 'DesktopButton',
    description: 'Primary action wrapper untuk button AntD dengan size, spacing, dan emphasis desktop.',
    props: [
      {
        name: 'emphasis',
        type: "DesktopButtonProps['emphasis']",
        description: 'Varian visual action.'
      },
      {
        name: 'size',
        type: "ButtonProps['size']",
        description: 'Scale control dari token desktop.'
      },
      { name: 'icon', type: 'ReactNode', description: 'Icon optional untuk action button.' }
    ] satisfies Array<{ name: keyof DesktopButtonProps | string; type: string; description: string }>,
    codeSnippet: `<DesktopButton emphasis="primary" icon={<PlusOutlined />}>\n  Buat Pendaftaran\n</DesktopButton>`
  },
  {
    id: 'desktop-input-field',
    componentName: 'DesktopInputField',
    title: 'DesktopInputField',
    description: 'Field wrapper untuk input/select/textarea dengan label, hint, dan sizing desktop.',
    props: [
      { name: 'label', type: 'string', description: 'Label field.' },
      {
        name: 'type',
        type: "DesktopInputFieldProps['type']",
        description: 'Mode input, textarea, atau select.'
      },
      {
        name: 'options',
        type: 'DesktopInputFieldOption[]',
        description: 'Options untuk mode select.'
      }
    ] satisfies Array<{ name: keyof DesktopInputFieldProps | string; type: string; description: string }>,
    codeSnippet: `<DesktopInputField\n  label="Poli Tujuan"\n  type="select"\n  placeholder="Pilih poli"\n  options={[\n    { label: 'Poli Anak', value: 'anak' },\n    { label: 'Poli Interna', value: 'interna' }\n  ]}\n/>`
  },
  {
    id: 'desktop-card',
    componentName: 'DesktopCard',
    title: 'DesktopCard',
    description: 'Surface utama desktop untuk section, stat block, atau grouped content.',
    props: [
      { name: 'title', type: 'string', description: 'Judul utama card.' },
      {
        name: 'subtitle',
        type: 'string | undefined',
        description: 'Teks pendukung card.'
      },
      { name: 'extra', type: 'ReactNode', description: 'Area aksi kecil pada header.' }
    ] satisfies Array<{ name: keyof DesktopCardProps | string; type: string; description: string }>,
    codeSnippet: `<DesktopCard\n  title="Ringkasan Antrian"\n  subtitle="Snapshot operasional hari ini"\n  extra={<DesktopBadge tone="accent">Live</DesktopBadge>}\n>\n  <div>Isi konten card</div>\n</DesktopCard>`
  },
  {
    id: 'desktop-menu-shell',
    componentName: 'DesktopMenuShell',
    title: 'DesktopMenuShell',
    description: 'Preview hybrid shell yang meniru module bar, page list, doc tabs, dan status bar.',
    props: [
      { name: 'title', type: 'string | undefined', description: 'Heading content preview.' },
      {
        name: 'subtitle',
        type: 'string | undefined',
        description: 'Subheading content preview.'
      }
    ] satisfies Array<{ name: keyof DesktopMenuShellProps | string; type: string; description: string }>,
    codeSnippet: `<DesktopMenuShell\n  title="Pendaftaran Pasien"\n  subtitle="Hybrid shell preview dari design system desktop"\n/>`
  },
  {
    id: 'desktop-generic-table',
    componentName: 'DesktopGenericTable',
    title: 'DesktopGenericTable',
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
    codeSnippet: `<DesktopGenericTable\n  rowKey="id"\n  columns={columns}\n  dataSource={rows}\n  action={{\n    fixedRight: true,\n    items: (record) => [\n      { label: 'Lihat Detail', type: 'link', onClick: () => openDetail(record) },\n      { label: 'Batalkan', danger: true, type: 'text', onClick: () => cancelRow(record) }\n    ]\n  }}\n/>`
  }
]
