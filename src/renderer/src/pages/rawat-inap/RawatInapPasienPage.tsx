/**
 * purpose: Render inpatient patient list page with doctor-style header, mockup-parity toolbar/table layout, and right-side summary panel.
 * main callers: `RawatInapPasienRoute` under `/dashboard/rawat-inap/pasien`.
 * key dependencies: Ant Design tokens/components, `DesktopGenericTable`, `DpjpModal`, async filter selectors, inpatient query contract.
 * main/public functions: `RawatInapPasienPage`.
 * side effects: Triggers query state changes via `onQueryChange`, invokes checkin/disposition callbacks, shows info messages for placeholder actions, opens DPJP assignment modal, and opens rawat-inap clinical workspace/quick forms in a new tab.
 */
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  ExceptionOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { App, Button, Card, Input, Segmented, Space, theme } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useMemo, useState } from 'react'

import { useMedicationDispenseByEncounter } from '@renderer/hooks/query/use-medication-dispense'
import { rpc } from '@renderer/utils/client'
import {
  DesktopBadge,
  type DesktopBadgeTone
} from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopTag } from '../../components/design-system/atoms/DesktopTag'
import {
  DesktopDispositionWorkflow,
  type DesktopDispositionConfirmPayload,
  type DesktopDispositionOption
} from '../../components/design-system/organisms/DesktopDispositionWorkflow'
import { DesktopGenericTable } from '../../components/design-system/organisms/DesktopGenericTable'
import { ReferralForm } from '../../components/organisms/ReferralForm'
import { RPCSelectAsync } from '../../components/organisms/RPCSelectAsync'
import { SelectAsync } from '../../components/organisms/SelectAsync'
import { DpjpModal } from '../../components/organisms/rawat-inap/DpjpModal'
import type {
  InpatientPatientListItem,
  InpatientPatientListQuery
} from '../../../../main/rpc/procedure/encounter.schemas'
import {
  buildRawatInapPatientWorkspacePath,
  buildRawatInapQuickCpptPath,
  buildRawatInapQuickVitalSignsPath
} from './rawat-inap.config'

void React

type RawatInapPasienPageProps = {
  title?: string
  subtitle?: string
  items: InpatientPatientListItem[]
  total: number
  loading?: boolean
  queryParams: InpatientPatientListQuery
  statusCounts?: { PLANNED?: number; IN_PROGRESS: number; FINISHED: number }
  onQueryChange: (patch: Partial<InpatientPatientListQuery>) => void
  onCheckin?: (patient: InpatientPatientListItem) => void
  onDispositionConfirm?: (
    patient: InpatientPatientListItem,
    payload: DesktopDispositionConfirmPayload
  ) => void | Promise<void>
  isDispositionSubmitting?: boolean
  onDpjpSaved?: () => void
}

function getStatusTone(status: string): DesktopBadgeTone {
  if (status === 'PLANNED') return 'warning'
  if (status === 'IN_PROGRESS') return 'success'
  return 'neutral'
}

function getStatusLabel(status: string): string {
  if (status === 'PLANNED') return 'Siap Checkin'
  if (status === 'IN_PROGRESS') return 'Aktif'
  if (status === 'FINISHED') return 'Discharge'
  return status
}

function getPaymentTone(label: string | null): DesktopBadgeTone {
  if (!label) return 'neutral'
  if (label.startsWith('BPJS')) return 'info'
  if (label.startsWith('Asuransi')) return 'warning'
  return 'neutral'
}

