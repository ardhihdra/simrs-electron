import { App } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import React, { useState } from 'react'

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

void React

type RawatInapPasienPageProps = {
  mode?: 'active' | 'checkin'
  title?: string
  subtitle?: string
  items: InpatientPatientListItem[]
  total: number
  loading?: boolean
  queryParams: InpatientPatientListQuery
  statusCounts?: { PLANNED?: number; IN_PROGRESS: number; FINISHED: number }
  onQueryChange: (patch: Partial<InpatientPatientListQuery>) => void
  onCheckin?: (patient: InpatientPatientListItem) => void
  onOpenAdmisi?: () => void
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
  mode = 'active',
  title,
  subtitle,
  items,
  total,
  loading = false,
  queryParams,
  statusCounts,
  onQueryChange,
  onCheckin,
  onOpenAdmisi,
  onDispositionConfirm,
  isDispositionSubmitting = false,
  onDpjpSaved
}: RawatInapPasienPageProps) {
  const { message } = App.useApp()
  const [selectedEncounterId, setSelectedEncounterId] = useState(() => items[0]?.encounterId ?? '')
  const [dispositionPatient, setDispositionPatient] = useState<InpatientPatientListItem | null>(
    null
  )
  const [showDpjpModal, setShowDpjpModal] = useState(false)

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
  const isCheckinMode = mode === 'checkin'
  const pageTitle =
    title ?? (isCheckinMode ? 'Daftar Pasien Siap Checkin' : 'Daftar Pasien Rawat Inap')
  const pageSubtitle =
    subtitle ??
    (isCheckinMode
      ? `${statusCounts?.PLANNED ?? 0} pasien menunggu checkin`
      : `${statusCounts?.IN_PROGRESS ?? 0} aktif · ${statusCounts?.FINISHED ?? 0} discharge`)

  const handleAction = () => void message.info('Fitur belum diimplementasikan pada scope ini')
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
      encounterStatus: isCheckinMode ? queryParams.encounterStatus : 'IN_PROGRESS',
      page: 1
    })

  const sortOrderFor = (field: SortField) =>
    queryParams.sortField === field
      ? queryParams.sortOrder === 'asc'
        ? ('ascend' as const)
        : ('descend' as const)
      : null

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
            <span className="ml-[3px] text-[9px] text-[var(--ds-color-danger)]">⚠</span>
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
    onChange: (pagination, _, sorter) => {
      const s = Array.isArray(sorter) ? sorter[0] : sorter
      onQueryChange({
        page: pagination.current ?? 1,
        pageSize: pagination.pageSize ?? queryParams.pageSize,
        sortField: s.order ? (s.field as SortField) : undefined,
        sortOrder: s.order === 'ascend' ? 'asc' : s.order === 'descend' ? 'desc' : undefined
      })
    },
    pagination: {
      current: queryParams.page,
      pageSize: queryParams.pageSize,
      total,
      showSizeChanger: true,
      pageSizeOptions: [5, 10, 25, 50],
      showTotal: (n, range) => `${range[0]}–${range[1]} dari ${n} pasien`
    },
    onRow: (record) => ({
      onClick: () => setSelectedEncounterId(record.encounterId)
    }),
    rowClassName: (record) =>
      [
        'cursor-pointer',
        record.encounterId === selectedEncounterId ? 'ant-table-row-selected' : '',
        record.encounterStatus === 'FINISHED' ? 'opacity-60' : ''
      ]
        .filter(Boolean)
        .join(' '),
    className: '!rounded-none !border-0 !shadow-none !bg-transparent',
    scroll: { x: 900 }
  }

  return (
    <div className="flex flex-col gap-[16px]" data-testid="rawat-inap-pasien-layout">
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
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-[16px]">
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-semibold text-[var(--ds-color-text)]">{pageTitle}</h1>
          <div className="mt-[4px] text-[13px] text-[var(--ds-color-text-muted)]">
            {pageSubtitle}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-[8px]">
          {!isCheckinMode ? (
            <>
              <DesktopButton emphasis="toolbar" onClick={handleAction}>
                Ekspor
              </DesktopButton>
              <DesktopButton emphasis="toolbar" onClick={onOpenAdmisi ?? handleAction}>
                Admisi Baru
              </DesktopButton>
            </>
          ) : (
            <DesktopButton emphasis="primary" onClick={onOpenAdmisi ?? handleAction}>
              Admisi Baru
            </DesktopButton>
          )}
        </div>
      </div>

      {/* Filter bar (outside table card) */}
      <div className="flex flex-wrap items-center gap-[8px]">
        <input
          value={queryParams.search ?? ''}
          onChange={(e) => onQueryChange({ search: e.target.value || undefined, page: 1 })}
          placeholder="Cari nama pasien atau No. RM…"
          className="min-w-[200px] flex-1 rounded-[var(--ds-radius)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[10px] py-[7px] text-[12px] text-[var(--ds-color-text)] outline-none placeholder:text-[var(--ds-color-text-muted)]"
        />
        <RPCSelectAsync
          entity="room"
          display="roomCodeId"
          output="id"
          placeHolder="Semua Bangsal"
          value={queryParams.wardId}
          onChange={(v) => onQueryChange({ wardId: v ?? undefined, page: 1 })}
          allowClear
          className="min-w-[150px]"
        />
        <SelectAsync
          entity="kepegawaian"
          display="namaLengkap"
          output="namaLengkap"
          placeHolder="Semua DPJP"
          filters={{ hakAksesId: 'doctor' }}
          value={queryParams.dpjpName}
          onChange={(v) => onQueryChange({ dpjpName: v ?? undefined, page: 1 })}
          className="min-w-[180px]"
        />
        <select
          value={queryParams.paymentType ?? ''}
          onChange={(e) => onQueryChange({ paymentType: e.target.value || undefined, page: 1 })}
          className="rounded-[var(--ds-radius)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[8px] py-[5px] text-[11.5px] text-[var(--ds-color-text)] outline-none"
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
                (e.target.value as InpatientPatientListQuery['losCategory'] | '') || undefined,
              page: 1
            })
          }
          className="rounded-[var(--ds-radius)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[8px] py-[5px] text-[11.5px] text-[var(--ds-color-text)] outline-none"
        >
          <option value="">Semua LOS</option>
          <option value="normal">Normal (&lt;7 hari)</option>
          <option value="panjang">Panjang (7–13 hari)</option>
          <option value="sangat">Sangat Panjang (≥14 hari)</option>
        </select>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[11px] text-[var(--ds-color-text-muted)] hover:text-[var(--ds-color-text)]"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex items-start gap-[16px]">
        {/* Left: table card */}
        <div className="min-w-0 flex-1 flex flex-col overflow-hidden rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)]">
          <DesktopGenericTable<InpatientPatientListItem>
            rowKey="encounterId"
            columns={columns}
            dataSource={items}
            loading={loading}
            cardHeader={{
              title: 'Daftar Pasien',
              subtitle: loading ? 'Memuat…' : `${total} hasil`
            }}
            statusFilter={
              isCheckinMode
                ? undefined
                : {
                    items: [
                      { key: 'IN_PROGRESS', label: 'Aktif', count: statusCounts?.IN_PROGRESS },
                      { key: 'FINISHED', label: 'Discharge', count: statusCounts?.FINISHED }
                    ],
                    value: queryParams.encounterStatus ?? '',
                    onChange: (key) => onQueryChange({ encounterStatus: key || undefined, page: 1 })
                  }
            }
            action={{
              title: '',
              width: 110,
              render: (p) =>
                isCheckinMode ? (
                  <DesktopButton
                    emphasis="primary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedEncounterId(p.encounterId)
                      onCheckin?.(p)
                    }}
                  >
                    Checkin
                  </DesktopButton>
                ) : (
                  <div className="flex gap-[4px]">
                    <DesktopButton
                      emphasis="toolbar"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAction()
                      }}
                    >
                      CPPT
                    </DesktopButton>
                    {p.encounterStatus === 'IN_PROGRESS' && (
                      <DesktopButton
                        emphasis="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEncounterId(p.encounterId)
                          setDispositionPatient(p)
                        }}
                      >
                        Disposisi
                      </DesktopButton>
                    )}
                  </div>
                )
            }}
            tableProps={tableProps}
          />
        </div>

        {/* Right: detail panel */}
        {selected && (
          <div className="w-[300px] shrink-0 rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)]">
            <div className="flex items-center gap-[8px] border-b border-[var(--ds-color-border)] px-[16px] py-[12px]">
              <span className="text-[13px] font-semibold text-[var(--ds-color-text)]">
                Ringkasan
              </span>
              <div className="flex-1" />
              {selected.wardName && <DesktopTag>{selected.wardName}</DesktopTag>}
            </div>
            <div className="flex flex-col gap-[12px] px-[16px] py-[14px]">
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
                    {!isCheckinMode && (
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
                    ? '⚠ LOS sangat panjang — perlu evaluasi.'
                    : '! LOS panjang — monitor DPJP.'}
                </div>
              )}

              <div className="flex flex-col gap-[6px]">
                {isCheckinMode ? (
                  <DesktopButton
                    emphasis="primary"
                    onClick={() => {
                      setSelectedEncounterId(selected.encounterId)
                      onCheckin?.(selected)
                    }}
                  >
                    Checkin Pasien
                  </DesktopButton>
                ) : (
                  <>
                    {(
                      ['Buka CPPT', 'Vital Signs', 'Resep / MAR', 'Transfer Kamar'] as string[]
                    ).map((label) => (
                      <DesktopButton key={label} emphasis="toolbar" onClick={handleAction}>
                        {label}
                      </DesktopButton>
                    ))}
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
          </div>
        )}
      </div>
    </div>
  )
}
