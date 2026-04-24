import {
  FileTextOutlined,
  ReloadOutlined,
  DownloadOutlined,
  PrinterOutlined,
  LogoutOutlined,
  FilterOutlined,
  PlusOutlined,
  TeamOutlined,
  CheckOutlined
} from '@ant-design/icons'
import { Button, Spin, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import { useEncounterList } from '@renderer/hooks/query/use-encounter'
import KasirStatsStrip from './kasir-stats-strip'
import { rpc, client } from '@renderer/utils/client'
import { useQueryClient } from '@tanstack/react-query'

interface EncounterRow {
  id: string
  encounterCode?: string | null
  no?: number
  queueTicket?: { queueNumber?: number; formattedQueueNumber?: string } | null
  visitDate?: string | Date
  startTime?: string | Date | null
  arrivalType?: string | null
  patient?: { name?: string; id?: string; mrn?: string }
  serviceUnit?: { id?: string; name?: string; type?: string } | null
  serviceType?: string
  reason?: string
  status?: string
  invoiceStatus?: string | null
  total?: number
  paid?: number
  remaining?: number
}

// ── Status config — matches Kasir.jsx design mockup exactly ─────────────────
// DB status mapping:
//   issued   → Siap Bayar    → orange  (--warn)
//   dp       → Bayar Sebagian → violet  (--violet)
//   balanced → Lunas          → green   (--ok)
//   draft    → Dalam Proses   → gray    (--text-3)
const ST: Record<string, { textClass: string; bgClass: string; dotClass: string; label: string; borderColor: string }> = {
  draft: { textClass: 'text-gray-500', bgClass: 'bg-gray-100', dotClass: 'bg-gray-400', label: 'Dalam Proses', borderColor: '#9ca3af' },
  issued: { textClass: 'text-orange-600', bgClass: 'bg-orange-50', dotClass: 'bg-orange-500', label: 'Siap Bayar', borderColor: '#f97316' },
  dp: { textClass: 'text-violet-600', bgClass: 'bg-violet-50', dotClass: 'bg-violet-500', label: 'Bayar Sebagian', borderColor: '#7c3aed' },
  balanced: { textClass: 'text-green-700', bgClass: 'bg-green-50', dotClass: 'bg-green-500', label: 'Lunas', borderColor: '#16a34a' },
}

const getST = (s?: string | null) =>
  ST[s || 'draft'] ?? { textClass: 'text-gray-400', bgClass: 'bg-gray-50', dotClass: 'bg-gray-300', label: 'Belum Ada', borderColor: '#e5e7eb' }

const StBadge = ({ status }: { status?: string | null }) => {
  const st = getST(status)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold ${st.bgClass} ${st.textClass}`}>
      <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${st.dotClass}`} />
      {st.label}
    </span>
  )
}

const TotalAmountCell = ({ record, fmt }: { record: EncounterRow; fmt: (v: number) => string }) => {
  const { data } = client.kasir.getInvoice.useQuery(
    {
      encounterId: record.id,
      patientId: record.patient?.id ?? ''
    },
    {
      enabled: (record.total ?? 0) === 0 && !!record.patient?.id
    }
  )

  const val = (data as any)?.result?.total ?? record.total ?? 0
  return <div className="text-[12px] font-bold font-mono text-ds-text">{fmt(val)}</div>
}

