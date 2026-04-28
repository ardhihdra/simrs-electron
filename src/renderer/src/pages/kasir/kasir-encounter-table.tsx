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
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import { useEncounterList } from '@renderer/hooks/query/use-encounter'
import KasirStatsStrip from './kasir-stats-strip'
import { rpc, client } from '@renderer/utils/client'
import { useQueryClient } from '@tanstack/react-query'
import {
  DesktopStatusPill,
  type DesktopStatusPillTone
} from '@renderer/components/design-system/atoms/DesktopStatusPill'
import {
  DesktopPropertyGrid,
  type DesktopPropertyItem
} from '@renderer/components/design-system/molecules/DesktopPropertyGrid'
import { DesktopButton } from '@renderer/components/design-system/atoms/DesktopButton'
import { DesktopCard } from '@renderer/components/design-system/molecules/DesktopCard'
import { DesktopIcon } from '@renderer/components/design-system/atoms/DesktopIcon'
import { DesktopGenericTable } from '@renderer/components/design-system/organisms/DesktopGenericTable'

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
const ST: Record<
  string,
  { textClass: string; bgClass: string; dotClass: string; label: string; borderColor: string }
> = {
  draft: {
    textClass: 'text-gray-500',
    bgClass: 'bg-gray-100',
    dotClass: 'bg-gray-400',
    label: 'Dalam Proses',
    borderColor: '#9ca3af'
  },
  issued: {
    textClass: 'text-orange-600',
    bgClass: 'bg-orange-50',
    dotClass: 'bg-orange-500',
    label: 'Siap Bayar',
    borderColor: '#f97316'
  },
  deposit: {
    textClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    dotClass: 'bg-blue-500',
    label: 'Deposit',
    borderColor: '#3b82f6'
  },
  sebagian: {
    textClass: 'text-violet-600',
    bgClass: 'bg-violet-50',
    dotClass: 'bg-violet-500',
    label: 'Sebagian',
    borderColor: '#7c3aed'
  },
  balanced: {
    textClass: 'text-green-700',
    bgClass: 'bg-green-50',
    dotClass: 'bg-green-500',
    label: 'Lunas',
    borderColor: '#16a34a'
  }
}

const getST = (s?: string | null) =>
  ST[s || 'draft'] ?? {
    textClass: 'text-gray-400',
    bgClass: 'bg-gray-50',
    dotClass: 'bg-gray-300',
    label: 'Belum Ada',
    borderColor: '#e5e7eb'
  }

const StBadge = ({ record }: { record: EncounterRow }) => {
  if (!record) return null
  let status = record.invoiceStatus || 'draft'
  const paid = Number(record.paid ?? 0)
  const total = Number(record.total ?? 0)

  // Logic to distinguish DP vs Sebagian
  if (status !== 'balanced' && paid > 0) {
    if (total === 0) {
      status = 'deposit'
    } else {
      status = 'sebagian'
    }
  }

  const toneMap: Record<string, DesktopStatusPillTone> = {
    issued: 'warning',
    deposit: 'info',
    sebagian: 'violet',
    balanced: 'success',
    draft: 'neutral'
  }
  const labelMap: Record<string, string> = {
    issued: 'Siap Bayar',
    deposit: 'Deposit',
    sebagian: 'Sebagian',
    balanced: 'Lunas',
    draft: 'Dalam Proses'
  }
  return (
    <DesktopStatusPill tone={toneMap[status || 'draft']}>
      {labelMap[status || 'draft'] || 'Belum Ada'}
    </DesktopStatusPill>
  )
}

