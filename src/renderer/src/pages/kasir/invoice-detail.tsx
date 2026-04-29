import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  PrinterOutlined,
  RollbackOutlined
} from '@ant-design/icons'
import { rpc, client } from '@renderer/utils/client'
import { Button, Dropdown, Popconfirm, Select, Spin, Tag, Tabs, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PaymentHistory } from './payment-history'
import { printInvoice, printReceipt } from '@renderer/utils/print-service'
import type { Invoice, PersistedInvoice, InvoiceLineItem } from '@renderer/utils/print-service'
import { useMyProfile } from '@renderer/hooks/useProfile'
import { SignaturePadModal } from '@renderer/components/molecules/SignaturePadModal'

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

function formatPrintableDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  issued: { label: 'Terkonfirmasi', color: 'blue' },
  balanced: { label: 'Lunas', color: 'green' },
  draft: { label: 'Draft', color: 'default' },
  deposit: { label: 'Deposit', color: 'blue' },
  sebagian: { label: 'Sebagian', color: 'violet' }
}

const SIGNATURE_SOURCE_OPTIONS = [
  { label: 'Input Manual', value: 'manual' },
  { label: 'Ambil dari Kepegawaian', value: 'kepegawaian' }
]

function toFileUrl(path?: string | null): string | undefined {
  if (!path || typeof path !== 'string') return undefined
  const trimmed = path.trim()
  if (!trimmed) return undefined

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed
  }

  const normalizedPath = trimmed.replace(/\\/g, '/').replace(/^\/+/, '')
  const base = String(window.env?.API_URL || '').replace(/\/+$/, '')

  if (normalizedPath.startsWith('api/files/')) {
    const relative = normalizedPath.replace(/^api\/files\//, '')
    return `${base}/public/${relative}`
  }

  return `${base}/public/${normalizedPath}`
}

// Category config — defines label, accent color, and item extractor per section
const CATEGORIES = [
  {
    key: 'tindakan',
    label: 'Tindakan Medis',
    color: '#2563eb',
    getItems: (inv: Invoice) => inv.tindakanItems ?? []
  },
  {
    key: 'bhp',
    label: 'BHP Pemeriksaan',
    color: '#d97706',
    getItems: (inv: Invoice) => inv.bhpItems ?? []
  },
  {
    key: 'lab',
    label: 'Laboratorium',
    color: '#16a34a',
    getItems: (inv: Invoice) => inv.laboratoryItems ?? []
  },
  {
    key: 'radiologi',
    label: 'Radiologi',
    color: '#0891b2',
    getItems: (inv: Invoice) => inv.radiologyItems ?? []
  },
  { key: 'obat', label: 'Obat', color: '#7c3aed', getItems: (inv: Invoice) => inv.obatItems ?? [] },
  {
    key: 'admin',
    label: 'Administrasi',
    color: '#475569',
    getItems: (inv: Invoice) => inv.administrasiItems ?? []
  }
]

