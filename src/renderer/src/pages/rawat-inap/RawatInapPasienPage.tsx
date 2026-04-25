import { App } from 'antd'
import React, { useMemo, useState } from 'react'

import { DesktopBadge, type DesktopBadgeTone } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopTag } from '../../components/design-system/atoms/DesktopTag'
import type { InpatientPatientListItem } from '../../../../main/rpc/procedure/encounter.schemas'

void React

type SortCol = 'patientName' | 'wardName' | 'dpjpName' | 'diagnosisSummary' | 'admissionDateTime' | 'losDays'

type RawatInapPasienPageProps = {
  items: InpatientPatientListItem[]
}

function SortTH({
  col,
  label,
  sortCol,
  sortDir,
  onSort,
}: {
  col: SortCol
  label: string
  sortCol: SortCol
  sortDir: 'asc' | 'desc'
  onSort: (col: SortCol) => void
}) {
  const active = sortCol === col
  return (
    <th
      onClick={() => onSort(col)}
      className="cursor-pointer select-none whitespace-nowrap px-[12px] py-[8px]"
    >
      {label}
      <span
        className="ml-[4px] text-[10px]"
        style={{ color: active ? 'var(--ds-color-accent)' : 'var(--ds-color-text-muted)' }}
      >
        {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </th>
  )
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

export function RawatInapPasienPage({ items }: RawatInapPasienPageProps) {
  const { message } = App.useApp()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterWard, setFilterWard] = useState('')
  const [filterDpjp, setFilterDpjp] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [filterLOS, setFilterLOS] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('admissionDateTime')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedEncounterId, setSelectedEncounterId] = useState(() => items[0]?.encounterId ?? '')

  const uniqueWards = useMemo(
    () =>
      Array.from(
        new Map(
          items.filter((i) => i.wardId && i.wardName).map((i) => [i.wardId!, { id: i.wardId!, name: i.wardName! }]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [items],
  )

  const uniqueDpjps = useMemo(
    () => [...new Set(items.filter((i) => i.dpjpName).map((i) => i.dpjpName!))].sort(),
    [items],
  )

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const q = search.toLowerCase()
      if (q && !p.patientName.toLowerCase().includes(q) && !(p.medicalRecordNumber ?? '').toLowerCase().includes(q))
        return false
      if (filterStatus && p.encounterStatus !== filterStatus) return false
      if (filterWard && p.wardId !== filterWard) return false
      if (filterDpjp && p.dpjpName !== filterDpjp) return false
      if (filterPayment && !(p.paymentLabel ?? '').startsWith(filterPayment)) return false
      if (filterLOS === 'normal' && p.losDays >= 7) return false
      if (filterLOS === 'panjang' && (p.losDays < 7 || p.losDays >= 14)) return false
      if (filterLOS === 'sangat' && p.losDays < 14) return false
      return true
    })
  }, [items, search, filterStatus, filterWard, filterDpjp, filterPayment, filterLOS])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = a[sortCol]
      const vb = b[sortCol]
      if (va == null) return 1
      if (vb == null) return -1
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortCol, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIdx = (safePage - 1) * perPage
  const paginated = sorted.slice(startIdx, startIdx + perPage)

  const selected = items.find((p) => p.encounterId === selectedEncounterId) ?? items[0] ?? null

  const activeCount = items.filter((p) => p.encounterStatus === 'IN_PROGRESS').length
  const dischargeCount = items.filter((p) => p.encounterStatus === 'FINISHED').length
  const hasActiveFilters = search || filterStatus || filterWard || filterDpjp || filterPayment || filterLOS

  const clearFilters = () => {
    setSearch('')
    setFilterStatus('')
    setFilterWard('')
    setFilterDpjp('')
    setFilterPayment('')
    setFilterLOS('')
    setCurrentPage(1)
  }

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortCol(col)
      setSortDir('asc')
    }
    setCurrentPage(1)
  }

  const handleAction = () => {
    void message.info('Fitur belum diimplementasikan pada scope ini')
  }

  const pageWindow = (() => {
    let start = Math.max(1, safePage - 2)
    const end = Math.min(totalPages, start + 4)
    start = Math.max(1, end - 4)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })()

  const PaginationButton = ({
    label,
    target,
    disabled,
  }: {
    label: string
    target: number
    disabled: boolean
  }) => (
    <button
      onClick={() => setCurrentPage(target)}
      disabled={disabled}
      className="rounded-[var(--ds-radius)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[8px] py-[4px] text-[12px] text-[var(--ds-color-text)] disabled:opacity-35"
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-[16px]" data-testid="rawat-inap-pasien-layout">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-[16px]">
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-semibold text-[var(--ds-color-text)]">
            Daftar Pasien Rawat Inap
          </h1>
          <div className="mt-[4px] text-[13px] text-[var(--ds-color-text-muted)]">
            {activeCount} aktif · {dischargeCount} discharge · {items.length} total terdaftar
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-[8px]">
          <DesktopButton emphasis="toolbar" onClick={handleAction}>
            Ekspor
          </DesktopButton>
          <DesktopButton emphasis="toolbar" onClick={handleAction}>
            Admisi Baru
          </DesktopButton>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex items-start gap-[16px]">
        {/* Left: card with filter + table + pagination */}
        <div className="min-w-0 flex-1 rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)]">
          {/* Filter bar */}
          <div className="flex flex-col gap-[10px] border-b border-[var(--ds-color-border)] px-[16px] py-[12px]">
            {/* Row 1: search + status tabs */}
            <div className="flex items-center gap-[8px]">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Cari nama pasien atau No. RM…"
                className="min-w-0 flex-1 rounded-[var(--ds-radius)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[10px] py-[7px] text-[12px] text-[var(--ds-color-text)] outline-none placeholder:text-[var(--ds-color-text-muted)]"
              />
              {/* Status tabs */}
              <div className="flex shrink-0 overflow-hidden rounded-[var(--ds-radius)] border border-[var(--ds-color-border)]">
                {(
                  [
                    ['', 'Semua'],
                    ['IN_PROGRESS', 'Aktif'],
                    ['FINISHED', 'Discharge'],
                  ] as [string, string][]
                ).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => {
                      setFilterStatus(val)
                      setCurrentPage(1)
                    }}
                    className={`px-[10px] py-[5px] text-[11.5px] ${
                      filterStatus === val
                        ? 'bg-[var(--ds-color-accent)] font-semibold text-white'
                        : 'text-[var(--ds-color-text)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Row 2: dropdowns */}
            <div className="flex flex-wrap items-center gap-[8px]">
              {[
                {
                  value: filterWard,
                  onChange: (v: string) => { setFilterWard(v); setCurrentPage(1) },
                  options: [
                    { value: '', label: 'Semua Bangsal' },
                    ...uniqueWards.map((w) => ({ value: w.id, label: w.name })),
                  ],
                },
                {
                  value: filterDpjp,
                  onChange: (v: string) => { setFilterDpjp(v); setCurrentPage(1) },
                  options: [
                    { value: '', label: 'Semua DPJP' },
                    ...uniqueDpjps.map((d) => ({ value: d, label: d })),
                  ],
                },
                {
                  value: filterPayment,
                  onChange: (v: string) => { setFilterPayment(v); setCurrentPage(1) },
                  options: [
                    { value: '', label: 'Semua Jenis Bayar' },
                    { value: 'BPJS', label: 'BPJS' },
                    { value: 'Umum', label: 'Umum' },
                    { value: 'Asuransi', label: 'Asuransi' },
                    { value: 'Perusahaan', label: 'Perusahaan' },
                  ],
                },
                {
                  value: filterLOS,
                  onChange: (v: string) => { setFilterLOS(v); setCurrentPage(1) },
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
                  className="rounded-[var(--ds-radius)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[8px] py-[5px] text-[11.5px] text-[var(--ds-color-text)] outline-none"
                >
                  {sel.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
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
              <span className="ml-auto text-[11px] text-[var(--ds-color-text-muted)]">
                <b className="text-[var(--ds-color-text)]">{filtered.length}</b> hasil
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--ds-color-border)] text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--ds-color-text-muted)]">
                  <SortTH col="patientName" label="Pasien" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortTH col="wardName" label="Kamar" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortTH col="dpjpName" label="DPJP" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortTH col="diagnosisSummary" label="Dx" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortTH col="admissionDateTime" label="Masuk" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortTH col="losDays" label="LOS" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-[12px] py-[8px]">Jenis</th>
                  <th className="px-[12px] py-[8px]">Status</th>
                  <th className="w-[110px] px-[12px] py-[8px]" />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-[32px] text-center text-[12px] text-[var(--ds-color-text-muted)]"
                    >
                      Tidak ada pasien yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  paginated.map((p) => (
                    <tr
                      key={p.encounterId}
                      onClick={() => setSelectedEncounterId(p.encounterId)}
                      className={`cursor-pointer border-b border-[var(--ds-color-border)] last:border-0 transition-colors hover:bg-[var(--ds-color-surface-muted)] ${
                        p.encounterId === selectedEncounterId
                          ? 'bg-[color-mix(in_srgb,var(--ds-color-accent)_8%,white)]'
                          : ''
                      } ${p.encounterStatus === 'FINISHED' ? 'opacity-60' : ''}`}
                    >
                      <td className="px-[12px] py-[10px]">
                        <div className="text-[12.5px] font-semibold text-[var(--ds-color-text)]">
                          {p.patientName}
                        </div>
                        <div className="font-mono text-[10.5px] text-[var(--ds-color-text-muted)]">
                          {p.medicalRecordNumber ?? '-'} · {p.ageLabel ?? '-'}
                        </div>
                      </td>
                      <td className="px-[12px] py-[10px]">
                        {p.wardName ? (
                          <DesktopTag>
                            {p.wardName}
                            {p.bedName ? ` · ${p.bedName}` : ''}
                          </DesktopTag>
                        ) : (
                          <span className="text-[var(--ds-color-text-muted)]">-</span>
                        )}
                      </td>
                      <td className="px-[12px] py-[10px] text-[11.5px] text-[var(--ds-color-text)]">
                        {p.dpjpName ?? '-'}
                      </td>
                      <td className="px-[12px] py-[10px] font-mono text-[11px] text-[var(--ds-color-text)]">
                        {p.diagnosisSummary ?? '-'}
                      </td>
                      <td className="px-[12px] py-[10px] font-mono text-[11px] text-[var(--ds-color-text)]">
                        {formatDate(p.admissionDateTime)}
                      </td>
                      <td className="px-[12px] py-[10px] text-center">
                        <span
                          className="font-mono text-[13px] font-bold"
                          style={{
                            color:
                              p.losDays >= 14
                                ? 'var(--ds-color-danger)'
                                : p.losDays >= 7
                                  ? 'var(--ds-color-warning)'
                                  : 'var(--ds-color-text)',
                          }}
                        >
                          {p.losDays}
                        </span>
                        {p.losDays >= 14 && (
                          <span className="ml-[3px] text-[9px] text-[var(--ds-color-danger)]">⚠</span>
                        )}
                        {p.losDays >= 7 && p.losDays < 14 && (
                          <span className="ml-[3px] text-[9px] text-[var(--ds-color-warning)]">!</span>
                        )}
                      </td>
                      <td className="px-[12px] py-[10px]">
                        <DesktopBadge tone={getPaymentTone(p.paymentLabel)}>
                          {p.paymentLabel?.split(' - ')[0] ?? '-'}
                        </DesktopBadge>
                      </td>
                      <td className="px-[12px] py-[10px]">
                        <DesktopBadge tone={getStatusTone(p.encounterStatus)}>
                          {getStatusLabel(p.encounterStatus)}
                        </DesktopBadge>
                      </td>
                      <td className="px-[12px] py-[10px]">
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
                                handleAction()
                              }}
                            >
                              Pulang
                            </DesktopButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-[10px] border-t border-[var(--ds-color-border)] px-[16px] py-[10px]">
            <span className="text-[11.5px] text-[var(--ds-color-text-muted)]">
              {sorted.length === 0 ? (
                'Tidak ada data'
              ) : (
                <>
                  Menampilkan{' '}
                  <b className="text-[var(--ds-color-text)]">
                    {startIdx + 1}–{Math.min(startIdx + perPage, sorted.length)}
                  </b>{' '}
                  dari <b className="text-[var(--ds-color-text)]">{sorted.length}</b> pasien
                </>
              )}
            </span>
            <div className="flex-1" />
            <div className="flex items-center gap-[3px]">
              <PaginationButton label="«" target={1} disabled={safePage === 1} />
              <PaginationButton label="‹" target={safePage - 1} disabled={safePage === 1} />
              {pageWindow.map((n) => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={`min-w-[30px] rounded-[var(--ds-radius)] border px-[9px] py-[4px] text-[12px] ${
                    n === safePage
                      ? 'border-[var(--ds-color-accent)] bg-[var(--ds-color-accent)] font-semibold text-white'
                      : 'border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text)]'
                  }`}
                >
                  {n}
                </button>
              ))}
              <PaginationButton label="›" target={safePage + 1} disabled={safePage === totalPages} />
              <PaginationButton label="»" target={totalPages} disabled={safePage === totalPages} />
            </div>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="rounded-[var(--ds-radius)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[7px] py-[4px] text-[11.5px] text-[var(--ds-color-text)] outline-none"
            >
              <option value={5}>5 / hal</option>
              <option value={10}>10 / hal</option>
              <option value={25}>25 / hal</option>
              <option value={50}>50 / hal</option>
            </select>
          </div>
        </div>

        {/* Right: detail panel */}
        {selected && (
          <div className="w-[300px] shrink-0 rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)]">
            {/* Header */}
            <div className="flex items-center gap-[8px] border-b border-[var(--ds-color-border)] px-[16px] py-[12px]">
              <span className="text-[13px] font-semibold text-[var(--ds-color-text)]">Ringkasan</span>
              <div className="flex-1" />
              {selected.wardName && <DesktopTag>{selected.wardName}</DesktopTag>}
            </div>
            {/* Body */}
            <div className="flex flex-col gap-[12px] px-[16px] py-[14px]">
              {/* Avatar + name */}
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

              {/* Detail grid */}
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
                    <div className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--ds-color-text-muted)]">
                      {label}
                    </div>
                    <div className="font-medium text-[var(--ds-color-text)]">{value}</div>
                  </div>
                ))}
              </div>

              {/* LOS warning */}
              {selected.losDays >= 7 && (
                <div
                  className="rounded-[var(--ds-radius)] border px-[10px] py-[7px] text-[11.5px]"
                  style={{
                    background: 'color-mix(in srgb, var(--ds-color-warning) 12%, white)',
                    borderColor: 'var(--ds-color-warning)',
                    color: 'var(--ds-color-warning)',
                  }}
                >
                  {selected.losDays >= 14
                    ? '⚠ LOS sangat panjang — perlu evaluasi.'
                    : '! LOS panjang — monitor DPJP.'}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-[6px]">
                {(['Buka CPPT', 'Vital Signs', 'Resep / MAR', 'Transfer Kamar'] as string[]).map((label) => (
                  <DesktopButton key={label} emphasis="toolbar" onClick={handleAction}>
                    {label}
                  </DesktopButton>
                ))}
                {selected.encounterStatus === 'IN_PROGRESS' && (
                  <DesktopButton emphasis="primary" onClick={handleAction}>
                    Proses Pulang
                  </DesktopButton>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