const TotalAmountCell = ({ record, fmt }: { record: EncounterRow; fmt: (v: number) => string }) => {
  const { data } = client.kasir.getInvoice.useQuery(
    {
      encounterId: record.id,
      patientId: record.patient?.id ?? ''
    },
    {
      enabled: (record.total ?? 0) === 0 && !!record.patient?.id,
      queryKey: [
        'kasir.getInvoice',
        { encounterId: record.id, patientId: record.patient?.id || '' }
      ]
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

  const columns: ColumnsType<EncounterRow> = [
    {
      title: 'Pasien & Tagihan',
      key: 'patient',
      onCell: (record) => {
        const status = record.invoiceStatus || 'draft'
        const colorMap: Record<string, string> = {
          issued: '#f97316',
          deposit: '#7c3aed',
          balanced: '#16a34a',
          draft: '#9ca3af'
        }
        const isSel = selectedId === String(record.id)
        return {
          style: {
            borderLeft: `4px solid ${isSel ? 'var(--ds-color-accent)' : colorMap[status]}`,
            paddingLeft: '12px'
          }
        }
      },
      render: (_, record) => (
        <div className="flex flex-col gap-[2px] min-w-0">
          <div
            className={`text-[12.5px] font-bold truncate ${selectedId === String(record.id) ? 'text-ds-accent' : 'text-ds-text'}`}
          >
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
      )
    },
    {
      title: 'Jenis',
      key: 'type',
      width: 100,
      render: (_, record) => (
        <span className="text-[11px] text-ds-muted">
          {formatEnum(
            (record as any).encounterType || record.serviceUnit?.type || record.serviceType
          )}
        </span>
      )
    },
    {
      title: 'Total',
      key: 'total',
      align: 'right',
      width: 120,
      render: (_, record) => (
        <div className="flex flex-col items-end justify-center leading-tight">
          <TotalAmountCell record={record} fmt={fmt} />
          {(record.paid ?? 0) > 0 && (record.paid ?? 0) < (record.total ?? 0) && (
            <div className="flex flex-col items-end mt-0.5">
              <span className="text-[10px] text-[var(--ds-color-success)] font-mono font-bold">
                +{fmt(record.paid ?? 0)}
              </span>
              <span className="text-[10px] text-[var(--ds-color-success)]">bayar</span>
            </div>
          )}
          {record.invoiceStatus === 'balanced' && (
            <div className="text-[10px] text-[var(--ds-color-success)] font-bold mt-0.5">
              Lunas ✓
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      align: 'right',
      width: 120,
      render: (_, record) => <StBadge record={record} />
    }
  ]

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
        : allEncounters.filter((r) => {
            const s = r.invoiceStatus || 'draft'
            const paid = Number(r.paid ?? 0)
            const total = Number(r.total ?? 0)
            let derived = s
            if (s !== 'balanced' && paid > 0) {
              derived = total === 0 ? 'deposit' : 'sebagian'
            }

            return derived === invoiceStatusFilter
          })
    return filtered.map((r, idx) => ({ ...r, no: idx + 1 }))
  }, [allEncounters, invoiceStatusFilter])

  const siapBayarCount = useMemo(
    () =>
      allEncounters.filter((r) => {
        const s = r.invoiceStatus || 'draft'
        const paid = Number(r.paid ?? 0)
        return s === 'issued' && paid === 0
      }).length,
    [allEncounters]
  )

  const dalamProsesCount = useMemo(
    () =>
      allEncounters.filter((r) => {
        const s = r.invoiceStatus || 'draft'
        const paid = Number(r.paid ?? 0)
        return s === 'draft' && paid === 0
      }).length,
    [allEncounters]
  )

  const depositCount = useMemo(
    () =>
      allEncounters.filter((r) => {
        const s = r.invoiceStatus || 'draft'
        const paid = Number(r.paid ?? 0)
        const total = Number(r.total ?? 0)
        return s !== 'balanced' && paid > 0 && total === 0
      }).length,
    [allEncounters]
  )

  const partialCount = useMemo(
    () =>
      allEncounters.filter((r) => {
        const s = r.invoiceStatus || 'draft'
        const paid = Number(r.paid ?? 0)
        const total = Number(r.total ?? 0)
        return s !== 'balanced' && paid > 0 && total > 0
      }).length,
    [allEncounters]
  )

  const lunasCount = useMemo(
    () => allEncounters.filter((r) => r.invoiceStatus === 'balanced').length,
    [allEncounters]
  )
  const totalCount = useMemo(() => allEncounters.length, [allEncounters])

  const totalTagihan = useMemo(
    () => allEncounters.reduce((acc, r) => acc + (r.total ?? 0), 0),
    [allEncounters]
  )
  const totalPaid = useMemo(
    () => allEncounters.reduce((acc, r) => acc + (r.paid ?? 0), 0),
    [allEncounters]
  )
  const totalRemaining = useMemo(
    () => allEncounters.reduce((acc, r) => acc + (r.remaining ?? 0), 0),
    [allEncounters]
  )

  const todayFormatted = useMemo(() => dayjs().format('DD MMM YYYY'), [])

  const selectedEncounter = useMemo(
    () => encounterRows.find((r) => String(r.id) === selectedId) ?? null,
    [encounterRows, selectedId]
  )

  const { data: selectedInvoiceData, isLoading: isLoadingInvoice } =
    client.kasir.getInvoice.useQuery(
      {
        encounterId: selectedId!,
        patientId: selectedEncounter?.patient?.id ?? ''
      },
      {
        enabled: !!selectedId && !!selectedEncounter?.patient?.id,
        queryKey: [
          'kasir.getInvoice',
          { encounterId: selectedId || '', patientId: selectedEncounter?.patient?.id || '' }
        ]
      }
    )

  const selectedInvoice = (selectedInvoiceData as any)?.result
  const realTotal = selectedInvoice?.total ?? selectedEncounter?.total ?? 0
  const realRemaining = selectedInvoice
    ? selectedInvoice.total - (selectedEncounter?.paid ?? 0)
    : (selectedEncounter?.remaining ?? 0)

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
      <style>{`
        .kasir-table .ant-table-cell { border-radius: 0 !important; }
        .kasir-table .ant-table-row { border-radius: 0 !important; }
      `}</style>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-end gap-4 mb-2 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.015em] m-0 text-ds-text">
            Kasir — Billing &amp; Pembayaran
          </h1>
          <div className="text-[12.5px] text-ds-muted mt-0.5">
            {siapBayarCount} siap bayar · {dalamProsesCount} dalam proses · {todayFormatted} · Shift
            Pagi
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
          <Button
            danger
            icon={<LogoutOutlined />}
            onClick={handleTriggerClose}
            style={{ height: 32, borderRadius: 6 }}
          >
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
        <div className="bg-ds-surface border border-ds-border rounded-ds-md overflow-hidden shadow-sm flex flex-col">
          <DesktopGenericTable
            cardHeader={{
              title: 'Daftar Tagihan',
              subtitle: 'Semua encounter aktif',
              action: (
                <button className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-ds-md border border-ds-border bg-white text-ds-text text-[11.5px] font-medium cursor-pointer hover:bg-ds-surface-muted">
                  <FilterOutlined style={{ fontSize: 12 }} /> Filter
                </button>
              ),
            }}
            statusFilter={{
              items: [
                { key: 'all', label: 'Semua', count: totalCount },
                { key: 'issued', label: 'Siap Bayar', count: siapBayarCount },
                { key: 'deposit', label: 'Deposit', count: depositCount },
                { key: 'sebagian', label: 'Sebagian', count: partialCount },
                { key: 'draft', label: 'Proses', count: dalamProsesCount },
                { key: 'balanced', label: 'Lunas', count: lunasCount },
              ],
              value: invoiceStatusFilter,
              onChange: setInvoiceStatusFilter,
            }}
            columns={columns}
            dataSource={encounterRows}
            rowKey="id"
            loading={isEncounterLoading || isEncounterRefetching}
            tableProps={{
              onRow: (record) => {
                const isSel = selectedId === String(record.id)
                return {
                  onClick: () => setSelectedId(String(record.id)),
                  className: `cursor-pointer transition-colors ${isSel ? 'ant-table-row-selected' : ''}`
                }
              },
              scroll: { y: 'calc(100vh - 350px)' },
              className: 'kasir-table !rounded-none'
            }}
          />
        </div>

        {/* RIGHT: Detail Panel */}
        <div className="flex flex-col gap-4">
          {selectedEncounter ? (
            <>
              <DesktopCard
                title={selectedEncounter.patient?.name || 'Pasien Tanpa Nama'}
                subtitle={`${(selectedEncounter.patient as any)?.medicalRecordNumber || '-'} · ${formatEnum((selectedEncounter as any).encounterType || selectedEncounter.serviceUnit?.type || selectedEncounter.serviceType)}`}
                extra={<StBadge record={selectedEncounter} />}
              >
                <div className="space-y-4">
                  <DesktopPropertyGrid
                    items={[
                      {
                        label: 'NO. INVOICE',
                        value: selectedEncounter.encounterCode || selectedEncounter.id,
                        mono: true
                      },
                      {
                        label: 'TANGGAL',
                        value: dayjs(selectedEncounter.visitDate).format('DD MMM YYYY')
                      },
                      {
                        label: 'DPJP',
                        value:
                          (selectedInvoice as any)?.result?.dokterPemeriksa ||
                          selectedInvoice?.dokterPemeriksa ||
                          (selectedEncounter as any).doctor?.name ||
                          (selectedEncounter as any).practitioner?.name ||
                          (selectedEncounter as any).attendingPhysician?.name ||
                          '-'
                      },
                      { label: 'PENJAMIN', value: (selectedEncounter as any).payer?.name || 'Umum' }
                    ]}
                    columns={2}
                  />

                  <div className="p-3.5 bg-[var(--ds-color-surface-muted)]/50 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] text-[var(--ds-color-text-muted)]">
                        Total Tagihan
                      </span>
                      <span className="font-mono text-[13.5px] font-bold text-[var(--ds-color-text)]">
                        {isLoadingInvoice ? <Spin size="small" /> : fmt(realTotal)}
                      </span>
                    </div>

                    {(selectedEncounter.paid ?? 0) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] text-[var(--ds-color-text-muted)]">
                          Sudah Dibayar
                        </span>
                        <span className="font-mono text-[13.5px] font-bold text-[var(--ds-color-success)]">
                          {fmt(selectedEncounter.paid ?? 0)}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-dashed border-[var(--ds-color-border)] opacity-40 my-0.5" />

                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-bold text-[var(--ds-color-text)]">
                        Sisa Tagihan
                      </span>
                      <span className="font-mono text-[16px] font-bold text-[var(--ds-color-danger)] tracking-tight">
                        {isLoadingInvoice ? <Spin size="small" /> : fmt(realRemaining)}
                      </span>
                    </div>
                  </div>
                </div>
              </DesktopCard>

              {/* Quick action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <DesktopButton
                  emphasis="secondary"
                  onClick={() =>
                    navigate(
                      `/dashboard/kasir/invoice/${selectedEncounter.id}?patientId=${selectedEncounter.patient?.id ?? ''}`
                    )
                  }
                  icon={<FileTextOutlined />}
                >
                  Lihat Detail Invoice
                </DesktopButton>

                {(!selectedEncounter.invoiceStatus ||
                  selectedEncounter.invoiceStatus === 'draft') && (
                  <button
                    className="flex items-center justify-center gap-2 h-ds-button px-4 rounded-ds-md border border-[#f97316] bg-[#fff7ed] text-[#f97316] text-[12.5px] font-bold cursor-pointer hover:opacity-90 shadow-sm"
                    onClick={handleConfirm}
                    disabled={confirming}
                  >
                    <CheckOutlined style={{ fontSize: 14 }} />{' '}
                    {confirming ? 'Memproses...' : 'Konfirmasi & Kunci Invoice'}
                  </button>
                )}

                {selectedEncounter.invoiceStatus !== 'balanced' && (
                  <DesktopButton
                    emphasis="primary"
                    onClick={() =>
                      navigate(
                        `/dashboard/kasir/invoice/${selectedEncounter.id}?patientId=${selectedEncounter.patient?.id ?? ''}&action=pay`
                      )
                    }
                    icon={<PlusOutlined />}
                  >
                    Input Pembayaran
                  </DesktopButton>
                )}

                <DesktopButton emphasis="secondary" icon={<PrinterOutlined />}>
                  Cetak Invoice / Kwitansi
                </DesktopButton>

                <DesktopButton
                  emphasis="secondary"
                  onClick={() =>
                    navigate(
                      `/dashboard/kasir/invoice/${selectedEncounter.id}?patientId=${selectedEncounter.patient?.id ?? ''}&tab=billing`
                    )
                  }
                  icon={<TeamOutlined />}
                >
                  Alokasi Billing
                </DesktopButton>
              </div>
            </>
          ) : (
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
