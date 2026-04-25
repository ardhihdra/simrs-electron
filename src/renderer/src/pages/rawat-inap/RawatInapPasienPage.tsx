import { App } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import React, { useState } from 'react'

import { DesktopBadge, type DesktopBadgeTone } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopTag } from '../../components/design-system/atoms/DesktopTag'
import { DesktopGenericTable } from '../../components/design-system/organisms/DesktopGenericTable'
import type {
  InpatientPatientListItem,
  InpatientPatientListOptions,
  InpatientPatientListQuery,
} from '../../../../main/rpc/procedure/encounter.schemas'

void React

type RawatInapPasienPageProps = {
  items: InpatientPatientListItem[]
  total: number
  loading?: boolean
  queryParams: InpatientPatientListQuery
  statusCounts?: { IN_PROGRESS: number; FINISHED: number }
  options: InpatientPatientListOptions
  onQueryChange: (patch: Partial<InpatientPatientListQuery>) => void
}

function getStatusTone(status: string): DesktopBadgeTone {
  if (status === 'IN_PROGRESS') return 'success'
  return 'neutral'
}

function getStatusLabel(status: string): string {
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

export function RawatInapPasienPage({
  items,
  total,
  loading = false,
  queryParams,
  statusCounts,
  options,
  onQueryChange,
}: RawatInapPasienPageProps) {
  const { message } = App.useApp()
  const [selectedEncounterId, setSelectedEncounterId] = useState(() => items[0]?.encounterId ?? '')

  const selected = items.find((p) => p.encounterId === selectedEncounterId) ?? items[0] ?? null

  const handleAction = () => void message.info('Fitur belum diimplementasikan pada scope ini')

  const hasActiveFilters =
    queryParams.search || queryParams.wardId || queryParams.dpjpName ||
    queryParams.paymentType || queryParams.losCategory || queryParams.encounterStatus

  const clearFilters = () =>
    onQueryChange({ search: undefined, wardId: undefined, dpjpName: undefined, paymentType: undefined, losCategory: undefined, encounterStatus: undefined, page: 1 })

  const sortOrderFor = (field: SortField) =>
    queryParams.sortField === field
      ? queryParams.sortOrder === 'asc' ? 'ascend' as const : 'descend' as const
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
          <div className="text-[12.5px] font-semibold text-[var(--ds-color-text)]">{p.patientName}</div>
          <div className="font-mono text-[10.5px] text-[var(--ds-color-text-muted)]">
            {p.medicalRecordNumber ?? '-'} · {p.ageLabel ?? '-'}
          </div>
        </div>
      ),
    },
    {
      title: 'Kamar',
      key: 'wardName',
      dataIndex: 'wardName',
      sorter: true,
      sortOrder: sortOrderFor('wardName'),
      render: (_, p) =>
        p.wardName ? (
          <DesktopTag>{p.wardName}{p.bedName ? ` · ${p.bedName}` : ''}</DesktopTag>
        ) : (
          <span className="text-[var(--ds-color-text-muted)]">-</span>
        ),
    },
    {
      title: 'DPJP',
      key: 'dpjpName',
      dataIndex: 'dpjpName',
      sorter: true,
      sortOrder: sortOrderFor('dpjpName'),
      render: (val: string | null) => (
        <span className="text-[11.5px] text-[var(--ds-color-text)]">{val ?? '-'}</span>
      ),
    },
    {
      title: 'Dx',
      key: 'diagnosisSummary',
      dataIndex: 'diagnosisSummary',
      render: (val: string | null) => (
        <span className="font-mono text-[11px] text-[var(--ds-color-text)]">{val ?? '-'}</span>
      ),
    },
    {
      title: 'Masuk',
      key: 'admissionDateTime',
      dataIndex: 'admissionDateTime',
      sorter: true,
      sortOrder: sortOrderFor('admissionDateTime'),
      render: (val: string | null) => (
        <span className="font-mono text-[11px] text-[var(--ds-color-text)]">{formatDate(val)}</span>
      ),
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
              color: losDays >= 14 ? 'var(--ds-color-danger)' : losDays >= 7 ? 'var(--ds-color-warning)' : 'var(--ds-color-text)',
            }}
          >
            {losDays}
          </span>
          {losDays >= 14 && <span className="ml-[3px] text-[9px] text-[var(--ds-color-danger)]">⚠</span>}
          {losDays >= 7 && losDays < 14 && <span className="ml-[3px] text-[9px] text-[var(--ds-color-warning)]">!</span>}
        </span>
      ),
    },
    {
      title: 'Jenis',
      key: 'paymentLabel',
      render: (_, p) => (
        <DesktopBadge tone={getPaymentTone(p.paymentLabel)}>
          {p.paymentLabel?.split(' - ')[0] ?? '-'}
        </DesktopBadge>
      ),
    },
    {
      title: 'Status',
      key: 'encounterStatus',
      render: (_, p) => (
        <DesktopBadge tone={getStatusTone(p.encounterStatus)}>
          {getStatusLabel(p.encounterStatus)}
        </DesktopBadge>
      ),
    },
  ]

  const tableProps: TableProps<InpatientPatientListItem> = {
    onChange: (pagination, _, sorter) => {
      const s = Array.isArray(sorter) ? sorter[0] : sorter
      onQueryChange({
        page: pagination.current ?? 1,
        pageSize: pagination.pageSize ?? queryParams.pageSize,
        sortField: s.order ? (s.field as SortField) : undefined,
        sortOrder: s.order === 'ascend' ? 'asc' : s.order === 'descend' ? 'desc' : undefined,
      })
    },
    pagination: {
      current: queryParams.page,
      pageSize: queryParams.pageSize,
      total,
      showSizeChanger: true,
      pageSizeOptions: [5, 10, 25, 50],
      showTotal: (n, range) => `${range[0]}–${range[1]} dari ${n} pasien`,
    },
    onRow: (record) => ({
      onClick: () => setSelectedEncounterId(record.encounterId),
    }),
    rowClassName: (record) =>
      [
        'cursor-pointer',
        record.encounterId === selectedEncounterId ? 'ant-table-row-selected' : '',
        record.encounterStatus === 'FINISHED' ? 'opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' '),
    className: '!rounded-none !border-0 !shadow-none !bg-transparent',
    scroll: { x: 900 },
  }

  return (
    <div className="flex flex-col gap-[16px]" data-testid="rawat-inap-pasien-layout">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-[16px]">
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-semibold text-[var(--ds-color-text)]">
            Daftar Pasien Rawat Inap
          </h1>
          <div className="mt-[4px] text-[13px] text-[var(--ds-color-text-muted)]">
            {statusCounts?.IN_PROGRESS ?? 0} aktif · {statusCounts?.FINISHED ?? 0} discharge
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-[8px]">
          <DesktopButton emphasis="toolbar" onClick={handleAction}>Ekspor</DesktopButton>
          <DesktopButton emphasis="toolbar" onClick={handleAction}>Admisi Baru</DesktopButton>
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
        {[
          {
            value: queryParams.wardId ?? '',
            onChange: (v: string) => onQueryChange({ wardId: v || undefined, page: 1 }),
            options: [{ value: '', label: 'Semua Bangsal' }, ...options.wards.map((w) => ({ value: w.id, label: w.name }))],
          },
          {
            value: queryParams.dpjpName ?? '',
            onChange: (v: string) => onQueryChange({ dpjpName: v || undefined, page: 1 }),
            options: [{ value: '', label: 'Semua DPJP' }, ...options.dpjps.map((d) => ({ value: d, label: d }))],
          },
          {
            value: queryParams.paymentType ?? '',
            onChange: (v: string) => onQueryChange({ paymentType: v || undefined, page: 1 }),
            options: [
              { value: '', label: 'Semua Jenis Bayar' },
              { value: 'BPJS', label: 'BPJS' },
              { value: 'Umum', label: 'Umum' },
              { value: 'Asuransi', label: 'Asuransi' },
              { value: 'Perusahaan', label: 'Perusahaan' },
            ],
          },
          {
            value: queryParams.losCategory ?? '',
            onChange: (v: string) => onQueryChange({ losCategory: (v as InpatientPatientListQuery['losCategory'] | '') || undefined, page: 1 }),
            options: [
              { value: '', label: 'Semua LOS' },
              { value: 'normal', label: 'Normal (<7 hari)' },
              { value: 'panjang', label: 'Panjang (7–13 hari)' },
              { value: 'sangat', label: 'Sangat Panjang (≥14 hari)' },
            ],
          },
        ].map((sel, idx) => (
          <select
            key={idx}
            value={sel.value}
            onChange={(e) => sel.onChange(e.target.value)}
            className="rounded-[var(--ds-radius)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[8px] py-[5px] text-[11.5px] text-[var(--ds-color-text)] outline-none"
          >
            {sel.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ))}
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
              subtitle: loading ? 'Memuat…' : `${total} hasil`,
            }}
            statusFilter={{
              items: [
                { key: '', label: 'Semua', count: (statusCounts?.IN_PROGRESS ?? 0) + (statusCounts?.FINISHED ?? 0) },
                { key: 'IN_PROGRESS', label: 'Aktif', count: statusCounts?.IN_PROGRESS },
                { key: 'FINISHED', label: 'Discharge', count: statusCounts?.FINISHED },
              ],
              value: queryParams.encounterStatus ?? '',
              onChange: (key) => onQueryChange({ encounterStatus: key || undefined, page: 1 }),
            }}
            action={{
              title: '',
              width: 110,
              render: (p) => (
                <div className="flex gap-[4px]">
                  <DesktopButton
                    emphasis="toolbar"
                    size="small"
                    onClick={(e) => { e.stopPropagation(); handleAction() }}
                  >
                    CPPT
                  </DesktopButton>
                  {p.encounterStatus === 'IN_PROGRESS' && (
                    <DesktopButton
                      emphasis="primary"
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleAction() }}
                    >
                      Pulang
                    </DesktopButton>
                  )}
                </div>
              ),
            }}
            tableProps={tableProps}
          />
        </div>

        {/* Right: detail panel */}
        {selected && (
          <div className="w-[300px] shrink-0 rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)]">
            <div className="flex items-center gap-[8px] border-b border-[var(--ds-color-border)] px-[16px] py-[12px]">
              <span className="text-[13px] font-semibold text-[var(--ds-color-text)]">Ringkasan</span>
              <div className="flex-1" />
              {selected.wardName && <DesktopTag>{selected.wardName}</DesktopTag>}
            </div>
            <div className="flex flex-col gap-[12px] px-[16px] py-[14px]">
              <div className="flex items-center gap-[10px] border-b border-[var(--ds-color-border)] pb-[12px]">
                <div className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--ds-color-accent)_14%,white)] text-[13px] font-bold text-[var(--ds-color-accent)]">
                  {selected.patientName.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[var(--ds-color-text)]">{selected.patientName}</div>
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
                    ['DPJP', selected.dpjpName ?? '-'],
                    ['Est. Pulang', '-'],
                    ['SEP', selected.sepNumber ?? '-'],
                    ['Status', getStatusLabel(selected.encounterStatus)],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label}>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--ds-color-text-muted)]">{label}</div>
                    <div className="font-medium text-[var(--ds-color-text)]">{value}</div>
                  </div>
                ))}
              </div>

              {selected.losDays >= 7 && (
                <div
                  className="rounded-[var(--ds-radius)] border px-[10px] py-[7px] text-[11.5px]"
                  style={{
                    background: 'color-mix(in srgb, var(--ds-color-warning) 12%, white)',
                    borderColor: 'var(--ds-color-warning)',
                    color: 'var(--ds-color-warning)',
                  }}
                >
                  {selected.losDays >= 14 ? '⚠ LOS sangat panjang — perlu evaluasi.' : '! LOS panjang — monitor DPJP.'}
                </div>
              )}

              <div className="flex flex-col gap-[6px]">
                {(['Buka CPPT', 'Vital Signs', 'Resep / MAR', 'Transfer Kamar'] as string[]).map((label) => (
                  <DesktopButton key={label} emphasis="toolbar" onClick={handleAction}>{label}</DesktopButton>
                ))}
                {selected.encounterStatus === 'IN_PROGRESS' && (
                  <DesktopButton emphasis="primary" onClick={handleAction}>Proses Pulang</DesktopButton>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