const formatEnum = (val?: string) => {
  if (!val) return '-'
  const lower = val.toLowerCase()
  if (lower === 'outpatient' || lower === 'amb') return 'Rawat Jalan'
  if (lower === 'inpatient' || lower === 'imp') return 'Rawat Inap'
  if (lower === 'emergency' || lower === 'emer') return 'IGD'
  if (lower === 'lab') return 'Laboratorium'
  if (lower === 'div') return 'Rawat Jalan' // Asumsi div adalah poli/ambulatory
  
  return val
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function KasirEncounterTable() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { handleTriggerClose } = useOutletContext<{ handleTriggerClose: () => void }>()

  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all')
  const [searchPatient, setSearchPatient] = useState('')
  const [searchMrn, setSearchMrn] = useState('')
  const [searchQueueNumber, setSearchQueueNumber] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debouncedMrn, setDebouncedMrn] = useState('')
  const [debouncedQueueNumber, setDebouncedQueueNumber] = useState('')
  const [visitDate, setVisitDate] = useState<string | null>(null)
  const [serviceUnitId, setServiceUnitId] = useState<string | undefined>(undefined)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchPatient)
      setDebouncedMrn(searchMrn)
      setDebouncedQueueNumber(searchQueueNumber)
    }, 400)
    return () => clearTimeout(t)
  }, [searchPatient, searchMrn, searchQueueNumber])

  const {
    data: encounterData,
    isLoading: isEncounterLoading,
    isRefetching: isEncounterRefetching,
    refetch: refetchEncounter
  } = useEncounterList({
    q: debouncedSearch || undefined,
    mrn: debouncedMrn || undefined,
    queueNumber: debouncedQueueNumber || undefined,
    startDate: visitDate ? dayjs(visitDate).startOf('day').toISOString() : undefined,
    endDate: visitDate ? dayjs(visitDate).endOf('day').toISOString() : undefined,
    serviceUnitId
  })

  const allEncounters = useMemo<EncounterRow[]>(() => {
    const raw = (encounterData as any)?.result || (encounterData as any)?.data || []
    const rows = Array.isArray(raw) ? (raw as EncounterRow[]) : []
    console.log('[Kasir] allEncounters sample:', rows[0])
    return rows
  }, [encounterData])

  const encounterRows = useMemo<EncounterRow[]>(() => {
    const filtered =
      invoiceStatusFilter === 'all'
        ? allEncounters
        : allEncounters.filter((r) => r.invoiceStatus === invoiceStatusFilter)
    return filtered.map((r, idx) => ({ ...r, no: idx + 1 }))
  }, [allEncounters, invoiceStatusFilter])

  const siapBayarCount = useMemo(() => allEncounters.filter((r) => r.invoiceStatus === 'issued').length, [allEncounters])
  const dalamProsesCount = useMemo(() => allEncounters.filter((r) => r.invoiceStatus === 'draft').length, [allEncounters])
  const partialCount = useMemo(() => allEncounters.filter((r) => r.invoiceStatus === 'dp').length, [allEncounters])
  const lunasCount = useMemo(() => allEncounters.filter((r) => r.invoiceStatus === 'balanced').length, [allEncounters])
  const totalCount = useMemo(() => allEncounters.length, [allEncounters])

  const totalTagihan = useMemo(() => allEncounters.reduce((acc, r) => acc + (r.total ?? 0), 0), [allEncounters])
  const totalPaid = useMemo(() => allEncounters.reduce((acc, r) => acc + (r.paid ?? 0), 0), [allEncounters])
  const totalRemaining = useMemo(() => allEncounters.reduce((acc, r) => acc + (r.remaining ?? 0), 0), [allEncounters])

  const todayFormatted = useMemo(() => dayjs().format('DD MMM YYYY'), [])

  const selectedEncounter = useMemo(
    () => encounterRows.find((r) => String(r.id) === selectedId) ?? null,
    [encounterRows, selectedId]
  )

  const { data: selectedInvoiceData, isLoading: isLoadingInvoice } = client.kasir.getInvoice.useQuery({
    encounterId: selectedId!,
    patientId: selectedEncounter?.patient?.id ?? ''
  }, {
    enabled: !!selectedId && !!selectedEncounter?.patient?.id
  })

  const selectedInvoice = (selectedInvoiceData as any)?.result
  const realTotal = selectedInvoice?.total ?? selectedEncounter?.total ?? 0
  const realRemaining = selectedInvoice ? (selectedInvoice.total - (selectedEncounter?.paid ?? 0)) : (selectedEncounter?.remaining ?? 0)

  // Auto-select first row
  useEffect(() => {
    if (!selectedId && encounterRows.length > 0) {
      setSelectedId(String(encounterRows[0].id))
    }
  }, [encounterRows, selectedId])

  const fmt = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val)

  const handleConfirm = async () => {
    if (!selectedEncounter) return
    const encounterId = selectedEncounter.id
    const patientId = selectedEncounter.patient?.id
    if (!encounterId || !patientId) {
      message.error('Data encounter atau pasien tidak lengkap')
      return
    }

    setConfirming(true)
    try {
      const res = (await rpc.kasir.confirmInvoice({ encounterId, patientId })) as {
        success: boolean
        message?: string
      }
      if (res.success) {
        message.success('Invoice berhasil dikonfirmasi')
        queryClient.invalidateQueries({ queryKey: ['encounter', 'list'] })
      } else {
        message.error(res.message ?? 'Gagal mengkonfirmasi invoice')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      message.error(msg)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-end gap-4 mb-2 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.015em] m-0 text-ds-text">
            Kasir — Billing &amp; Pembayaran
          </h1>
          <div className="text-[12.5px] text-ds-muted mt-0.5">
            {siapBayarCount} siap bayar · {dalamProsesCount} dalam proses · {todayFormatted} · Shift Pagi
          </div>
        </div>
        <div className="ml-auto flex gap-2 items-center">
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-ds-md border border-transparent bg-transparent text-ds-text text-[12.5px] font-medium cursor-pointer hover:bg-ds-surface-muted">
            <DownloadOutlined style={{ fontSize: 14 }} /> Ekspor
          </button>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-ds-md border border-transparent bg-transparent text-ds-text text-[12.5px] font-medium cursor-pointer hover:bg-ds-surface-muted">
            <PrinterOutlined style={{ fontSize: 14 }} /> Laporan Harian
          </button>
          {/* <Button icon={<ReloadOutlined />} onClick={() => refetchEncounter()} loading={isEncounterRefetching} style={{ height: 32, borderRadius: 6 }}>
            Refresh
          </Button> */}
          <Button danger icon={<LogoutOutlined />} onClick={handleTriggerClose} style={{ height: 32, borderRadius: 6 }}>
            Tutup Kasir
          </Button>
        </div>
      </div>

      {/* ── Stats Strip ─────────────────────────────────────────── */}
      <KasirStatsStrip
        siapBayarCount={siapBayarCount}
        partialCount={partialCount}
        dalamProsesCount={dalamProsesCount}
        lunasCount={lunasCount}
        totalTagihan={totalTagihan}
        totalPaid={totalPaid}
        totalRemaining={totalRemaining}
      />

      {/* ── Main Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 items-start">

        {/* LEFT: List */}
        <div className="bg-ds-surface border border-ds-border rounded-ds-lg overflow-hidden shadow-sm flex flex-col">
          {/* Card header */}
          <div className="px-4 py-2 border-b border-ds-border flex items-center justify-between bg-white">
            <div className="flex items-baseline gap-2">
              <h3 className="text-[14px] font-bold m-0 text-ds-text">Daftar Tagihan</h3>
              <span className="text-[11px] text-ds-muted">Semua encounter aktif</span>
            </div>
            <button className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-ds-md border border-ds-border bg-white text-ds-text text-[11.5px] font-medium cursor-pointer hover:bg-ds-surface-muted">
              <FilterOutlined style={{ fontSize: 12 }} /> Filter
            </button>
          </div>

          {/* Status filter tabs */}
          <div className="px-3 py-1.5 border-b border-ds-border flex gap-1 flex-wrap bg-white">
            {([
              ['all', 'Semua', totalCount],
              ['issued', 'Siap Bayar', siapBayarCount],
              ['dp', 'Sebagian', partialCount],
              ['draft', 'Proses', dalamProsesCount],
              ['balanced', 'Lunas', lunasCount],
            ] as [string, string, number][]).map(([k, l, c]) => {
              const active = invoiceStatusFilter === k
              return (
                <button
                  key={k}
                  onClick={() => setInvoiceStatusFilter(k)}
                  className={`px-2.5 py-1 rounded border-none cursor-pointer text-[11.5px] transition-all flex items-center gap-1 ${active
                      ? 'bg-ds-accent-soft text-ds-accent font-semibold'
                      : 'bg-transparent text-ds-muted hover:bg-ds-surface-muted'
                    }`}
                >
                  {l}
                  <span className={`px-1.5 rounded-full text-[10px] font-mono ${active ? 'bg-ds-accent text-white' : 'bg-ds-surface-muted text-ds-muted'}`}>
                    {c}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_90px_110px_90px] px-4 py-[7px] border-b border-ds-border" style={{ background: 'var(--surface-2)' }}>
            {['Pasien & Tagihan', 'Jenis', 'Total', 'Status'].map((h, i) => (
              <div key={i} className={`text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ds-muted ${i >= 2 ? 'text-right' : ''}`}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="overflow-auto">
            {isEncounterLoading || isEncounterRefetching ? (
              <div className="p-12 flex justify-center"><Spin size="large" /></div>
            ) : encounterRows.length === 0 ? (
              <div className="p-12 text-center text-ds-muted text-[12px]">Tidak ada data tagihan</div>
            ) : (
              encounterRows.map((record, i) => {
                const isSel = selectedId === String(record.id)
                const st = getST(record.invoiceStatus)

                return (
                  <div
                    key={record.id}
                    onClick={() => setSelectedId(String(record.id))}
                    style={{ borderLeftColor: isSel ? '#2563eb' : st.borderColor }}
                    className={`grid grid-cols-[1fr_90px_110px_90px] px-4 py-[10px] cursor-pointer transition-colors border-l-[3px] ${i < encounterRows.length - 1 ? 'border-b border-ds-border' : ''
                      } ${isSel ? 'bg-ds-accent-soft' : 'bg-white hover:bg-ds-surface-muted/30'}`}
                  >
                    {/* Pasien */}
                    <div className="flex flex-col gap-[2px] min-w-0">
                      <div className={`text-[12.5px] font-bold truncate ${isSel ? 'text-ds-accent' : 'text-ds-text'}`}>
                        {record.patient?.name || 'Pasien Tanpa Nama'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-ds-muted font-mono">
                        <span>{(record.patient as any)?.medicalRecordNumber || '-'}</span>
                        <span>·</span>
                        <span>{(record as any).payer?.name || 'Umum'}</span>
                      </div>
                      <div className="text-[10.5px] text-ds-muted/80 truncate">
                        {record.encounterCode || record.id} · {dayjs(record.visitDate).format('DD MMM YYYY')}
                      </div>
                    </div>

                    {/* Jenis */}
                    <div className="flex items-center text-[11px] text-ds-muted">
                      {formatEnum((record as any).encounterType || record.serviceUnit?.type || record.serviceType)}
                    </div>

                    {/* Total */}
                    <div className="flex flex-col items-end justify-center gap-[2px]">
                      <TotalAmountCell record={record} fmt={fmt} />
                      {(record.paid ?? 0) > 0 && (record.paid ?? 0) < (record.total ?? 0) && (
                        <div style={{ fontSize: 10.5, color: 'var(--ok)', fontFamily: 'var(--font-mono)' }}>
                          +{fmt(record.paid ?? 0)}
                        </div>
                      )}
                      {record.invoiceStatus === 'balanced' && (
                        <div style={{ fontSize: 10.5, color: 'var(--ok)' }}>Lunas ✓</div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-end">
                      <StBadge status={record.invoiceStatus} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT: Detail Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {selectedEncounter ? (
            <div className="bg-white border border-ds-border rounded-ds-lg overflow-hidden shadow-sm">
              {/* Card Header */}
              {/* Card Header */}
              <div className="px-4 py-4 border-b border-ds-border flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[17px] font-bold text-gray-900">
                    {selectedEncounter.patient?.name || 'Pasien Tanpa Nama'}
                  </div>
                  <div className="text-[11.5px] text-gray-500 mt-1 flex gap-2 items-center">
                    <span className="font-mono">{(selectedEncounter.patient as any)?.medicalRecordNumber || '-'}</span>
                    <span className="opacity-40">·</span>
                    <span>{formatEnum((selectedEncounter as any).encounterType || selectedEncounter.serviceUnit?.type || selectedEncounter.serviceType)}</span>
                  </div>
                </div>
                <StBadge status={selectedEncounter.invoiceStatus} />
              </div>

              {/* Card Body */}
              <div className="p-4">
                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-3.5 mb-4">
                  {([
                    ['NO. INVOICE', selectedEncounter.encounterCode || selectedEncounter.id, true],
                    ['TANGGAL', dayjs(selectedEncounter.visitDate).format('DD MMM YYYY'), false],
                    ['DPJP', selectedInvoice?.dokterPemeriksa || (selectedEncounter as any).doctor?.name || '-', false],
                    ['PENJAMIN', (selectedEncounter as any).payer?.name || 'Umum', false],
                  ] as [string, string, boolean][]).map(([l, v, mono], i) => (
                    <div key={i}>
                      <div className="text-[10px] font-bold tracking-[0.05em] uppercase text-gray-400 mb-0.5">
                        {l}
                      </div>
                      <div className={`text-[13px] font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>
                        {v}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial summary */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-2.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[12.5px] text-gray-500 font-medium">Total Tagihan</span>
                    <span className="font-mono text-[14px] font-bold text-gray-900">
                      {isLoadingInvoice ? <Spin size="small" /> : fmt(realTotal)}
                    </span>
                  </div>
                  {(selectedEncounter.paid ?? 0) > 0 && (
                    <div className="flex justify-between items-baseline">
                      <span className="text-[12.5px] text-gray-500 font-medium">Sudah Dibayar</span>
                      <span className="font-mono text-[14px] font-bold text-green-600">
                        {fmt(selectedEncounter.paid ?? 0)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-slate-300 my-0.5" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-[13.5px] font-extrabold text-gray-900">Sisa Tagihan</span>
                    <span className="font-mono text-[19px] font-extrabold text-red-600">
                      {isLoadingInvoice ? <Spin size="small" /> : fmt(realRemaining)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Quick action buttons */}
          {selectedEncounter && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                className="flex items-center justify-center gap-2 h-9 px-4 rounded-ds-md border border-ds-border bg-white text-ds-text text-[12.5px] font-semibold cursor-pointer hover:bg-ds-surface-muted"
                onClick={() => navigate(`/dashboard/kasir/invoice/${selectedEncounter.id}?patientId=${selectedEncounter.patient?.id ?? ''}`)}
              >
                <FileTextOutlined style={{ fontSize: 14 }} /> Lihat Detail Invoice
              </button>

              {(!selectedEncounter.invoiceStatus || selectedEncounter.invoiceStatus === 'draft') && (
                <button
                  className="flex items-center justify-center gap-2 h-9 px-4 rounded-ds-md border border-[#f97316] bg-[#fff7ed] text-[#f97316] text-[12.5px] font-bold cursor-pointer hover:opacity-90 shadow-sm"
                  onClick={handleConfirm}
                  disabled={confirming}
                >
                  <CheckOutlined style={{ fontSize: 14 }} /> {confirming ? 'Memproses...' : 'Konfirmasi & Kunci Invoice'}
                </button>
              )}

              {(selectedEncounter.invoiceStatus === 'issued' || selectedEncounter.invoiceStatus === 'dp') && (
                <button
                  className="flex items-center justify-center gap-2 h-9 px-4 rounded-ds-md border-none bg-ds-accent text-white text-[13px] font-bold cursor-pointer hover:opacity-90 shadow-sm"
                  onClick={() => navigate(`/dashboard/kasir/invoice/${selectedEncounter.id}?patientId=${selectedEncounter.patient?.id ?? ''}&action=pay`)}
                >
                  <PlusOutlined style={{ fontSize: 15 }} /> Input Pembayaran
                </button>
              )}

              <button className="flex items-center justify-center gap-2 h-9 px-4 rounded-ds-md border border-ds-border bg-white text-ds-text text-[12.5px] font-semibold cursor-pointer hover:bg-ds-surface-muted">
                <PrinterOutlined style={{ fontSize: 14 }} /> Cetak Invoice / Kwitansi
              </button>

              <button
                className="flex items-center justify-center gap-2 h-9 px-4 rounded-ds-md border border-ds-border bg-white text-ds-text text-[12.5px] font-semibold cursor-pointer hover:bg-ds-surface-muted"
                onClick={() => navigate(`/dashboard/kasir/invoice/${selectedEncounter.id}?patientId=${selectedEncounter.patient?.id ?? ''}&tab=billing`)}
              >
                <TeamOutlined style={{ fontSize: 14 }} /> Alokasi Billing
              </button>
            </div>
          )}

          {!selectedEncounter && (
            <div className="h-64 border-2 border-dashed border-ds-border rounded-ds-lg flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-ds-surface-muted flex items-center justify-center mb-3">
                <FileTextOutlined className="text-ds-muted text-xl" />
              </div>
              <div className="text-ds-text font-bold text-[14px]">Pilih Pasien</div>
              <p className="text-ds-muted text-[12px] mt-1 max-w-[200px]">
                Silakan pilih salah satu data di daftar untuk melihat detail tagihan
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