function formatDate(dt: string | null): string {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

type SortField = NonNullable<InpatientPatientListQuery['sortField']>
type EncounterStatusFilter = '' | 'PLANNED' | 'IN_PROGRESS' | 'FINISHED'

const RAWAT_INAP_DISPOSITION_OPTIONS: DesktopDispositionOption[] = [
  {
    key: 'pulang',
    label: 'Pulang',
    subtitle: 'Pasien rawat inap diizinkan pulang',
    dischargeDisposition: 'CURED',
    color: 'var(--ds-color-success)',
    softColor: 'color-mix(in srgb, var(--ds-color-success) 10%, white)',
    tone: 'success'
  },
  {
    key: 'rujuk-e',
    label: 'Rujuk Eksternal',
    subtitle: 'Ke RS / faskes lain',
    dischargeDisposition: 'REFERRED',
    color: 'var(--ds-color-violet)',
    softColor: 'var(--ds-color-violet-soft)',
    tone: 'violet'
  },
  {
    key: 'meninggal',
    label: 'Meninggal',
    subtitle: 'Dinyatakan meninggal dunia',
    dischargeDisposition: 'DECEASED',
    color: 'var(--ds-color-text-subtle)',
    softColor: 'var(--ds-color-surface-muted)',
    tone: 'neutral'
  },
  {
    key: 'paksa',
    label: 'Pulang Paksa',
    subtitle: 'Atas permintaan sendiri (APS)',
    dischargeDisposition: 'AGAINST_ADVICE',
    color: 'var(--ds-color-warning)',
    softColor: 'color-mix(in srgb, var(--ds-color-warning) 12%, white)',
    tone: 'warning'
  }
]

const RAWAT_INAP_BANNER_META = {
  label: 'RI',
  name: 'Rawat Inap',
  colorName: 'BANGSAL',
  badgeTone: 'neutral' as const,
  background: 'var(--ds-color-surface-muted)',
  borderColor: 'var(--ds-color-border-strong)',
  color: 'var(--ds-color-text-muted)'
}

export function RawatInapPasienPage({
  title,
  subtitle,
  items,
  total,
  loading = false,
  queryParams,
  statusCounts,
  onQueryChange,
  onCheckin,
  onDispositionConfirm,
  isDispositionSubmitting = false,
  onDpjpSaved
}: RawatInapPasienPageProps) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const [selectedEncounterId, setSelectedEncounterId] = useState(() => items[0]?.encounterId ?? '')
  const [dispositionPatient, setDispositionPatient] = useState<InpatientPatientListItem | null>(
    null
  )
  const [showDpjpModal, setShowDpjpModal] = useState(false)

  useEffect(() => {
    if (items.length === 0) {
      setSelectedEncounterId('')
      return
    }

    if (!selectedEncounterId || !items.some((item) => item.encounterId === selectedEncounterId)) {
      setSelectedEncounterId(items[0].encounterId)
    }
  }, [items, selectedEncounterId])

  const selected = items.find((p) => p.encounterId === selectedEncounterId) ?? items[0] ?? null
  const dispositionEncounterId = dispositionPatient?.encounterId
  const dispositionPatientId = dispositionPatient?.patientId
  const dispositionMedicationQuery = useMedicationDispenseByEncounter(
    dispositionPatientId,
    dispositionEncounterId
  )
  const dispositionInvoiceQuery = useQuery({
    queryKey: ['rawat-inap', 'disposition-invoice', dispositionEncounterId, dispositionPatientId],
    queryFn: () =>
      rpc.kasir.getInvoice({
        encounterId: dispositionEncounterId!,
        patientId: dispositionPatientId!
      }),
    enabled: !!dispositionEncounterId && !!dispositionPatientId
  })
  const dispositionInvoice =
    (dispositionInvoiceQuery.data as { result?: unknown } | undefined)?.result ?? null
  const pageTitle = title ?? 'Daftar Pasien Rawat Inap'
  const pageSubtitle =
    subtitle ??
    `${statusCounts?.PLANNED ?? 0} planned · ${statusCounts?.IN_PROGRESS ?? 0} aktif · ${statusCounts?.FINISHED ?? 0} discharge`

  const handleAction = () => void message.info('Fitur belum diimplementasikan pada scope ini')
  const handleOpenPemeriksaanLengkap = () => {
    const encounterId = selected?.encounterId
    if (!encounterId) {
      message.warning('Encounter belum tersedia untuk pasien ini.')
      return
    }
    const base = window.location.href.split('#')[0]
    const targetPath = buildRawatInapPatientWorkspacePath(encounterId)
    window.open(`${base}#${targetPath}`, '_blank')
  }
  const handleOpenQuickCppt = () => {
    const encounterId = selected?.encounterId
    if (!encounterId) {
      message.warning('Encounter belum tersedia untuk pasien ini.')
      return
    }
    const base = window.location.href.split('#')[0]
    const targetPath = buildRawatInapQuickCpptPath(encounterId)
    window.open(`${base}#${targetPath}`, '_blank')
  }
  const handleOpenQuickVitalSigns = () => {
    const encounterId = selected?.encounterId
    if (!encounterId) {
      message.warning('Encounter belum tersedia untuk pasien ini.')
      return
    }
    const base = window.location.href.split('#')[0]
    const targetPath = buildRawatInapQuickVitalSignsPath(encounterId)
    window.open(`${base}#${targetPath}`, '_blank')
  }

  const openDpjpModal = () => setShowDpjpModal(true)
  const closeDpjpModal = () => setShowDpjpModal(false)
  const handleDpjpSaved = () => {
    closeDpjpModal()
    onDpjpSaved?.()
  }

  if (dispositionPatient) {
    return (
      <DesktopDispositionWorkflow
        patient={{
          name: dispositionPatient.patientName,
          registrationNumber: dispositionPatient.encounterId,
          ageLabel: dispositionPatient.ageLabel ?? '-',
          paymentLabel: dispositionPatient.paymentLabel ?? '-',
          statusLabel: 'Encounter Rawat Inap',
          roomLabel: [dispositionPatient.wardName, dispositionPatient.bedName]
            .filter(Boolean)
            .join(' '),
          lengthOfStayLabel: `LOS ${dispositionPatient.losDays} hari`,
          patientTypeLabel: dispositionPatient.paymentLabel ?? '-'
        }}
        bannerMeta={RAWAT_INAP_BANNER_META}
        summaryItems={[
          { label: 'Encounter', value: dispositionPatient.encounterId, mono: true },
          {
            label: 'No. RM',
            value: dispositionPatient.medicalRecordNumber ?? '-',
            mono: true
          },
          { label: 'Umur', value: dispositionPatient.ageLabel ?? '-' },
          { label: 'Kamar', value: dispositionPatient.wardName ?? '-' },
          { label: 'Bed', value: dispositionPatient.bedName ?? '-' },
          { label: 'DPJP', value: dispositionPatient.dpjpName ?? '-' },
          { label: 'Diagnosis', value: dispositionPatient.diagnosisSummary ?? '-' },
          { label: 'LOS', value: `${dispositionPatient.losDays} hari` },
          { label: 'Penjamin', value: dispositionPatient.paymentLabel ?? '-' }
        ]}
        options={RAWAT_INAP_DISPOSITION_OPTIONS}
        breadcrumbItems={['Rawat Inap', 'Daftar Pasien']}
        title="Disposisi Pasien Rawat Inap"
        resumeDocumentLabel="Resume Medis Rawat Inap"
        dischargeMedications={
          Array.isArray(dispositionMedicationQuery.data?.data)
            ? dispositionMedicationQuery.data.data
            : []
        }
        invoice={dispositionInvoice}
        backendNote="Detail field mockup seperti instruksi DPJP, obat pulang, penyebab kematian, dan data klinis tambahan sebagian besar masih UI; yang dikirim dari disposisi umum baru dischargeDisposition dan dischargeNote."
        renderReferralForm={() => (
          <ReferralForm
            encounterId={dispositionPatient.encounterId}
            patientId={dispositionPatient.patientId}
            variant="embedded"
            showHistory={false}
            title="Buat Rujukan"
            submitLabel="Buat Rujukan & Proses Discharge"
            patientData={{
              patient: {
                id: dispositionPatient.patientId,
                name: dispositionPatient.patientName,
                medicalRecordNumber: dispositionPatient.medicalRecordNumber ?? '-'
              },
              doctor: {
                name: dispositionPatient.dpjpName ?? undefined
              }
            }}
            onSuccess={async () => {
              if (!onDispositionConfirm) {
                handleAction()
                return
              }

              await onDispositionConfirm(dispositionPatient, {
                type: 'rujuk-e',
                dischargeStatus: 'rujuk',
                dischargeDisposition: 'REFERRED',
                note: ''
              })
              setDispositionPatient(null)
            }}
          />
        )}
        isSubmitting={isDispositionSubmitting}
        onBack={() => setDispositionPatient(null)}
        onConfirm={async (payload) => {
          if (!onDispositionConfirm) {
            handleAction()
            return
          }

          await onDispositionConfirm(dispositionPatient, payload)
          setDispositionPatient(null)
        }}
      />
    )
  }

  const hasActiveFilters =
    queryParams.search ||
    queryParams.wardId ||
    queryParams.dpjpName ||
    queryParams.paymentType ||
    queryParams.losCategory

  const clearFilters = () =>
    onQueryChange({
      search: undefined,
      wardId: undefined,
      dpjpName: undefined,
      paymentType: undefined,
      losCategory: undefined,
      encounterStatus: undefined,
      page: 1
    })

  const sortOrderFor = (field: SortField) =>
    queryParams.sortField === field
      ? queryParams.sortOrder === 'asc'
        ? ('ascend' as const)
        : ('descend' as const)
      : null

  const totalPages = Math.max(1, Math.ceil(total / queryParams.pageSize))
  const safePage = Math.min(Math.max(queryParams.page, 1), totalPages)
  const startIdx = total === 0 ? 0 : (safePage - 1) * queryParams.pageSize + 1
  const endIdx = total === 0 ? 0 : Math.min(startIdx + items.length - 1, total)
  const pageWindow = useMemo(() => {
    let start = Math.max(1, safePage - 2)
    const end = Math.min(totalPages, start + 4)
    start = Math.max(1, end - 4)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])

  const longLosCount = items.filter((item) => item.losDays >= 7).length

  const columns: ColumnsType<InpatientPatientListItem> = [
    {
      title: 'Pasien',
      key: 'patientName',
      dataIndex: 'patientName',
      sorter: true,
      sortOrder: sortOrderFor('patientName'),
      render: (_, p) => (
        <div>
          <div className="text-[12.5px] font-semibold text-[var(--ds-color-text)]">
            {p.patientName}
          </div>
          <div className="font-mono text-[10.5px] text-[var(--ds-color-text-muted)]">
            {p.medicalRecordNumber ?? '-'} · {p.ageLabel ?? '-'}
          </div>
        </div>
      )
    },
    {
      title: 'Kamar',
      key: 'wardName',
      dataIndex: 'wardName',
      sorter: true,
      sortOrder: sortOrderFor('wardName'),
      render: (_, p) =>
        p.wardName ? (
          <DesktopTag>
            {p.wardName}
            {p.bedName ? ` · ${p.bedName}` : ''}
          </DesktopTag>
        ) : (
          <span className="text-[var(--ds-color-text-muted)]">-</span>
        )
    },
    {
      title: 'DPJP',
      key: 'dpjpName',
      dataIndex: 'dpjpName',
      sorter: true,
      sortOrder: sortOrderFor('dpjpName'),
      render: (val: string | null) => (
        <span className="text-[11.5px] text-[var(--ds-color-text)]">{val ?? '-'}</span>
      )
    },
    {
      title: 'Dx',
      key: 'diagnosisSummary',
      dataIndex: 'diagnosisSummary',
      render: (val: string | null) => (
        <span className="font-mono text-[11px] text-[var(--ds-color-text)]">{val ?? '-'}</span>
      )
    },
    {
      title: 'Masuk',
      key: 'admissionDateTime',
      dataIndex: 'admissionDateTime',
      sorter: true,
      sortOrder: sortOrderFor('admissionDateTime'),
      render: (val: string | null) => (
        <span className="font-mono text-[11px] text-[var(--ds-color-text)]">{formatDate(val)}</span>
      )
    },
    {
      title: 'LOS',
      key: 'losDays',
      dataIndex: 'losDays',
      sorter: true,
      align: 'center',
      sortOrder: sortOrderFor('losDays'),
      render: (losDays: number) => (
        <span>
          <span
            className="font-mono text-[13px] font-bold"
            style={{
              color:
                losDays >= 14
                  ? 'var(--ds-color-danger)'
                  : losDays >= 7
                    ? 'var(--ds-color-warning)'
                    : 'var(--ds-color-text)'
            }}
          >
            {losDays}
          </span>
          {losDays >= 14 && (
            <span className="ml-[3px] text-[9px] text-[var(--ds-color-danger)]">!</span>
          )}
          {losDays >= 7 && losDays < 14 && (
            <span className="ml-[3px] text-[9px] text-[var(--ds-color-warning)]">!</span>
          )}
        </span>
      )
    },
    {
      title: 'Jenis',
      key: 'paymentLabel',
      render: (_, p) => (
        <DesktopBadge tone={getPaymentTone(p.paymentLabel)}>
          {p.paymentLabel?.split(' - ')[0] ?? '-'}
        </DesktopBadge>
      )
    },
    {
      title: 'Status',
      key: 'encounterStatus',
      render: (_, p) => (
        <DesktopBadge tone={getStatusTone(p.encounterStatus)}>
          {getStatusLabel(p.encounterStatus)}
        </DesktopBadge>
      )
    }
  ]

  const tableProps: TableProps<InpatientPatientListItem> = {
    onChange: (_, __, sorter) => {
      const s = Array.isArray(sorter) ? sorter[0] : sorter
      onQueryChange({
        page: 1,
        sortField: s.order ? (s.field as SortField) : undefined,
        sortOrder: s.order === 'ascend' ? 'asc' : s.order === 'descend' ? 'desc' : undefined
      })
    },
    pagination: false,
    onRow: (record) => ({
      onClick: () => setSelectedEncounterId(record.encounterId)
    }),
    rowClassName: (record) =>
      [
        'cursor-pointer',
        record.encounterId === selectedEncounterId ? 'rawat-inap-row-selected' : '',
        record.encounterStatus === 'FINISHED' ? 'opacity-60' : ''
      ]
        .filter(Boolean)
        .join(' '),
    className: 'rawat-inap-patient-table !rounded-none !border-0 !shadow-none !bg-transparent',
    scroll: { x: 900 }
  }

  const statusSegmentOptions = [
    {
      value: '' as EncounterStatusFilter,
      label: (
        <span className="flex items-center gap-1.5 px-1">
          Semua
          <span className="inline-flex min-w-4 h-4 px-1 rounded-full text-[10px] items-center justify-center bg-[var(--ds-color-text-muted)] text-white">
            {(statusCounts?.PLANNED ?? 0) +
              (statusCounts?.IN_PROGRESS ?? 0) +
              (statusCounts?.FINISHED ?? 0)}
          </span>
        </span>
      )
    },
    {
      value: 'PLANNED' as EncounterStatusFilter,
      label: (
        <span className="flex items-center gap-1.5 px-1">
          Planned/Belum Check-in
          <span className="inline-flex min-w-4 h-4 px-1 rounded-full text-[10px] items-center justify-center bg-[var(--ds-color-warning)] text-white">
            {statusCounts?.PLANNED ?? 0}
          </span>
        </span>
      )
    },
    {
      value: 'IN_PROGRESS' as EncounterStatusFilter,
      label: (
        <span className="flex items-center gap-1.5 px-1">
          Aktif
          <span className="inline-flex min-w-4 h-4 px-1 rounded-full text-[10px] items-center justify-center bg-[var(--ds-color-success)] text-white">
            {statusCounts?.IN_PROGRESS ?? 0}
          </span>
        </span>
      )
    },
    {
      value: 'FINISHED' as EncounterStatusFilter,
      label: (
        <span className="flex items-center gap-1.5 px-1">
          Discharge
          <span className="inline-flex min-w-4 h-4 px-1 rounded-full text-[10px] items-center justify-center bg-[var(--ds-color-violet)] text-white">
            {statusCounts?.FINISHED ?? 0}
          </span>
        </span>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-4 h-full" data-testid="rawat-inap-pasien-layout">
      {selected && (
        <DpjpModal
          open={showDpjpModal}
          encounterId={selected.encounterId}
          patientInfo={{
            name: selected.patientName,
            medicalRecordNumber: selected.medicalRecordNumber,
            ageLabel: selected.ageLabel,
            wardName: selected.wardName
          }}
          onClose={closeDpjpModal}
          onSaved={handleDpjpSaved}
        />
      )}

      <Card
        styles={{ body: { padding: '20px 24px' } }}
        variant="borderless"
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
        }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <TeamOutlined
                    className="text-base"
                    style={{ color: token.colorSuccessBg, fontSize: 16 }}
                  />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">{pageTitle}</h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">{pageSubtitle}</p>
            </div>
            <Space size="small" align="center" wrap>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleAction}
                className="border-white/30 text-white hover:border-white hover:text-white"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
                ghost
              >
                Refresh
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleAction}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
              >
                Ekspor
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={handleAction}
                style={{
                  background: token.colorSuccess,
                  borderColor: token.colorSuccessActive,
                  color: '#fff'
                }}
              >
                Admisi Baru
              </Button>
            </Space>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <TeamOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {total}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Total Pasien
                </div>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${token.colorWarning}33` }}
              >
                <ClockCircleOutlined style={{ color: token.colorWarningBg, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {statusCounts?.IN_PROGRESS ?? 0}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Aktif
                </div>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${token.colorSuccess}33` }}
              >
                <CheckCircleOutlined style={{ color: token.colorSuccessBg, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {statusCounts?.FINISHED ?? 0}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Discharge
                </div>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${token.colorInfo}33` }}
              >
                <ExceptionOutlined style={{ color: token.colorInfoBg, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {longLosCount}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  LOS Panjang (Halaman)
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
        <Card
          className="flex-1 overflow-hidden flex flex-col"
          variant="borderless"
          styles={{ body: { padding: 0 } }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
          >
            <div className="flex gap-2 items-center flex-wrap">
              <div className="min-w-[260px] flex-1">
                <Input
                  placeholder="Cari nama pasien atau No. RM..."
                  prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                  value={queryParams.search ?? ''}
                  onChange={(e) => onQueryChange({ search: e.target.value || undefined, page: 1 })}
                  allowClear
                />
              </div>
              <Segmented
                value={(queryParams.encounterStatus ?? '') as EncounterStatusFilter}
                onChange={(value) =>
                  onQueryChange({ encounterStatus: String(value) || undefined, page: 1 })
                }
                options={statusSegmentOptions}
              />
            </div>

            <div className="flex gap-2 mt-3 items-center flex-wrap">
              <RPCSelectAsync
                entity="room"
                display="roomCodeId"
                output="id"
                placeHolder="Semua Bangsal"
                value={queryParams.wardId}
                onChange={(v) => onQueryChange({ wardId: v ?? undefined, page: 1 })}
                allowClear
                className="min-w-[200px] flex-1 max-w-[280px]"
              />
              <SelectAsync
                entity="kepegawaian"
                display="namaLengkap"
                output="namaLengkap"
                placeHolder="Semua DPJP"
                filters={{ hakAksesId: 'doctor' }}
                value={queryParams.dpjpName}
                onChange={(v) => onQueryChange({ dpjpName: v ?? undefined, page: 1 })}
                className="min-w-[220px] flex-1 max-w-[320px]"
              />
              <select
                value={queryParams.paymentType ?? ''}
                onChange={(e) =>
                  onQueryChange({ paymentType: e.target.value || undefined, page: 1 })
                }
                className="rounded-[var(--ds-radius)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[8px] py-[6px] text-[11.5px] text-[var(--ds-color-text)] outline-none"
              >
                <option value="">Semua Jenis Bayar</option>
                <option value="BPJS">BPJS</option>
                <option value="Umum">Umum</option>
                <option value="Asuransi">Asuransi</option>
                <option value="Perusahaan">Perusahaan</option>
              </select>
              <select
                value={queryParams.losCategory ?? ''}
                onChange={(e) =>
                  onQueryChange({
                    losCategory:
                      (e.target.value as InpatientPatientListQuery['losCategory'] | '') ||
                      undefined,
                    page: 1
                  })
                }
                className="rounded-[var(--ds-radius)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[8px] py-[6px] text-[11.5px] text-[var(--ds-color-text)] outline-none"
              >
                <option value="">Semua LOS</option>
                <option value="normal">Normal (&lt;7 hari)</option>
                <option value="panjang">Panjang (7–13 hari)</option>
                <option value="sangat">Sangat Panjang (≥14 hari)</option>
              </select>
              {hasActiveFilters && (
                <Button type="text" size="small" onClick={clearFilters}>
                  Reset filter
                </Button>
              )}
            </div>
          </div>

          <div className="px-0 pb-0">
            <style>
              {`
                .rawat-inap-patient-table {
                  border-radius: 0 !important;
                }

                .rawat-inap-patient-table .ant-table,
                .rawat-inap-patient-table .ant-table-container {
                  border-radius: 0 !important;
                }

                .rawat-inap-patient-table .ant-table-thead > tr > th {
                  border-radius: 0 !important;
                  border-start-start-radius: 0 !important;
                  border-start-end-radius: 0 !important;
                  border-end-start-radius: 0 !important;
                  border-end-end-radius: 0 !important;
                }

                .rawat-inap-patient-table .ant-table-container table > thead > tr:first-child > *:first-child,
                .rawat-inap-patient-table .ant-table-container table > thead > tr:first-child > *:last-child {
                  border-start-start-radius: 0 !important;
                  border-start-end-radius: 0 !important;
                }
              `}
            </style>
            <DesktopGenericTable<InpatientPatientListItem>
              rowKey="encounterId"
              columns={columns}
              dataSource={items}
              loading={loading}
              tableProps={tableProps}
            />
          </div>

          <div
            className="px-4 py-2 flex items-center gap-2 text-xs"
            style={{ borderTop: `1px solid ${token.colorBorderSecondary}` }}
          >
            <span style={{ color: token.colorTextSecondary }}>
              {total === 0
                ? 'Tidak ada data'
                : `Menampilkan ${startIdx}-${endIdx} dari ${total} pasien`}
            </span>

            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => onQueryChange({ page: 1 })}
                disabled={safePage === 1}
                className="px-2 py-0.5 rounded border text-xs"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer
                }}
              >
                «
              </button>
              <button
                onClick={() => onQueryChange({ page: Math.max(1, safePage - 1) })}
                disabled={safePage === 1}
                className="px-2 py-0.5 rounded border text-xs"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer
                }}
              >
                ‹
              </button>
              {pageWindow.map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => onQueryChange({ page: pageNumber })}
                  className="px-2.5 py-0.5 rounded border text-xs"
                  style={{
                    borderColor:
                      pageNumber === safePage ? token.colorPrimary : token.colorBorderSecondary,
                    background:
                      pageNumber === safePage ? token.colorPrimary : token.colorBgContainer,
                    color: pageNumber === safePage ? '#fff' : token.colorText
                  }}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                onClick={() => onQueryChange({ page: Math.min(totalPages, safePage + 1) })}
                disabled={safePage === totalPages}
                className="px-2 py-0.5 rounded border text-xs"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer
                }}
              >
                ›
              </button>
              <button
                onClick={() => onQueryChange({ page: totalPages })}
                disabled={safePage === totalPages}
                className="px-2 py-0.5 rounded border text-xs"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer
                }}
              >
                »
              </button>
              <select
                value={queryParams.pageSize}
                onChange={(event) => {
                  onQueryChange({ pageSize: Number(event.target.value), page: 1 })
                }}
                className="px-2 py-0.5 rounded border text-xs"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer
                }}
              >
                <option value={5}>5 / hal</option>
                <option value={10}>10 / hal</option>
                <option value={25}>25 / hal</option>
                <option value={50}>50 / hal</option>
              </select>
            </div>
          </div>
        </Card>

        {selected && (
          <Card
            title={
              <div className="flex items-center justify-between">
                <span>Ringkasan</span>
                {selected.wardName && <DesktopTag>{selected.wardName}</DesktopTag>}
              </div>
            }
            variant="borderless"
            styles={{
              header: { padding: '12px 16px', minHeight: 0 },
              body: { padding: '12px 16px' }
            }}
          >
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center gap-[10px] border-b border-[var(--ds-color-border)] pb-[12px]">
                <div className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--ds-color-accent)_14%,white)] text-[13px] font-bold text-[var(--ds-color-accent)]">
                  {selected.patientName
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[var(--ds-color-text)]">
                    {selected.patientName}
                  </div>
                  <div className="text-[11px] text-[var(--ds-color-text-muted)]">
                    {selected.ageLabel ?? '-'} · {selected.paymentLabel ?? '-'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[8px] border-b border-[var(--ds-color-border)] pb-[12px] text-[11.5px]">
                {(
                  [
                    ['Dx', selected.diagnosisSummary ?? '-'],
                    ['LOS', `${selected.losDays} hari`],
                    ['Est. Pulang', '-'],
                    ['SEP', selected.sepNumber ?? '-'],
                    ['Status', getStatusLabel(selected.encounterStatus)]
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--ds-color-text-muted)]">
                      {label}
                    </div>
                    <div className="font-medium text-[var(--ds-color-text)]">{value}</div>
                  </div>
                ))}
                <div className="col-span-2">
                  <div className="mb-[3px] text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--ds-color-text-muted)]">
                    DPJP
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <span className="flex-1 font-medium text-[var(--ds-color-text)]">
                      {selected.dpjpName ?? '-'}
                    </span>
                    {selected.encounterStatus !== 'PLANNED' && (
                      <button
                        onClick={openDpjpModal}
                        className="cursor-pointer rounded-[var(--ds-radius)] border border-transparent bg-transparent px-[7px] py-[2px] text-[10.5px] font-medium text-[var(--ds-color-accent)] hover:border-[var(--ds-color-accent)] hover:bg-[color-mix(in_srgb,var(--ds-color-accent)_8%,white)]"
                      >
                        Ganti
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {selected.losDays >= 7 && (
                <div
                  className="rounded-[var(--ds-radius)] border px-[10px] py-[7px] text-[11.5px]"
                  style={{
                    background: 'color-mix(in srgb, var(--ds-color-warning) 12%, white)',
                    borderColor: 'var(--ds-color-warning)',
                    color: 'var(--ds-color-warning)'
                  }}
                >
                  {selected.losDays >= 14
                    ? 'LOS sangat panjang - perlu evaluasi.'
                    : 'LOS panjang - monitor DPJP.'}
                </div>
              )}

              <div className="flex flex-col gap-[6px]">
                {selected.encounterStatus === 'PLANNED' ? (
                  <DesktopButton
                    emphasis="primary"
                    onClick={() => {
                      setSelectedEncounterId(selected.encounterId)
                      onCheckin?.(selected)
                    }}
                  >
                    Check in
                  </DesktopButton>
                ) : (
                  <>
                    <DesktopButton emphasis="primary" onClick={handleOpenPemeriksaanLengkap}>
                      Pemeriksaan Lengkap
                    </DesktopButton>
                    <DesktopButton emphasis="toolbar" onClick={handleOpenQuickCppt}>
                      Buka CPPT
                    </DesktopButton>
                    <DesktopButton emphasis="toolbar" onClick={handleOpenQuickVitalSigns}>
                      Vital Signs
                    </DesktopButton>
                    <DesktopButton emphasis="toolbar" onClick={handleAction}>
                      Resep / MAR
                    </DesktopButton>
                    <DesktopButton emphasis="toolbar" onClick={handleAction}>
                      Transfer Kamar
                    </DesktopButton>
                    <DesktopButton emphasis="toolbar" onClick={openDpjpModal}>
                      Tetapkan / Ganti DPJP
                    </DesktopButton>
                    {selected.encounterStatus === 'IN_PROGRESS' && (
                      <DesktopButton
                        emphasis="primary"
                        onClick={() => {
                          setSelectedEncounterId(selected.encounterId)
                          setDispositionPatient(selected)
                        }}
                      >
                        Proses Disposisi
                      </DesktopButton>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