function CompactItemTable({
  title,
  accentColor,
  items
}: {
  title: string
  accentColor: string
  items: InvoiceLineItem[]
}) {
  if (items.length === 0) return null
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
  return (
    <div className="mb-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div
            style={{
              width: 3,
              height: 14,
              background: accentColor,
              borderRadius: 2,
              flexShrink: 0
            }}
          />
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: accentColor }}
          >
            {title}
          </span>
        </div>
        <span className="text-xs font-semibold text-gray-500 font-mono">
          {formatRupiah(subtotal)}
        </span>
      </div>
      <div className="border border-gray-200 rounded overflow-hidden">
        {/* Column header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 44px 120px 110px',
            padding: '4px 10px',
            background: '#f3f4f6',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          {['Deskripsi', 'Qty', 'Harga Satuan', 'Subtotal'].map((h, i) => (
            <span
              key={h}
              className="text-xs font-semibold text-gray-400 uppercase tracking-wide"
              style={{ textAlign: i > 0 ? 'right' : 'left' }}
            >
              {h}
            </span>
          ))}
        </div>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 44px 120px 110px',
              padding: '6px 10px',
              borderBottom: i < items.length - 1 ? '1px solid #e5e7eb' : 'none',
              background: i % 2 === 0 ? '#fff' : '#f9fafb',
              alignItems: 'center'
            }}
          >
            <span className="text-sm text-gray-800">{item.description}</span>
            <span className="text-xs text-gray-400 text-right font-mono">{item.qty}</span>
            <span className="text-xs text-gray-500 text-right font-mono">
              {formatRupiah(item.unitPrice)}
            </span>
            <span className="text-sm font-medium text-right font-mono">
              {formatRupiah(item.subtotal)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InvoiceDetailPage() {
  const { encounterId } = useParams<{ encounterId: string }>()
  const [searchParams] = useSearchParams()
  const patientId = searchParams.get('patientId') ?? ''
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const [signatureSource, setSignatureSource] = useState<'manual' | 'kepegawaian'>('manual')
  const [manualCashierSignature, setManualCashierSignature] = useState<string>('')
  const [selectedCashierTtdUrl, setSelectedCashierTtdUrl] = useState<string | null>(null)
  const [signatureModalVisible, setSignatureModalVisible] = useState(false)
  const [invoiceTab, setInvoiceTab] = useState<'detail' | 'pembayaran' | 'riwayat'>('detail')

  // Dynamic invoice (always fresh from encounter data)
  const { data, isLoading, isError, error } = client.kasir.getInvoice.useQuery({
    encounterId: encounterId!,
    patientId
  })

  // Persisted invoice (null if not yet confirmed)
  const { data: detailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['kasir-invoice-detail', encounterId],
    queryFn: () => rpc.kasir.getInvoiceDetail({ encounterId: encounterId! }),
    enabled: !!encounterId,
    refetchOnWindowFocus: true
  })

  const invoice = (data as { result: Invoice } | undefined)?.result
  const persistedInvoice = (detailData as { result: PersistedInvoice } | undefined)?.result ?? null

  type KepegawaianEmployee = {
    id: number
    nik?: string
    namaLengkap?: string
    ttdUrl?: string
    ttd_url?: string
  }
  const { profile } = useMyProfile()
  const { data: requesterData } = useQuery({
    queryKey: ['kepegawaian', 'list'],
    queryFn: () =>
      (window.api?.query as unknown as Record<string, { list: () => Promise<{ result: KepegawaianEmployee[] }> }>).kepegawaian?.list()
  })

  const cashierEmployee = useMemo(() => {
    if (!profile || !requesterData?.result) return null
    const employees = requesterData.result as KepegawaianEmployee[]
    const sessionId = Number(profile.id)
    const sessionUsername = String(profile.username || '').trim()
    return (
      employees.find(
        (e) =>
          e.id === sessionId ||
          (typeof e.nik === 'string' && e.nik.trim() === sessionUsername) ||
          (typeof e.namaLengkap === 'string' && e.namaLengkap.trim() === sessionUsername)
      ) || null
    )
  }, [profile, requesterData?.result])

  useEffect(() => {
    if (!cashierEmployee) {
      setSelectedCashierTtdUrl(null)
      return
    }
    const ttdUrl = cashierEmployee.ttdUrl || cashierEmployee.ttd_url || null
    setSelectedCashierTtdUrl(typeof ttdUrl === 'string' && ttdUrl.trim() ? ttdUrl : null)
  }, [cashierEmployee])

  const cashierName = useMemo(() => {
    if (!profile) return ''
    if (!cashierEmployee) return profile.username || ''
    return cashierEmployee.namaLengkap || profile.username || ''
  }, [cashierEmployee, profile])

  const cashierSignatureUrl = useMemo(() => {
    if (signatureSource === 'manual') return manualCashierSignature || undefined
    return toFileUrl(selectedCashierTtdUrl)
  }, [manualCashierSignature, selectedCashierTtdUrl, signatureSource])

  const hasKepegawaianSignature = Boolean(toFileUrl(selectedCashierTtdUrl))

  const reopenEncounterMutation = client.encounter.reopen.useMutation()

  const handleReopenEncounter = async () => {
    if (!encounterId) return
    try {
      try {
        await reopenEncounterMutation.mutateAsync(encounterId)
      } catch (e) {
        console.warn('Encounter reopen failed (might be already open):', e)
      }
      if (persistedInvoice) {
        await rpc.kasir.updateStatus({
          id: persistedInvoice.id,
          status:
            persistedInvoice.total === 0 || persistedInvoice.remaining < persistedInvoice.total
              ? 'deposit'
              : 'draft'
        })
      }
      message.success('Invoice berhasil dibuka kuncinya.')
      queryClient.invalidateQueries({ queryKey: ['kasir-invoice-detail', encounterId] })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Gagal memproses permintaan.'
      message.error(msg)
    }
  }

  const handleConfirm = async () => {
    if (!encounterId || !patientId) return
    setConfirming(true)
    try {
      const res = (await rpc.kasir.confirmInvoice({ encounterId, patientId })) as {
        success: boolean
        message?: string
      }
      if (res.success) {
        message.success('Invoice berhasil dikonfirmasi')
        queryClient.invalidateQueries({ queryKey: ['kasir-invoice-detail', encounterId] })
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

  const goToPaymentPage = () => {
    navigate(`/dashboard/kasir/invoice/${encounterId}/bayar?patientId=${patientId}`)
  }

  if (!encounterId || !patientId) {
    return (
      <div className="p-4 text-red-500">
        Parameter tidak lengkap. encounterId dan patientId diperlukan.
      </div>
    )
  }

  const currentStatus = (() => {
    const s = persistedInvoice?.status || 'issued'
    const total = Number(persistedInvoice?.total ?? 0)
    const paid = Number(persistedInvoice?.total ?? 0) - Number(persistedInvoice?.remaining ?? 0)
    if (s !== 'balanced' && paid > 0) {
      return total === 0 ? 'deposit' : 'sebagian'
    }
    return s
  })()

  const statusInfo = persistedInvoice
    ? (STATUS_LABEL[currentStatus as keyof typeof STATUS_LABEL] ?? STATUS_LABEL.issued)
    : null
  const isConfirmed =
    !!persistedInvoice &&
    (persistedInvoice.status === 'issued' || persistedInvoice.status === 'balanced')
  const isPaid = persistedInvoice?.status === 'balanced'
  const totalPaid = persistedInvoice ? persistedInvoice.total - persistedInvoice.remaining : 0
  const grandTotal = invoice?.total ?? 0

  // Derive category totals for the sidebar summary
  const categoryTotals = CATEGORIES.map((cat) => {
    const items = invoice ? cat.getItems(invoice) : []
    const total = items.reduce((s, i) => s + i.subtotal, 0)
    const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0
    return { ...cat, items, total, pct }
  }).filter((c) => c.total > 0)

  // ── Tab contents ───────────────────────────────────────────────────────────

  const detailTabContent = (
    <div className="p-4">
      {/* Invoice meta info */}
      {invoice && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 p-3 mb-4 bg-gray-50 border border-gray-200 rounded">
          {[
            ['No. Invoice', persistedInvoice?.kode ?? '—'],
            ['No. Kunjungan', invoice.encounterCode ?? invoice.encounterId ?? '—'],
            ['Pasien', invoice.namaPatient ?? invoice.patient?.name ?? '—'],
            ['No. RM', invoice.medicalRecordNumber ?? invoice.patient?.medicalRecordNumber ?? '—'],
            ['Dokter', invoice.dokterPemeriksa ?? '—'],
            ['Tgl. Kunjungan', formatPrintableDate(invoice.tanggalPendaftaran)],
            ['Ruangan', invoice.ruangan ?? '—'],
            ['Cara Bayar', invoice.penjamin ?? 'Umum']
          ].map(([label, value]) => (
            <div key={label} className="flex gap-1.5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-28 shrink-0 pt-0.5">
                {label}
              </span>
              <span className="text-xs text-gray-700 font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Per-category item tables */}
      {invoice &&
        CATEGORIES.map((cat) => (
          <CompactItemTable
            key={cat.key}
            title={cat.label}
            accentColor={cat.color}
            items={cat.getItems(invoice)}
          />
        ))}

      {!invoice || categoryTotals.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          Tidak ada item tagihan untuk kunjungan ini.
        </div>
      ) : null}

      {/* Grand total */}
      {invoice && (
        <div className="flex justify-between items-center mt-4 p-3 border-2 border-yellow-500 rounded">
          <span className="font-bold text-sm">Total Tagihan</span>
          <span className="font-black text-xl font-mono">{formatRupiah(grandTotal)}</span>
        </div>
      )}

      {/* Warning banner when not yet confirmed */}
      {!isConfirmed && !isLoadingDetail && invoice && (
        <div className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-400 rounded text-xs text-yellow-700">
          <b>Invoice belum dikunci.</b> Kunci invoice sebelum memproses pembayaran.
        </div>
      )}
    </div>
  )

  const pembayaranTabContent = (
    <div className="p-4">
      {/* Financial summary */}
      {invoice && (
        <div className="p-3 mb-4 bg-gray-50 border border-gray-200 rounded">
          <div className="flex justify-between mb-1.5">
            <span className="text-sm text-gray-500">Total Tagihan</span>
            <span className="font-bold font-mono text-sm">{formatRupiah(grandTotal)}</span>
          </div>
          {totalPaid > 0 && (
            <div className="flex justify-between mb-1.5">
              <span className="text-sm text-green-600">Sudah Dibayar</span>
              <span className="font-semibold font-mono text-sm text-green-600">
                {formatRupiah(totalPaid)}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-dashed border-gray-300">
            <span className="font-semibold text-sm">
              {persistedInvoice?.remaining === 0 ? 'Lunas' : 'Sisa Pembayaran'}
            </span>
            {persistedInvoice?.remaining === 0 ? (
              <CheckCircleOutlined className="text-green-500" />
            ) : (
              <span className="font-black font-mono text-base text-red-500">
                {formatRupiah(persistedInvoice?.remaining ?? grandTotal)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Payment history list */}
      {persistedInvoice && persistedInvoice.payments && persistedInvoice.payments.length > 0 ? (
        <PaymentHistory
          payments={persistedInvoice.payments}
          totalPaid={totalPaid}
          remaining={persistedInvoice.remaining}
          invoice={invoice}
          persistedInvoice={persistedInvoice}
          cashierName={cashierName}
          cashierSignatureUrl={cashierSignatureUrl}
        />
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">
          Belum ada pembayaran yang tercatat.
        </div>
      )}

      {!isPaid && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={goToPaymentPage}
          block
          className="mt-3"
        >
          {isConfirmed ? 'Tambah Pembayaran' : 'Input Deposit'}
        </Button>
      )}
    </div>
  )

  const riwayatTabContent = (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
      <ClockCircleOutlined style={{ fontSize: 32 }} />
      <div className="text-sm text-center">
        {persistedInvoice
          ? `Invoice dibuat pada ${formatPrintableDate((persistedInvoice as PersistedInvoice & { createdAt?: string }).createdAt ?? null)}`
          : 'Invoice belum dikonfirmasi.'}
      </div>
      <div className="text-xs text-gray-300">Belum ada perubahan lebih lanjut.</div>
    </div>
  )

  const tabItems = [
    { key: 'detail', label: 'Detail Tagihan', children: detailTabContent },
    { key: 'pembayaran', label: 'Pembayaran', children: pembayaranTabContent },
    { key: 'riwayat', label: 'Riwayat', children: riwayatTabContent }
  ]

  return (
    <div className="p-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} size="small">
            Kembali
          </Button>
          {statusInfo && (
            <Tag
              color={statusInfo.color}
              icon={isPaid ? <CheckCircleOutlined /> : undefined}
              className="text-sm px-3 py-1"
            >
              {statusInfo.label}
            </Tag>
          )}
          {persistedInvoice && (
            <span className="text-gray-400 text-sm font-mono">No. {persistedInvoice.kode}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {persistedInvoice?.status !== 'cancelled' && (
            <Popconfirm
              title="Kembalikan ke Perawat?"
              description="Status kunjungan akan berubah kembali menjadi Pemeriksaan agar bisa diperbaiki oleh Nurse/Dokter."
              onConfirm={handleReopenEncounter}
              okText="Ya, Kembalikan"
              cancelText="Batal"
              okButtonProps={{ danger: true, loading: reopenEncounterMutation.isPending }}
            >
              <Button
                icon={<RollbackOutlined />}
                danger
                loading={reopenEncounterMutation.isPending}
                size="small"
              >
                Kembalikan ke Perawat
              </Button>
            </Popconfirm>
          )}

          {!isConfirmed && !isLoadingDetail && (
            <Popconfirm
              title="Kunci & Konfirmasi Invoice?"
              description="Rincian tagihan akan dibekukan dan tidak akan berubah otomatis lagi jika klinis menginput data baru. Lanjutkan?"
              onConfirm={handleConfirm}
              okText="Ya, Kunci"
              cancelText="Batal"
            >
              <Button
                type="primary"
                icon={<LockOutlined />}
                loading={confirming}
                disabled={!invoice}
                size="small"
              >
                Konfirmasi Invoice
              </Button>
            </Popconfirm>
          )}

          {isConfirmed && !isPaid && (
            <Tag color="blue" icon={<LockOutlined />} className="m-0 py-0.5 px-2">
              Invoice Terkunci
            </Tag>
          )}
        </div>
      </div>

      {(isLoading || isLoadingDetail) && (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      )}

      {isError && (
        <div className="text-red-500 py-4">
          Gagal memuat invoice: {(error as Error)?.message ?? 'Error tidak diketahui'}
        </div>
      )}

      {/* ── Two-column body ──────────────────────────────────────────────────── */}
      {!isLoading && !isLoadingDetail && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: 16,
            alignItems: 'start'
          }}
        >
          {/* Left: tabbed invoice card */}
          <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden p-1">
            <Tabs
              activeKey={invoiceTab}
              onChange={(key) => setInvoiceTab(key as typeof invoiceTab)}
              items={tabItems}
              size="small"
              tabBarStyle={{ marginBottom: 0, paddingLeft: 16, paddingRight: 16 }}
            />
          </div>

          {/* Right: summary + actions */}
          <div className="flex flex-col gap-3">
            {/* Category summary with progress bars */}
            <div className="bg-white border border-gray-200 rounded shadow-sm">
              <div className="px-4 py-2.5 border-b border-gray-200">
                <span className="font-semibold text-sm text-gray-700">Ringkasan Kategori</span>
              </div>
              <div className="p-4">
                {categoryTotals.length === 0 && (
                  <div className="text-center text-xs text-gray-400 py-4">
                    Tidak ada item tagihan.
                  </div>
                )}
                {categoryTotals.map((cat) => (
                  <div key={cat.key} className="mb-2.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">{cat.label}</span>
                      <span className="text-xs font-mono font-medium">
                        {formatRupiah(cat.total)}
                      </span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded overflow-hidden">
                      <div
                        style={{
                          width: `${cat.pct}%`,
                          height: '100%',
                          background: cat.color,
                          borderRadius: 2
                        }}
                      />
                    </div>
                  </div>
                ))}
                {grandTotal > 0 && (
                  <div className="flex justify-between pt-2.5 border-t border-gray-200 mt-1">
                    <span className="font-bold text-sm">Total</span>
                    <span className="font-bold font-mono text-sm">{formatRupiah(grandTotal)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment status summary (shown when payments exist) */}
            {persistedInvoice && totalPaid > 0 && (
              <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Sudah Dibayar</span>
                  <span className="text-xs font-mono font-semibold text-green-600">
                    {formatRupiah(totalPaid)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-dashed border-gray-200">
                  <span className="text-sm font-semibold">
                    {persistedInvoice.remaining === 0 ? 'Lunas' : 'Sisa'}
                  </span>
                  <span
                    className={`text-sm font-black font-mono ${
                      persistedInvoice.remaining === 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {persistedInvoice.remaining === 0
                      ? '✓ Lunas'
                      : formatRupiah(persistedInvoice.remaining)}
                  </span>
                </div>
              </div>
            )}

            {/* Print & payment action buttons */}
            <div className="flex flex-col gap-2">
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'patient',
                      label: 'Atas Nama Pasien',
                      onClick: () =>
                        invoice &&
                        printInvoice(invoice, persistedInvoice, {
                          printForKind: 'patient',
                          cashierName,
                          cashierSignatureUrl
                        })
                    },
                    {
                      key: 'guarantor',
                      label: 'Atas Nama Penjamin',
                      onClick: () =>
                        invoice &&
                        printInvoice(invoice, persistedInvoice, {
                          printForKind: 'guarantor',
                          cashierName,
                          cashierSignatureUrl
                        })
                    }
                  ]
                }}
                disabled={!invoice}
              >
                <Button icon={<PrinterOutlined />} block>
                  Cetak Invoice
                </Button>
              </Dropdown>

              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'patient',
                      label: 'Atas Nama Pasien',
                      onClick: () => {
                        if (invoice && persistedInvoice) {
                          printReceipt(
                            invoice,
                            persistedInvoice,
                            { amount: totalPaid, kode: persistedInvoice.kode, date: new Date() },
                            { printForKind: 'patient', cashierName, cashierSignatureUrl }
                          )
                        }
                      }
                    },
                    {
                      key: 'guarantor',
                      label: 'Atas Nama Penjamin',
                      onClick: () => {
                        if (invoice && persistedInvoice) {
                          printReceipt(
                            invoice,
                            persistedInvoice,
                            { amount: totalPaid, kode: persistedInvoice.kode, date: new Date() },
                            { printForKind: 'guarantor', cashierName, cashierSignatureUrl }
                          )
                        }
                      }
                    }
                  ]
                }}
                disabled={!invoice || !persistedInvoice || totalPaid <= 0}
              >
                <Button icon={<PrinterOutlined />} block>
                  Cetak Kwitansi
                </Button>
              </Dropdown>

              {!isPaid && (
                <Button type="primary" icon={<PlusOutlined />} onClick={goToPaymentPage} block>
                  {isConfirmed ? 'Tambah Pembayaran' : 'Input Deposit'}
                </Button>
              )}
            </div>

            {/* Signature controls */}
            <div className="bg-white border border-gray-200 rounded shadow-sm">
              <div className="px-4 py-2.5 border-b border-gray-200">
                <span className="font-semibold text-sm text-gray-700">TTD Kasir</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <Select
                  value={signatureSource}
                  options={SIGNATURE_SOURCE_OPTIONS}
                  onChange={(value) => setSignatureSource(value)}
                  className="w-full"
                  size="small"
                />
                {signatureSource === 'manual' ? (
                  <div className="flex flex-col gap-1.5">
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => setSignatureModalVisible(true)}
                      size="small"
                      block
                    >
                      Input Tanda Tangan
                    </Button>
                    {manualCashierSignature && (
                      <>
                        <img
                          src={manualCashierSignature}
                          alt="TTD"
                          className="h-10 object-contain border border-gray-200 rounded bg-gray-50"
                        />
                        <Button size="small" block onClick={() => setManualCashierSignature('')}>
                          Hapus TTD Manual
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <Tag
                    color={hasKepegawaianSignature ? 'green' : 'default'}
                    className="m-0 text-center"
                  >
                    {hasKepegawaianSignature
                      ? 'Diambil dari Kepegawaian'
                      : 'Profil Pegawai Tidak Punya TTD'}
                  </Tag>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <SignaturePadModal
        title="Tanda Tangan Petugas Kasir"
        visible={signatureModalVisible}
        onClose={() => setSignatureModalVisible(false)}
        onSave={(dataUrl: string) => setManualCashierSignature(dataUrl)}
      />
    </div>
  )
}
