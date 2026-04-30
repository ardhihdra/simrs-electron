import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  PrinterOutlined,
  SaveOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { rpc, client } from '@renderer/utils/client'
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Segmented,
  Spin,
  Tag,
  Upload,
  message
} from 'antd'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { printReceipt } from '@renderer/utils/print-service'
import type { Invoice, PersistedInvoice } from '@renderer/utils/print-service'
import { useMyProfile } from '@renderer/hooks/useProfile'

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

interface MasterBank {
  id: number
  name: string
  accountNumber: string
  accountHolder: string
}

const CATEGORIES_DISPLAY = [
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

const PAYMENT_CATEGORY_OPTIONS = [
  { label: 'Pelunasan', value: 'SETTLEMENT' },
  { label: 'Deposit Awal', value: 'INITIAL_DEPOSIT' },
  { label: 'Deposit Lanjutan', value: 'SUBSEQUENT_DEPOSIT' }
]

const PAYMENT_METHOD_OPTIONS = [
  { label: 'Tunai', value: 'CASH' },
  { label: 'Transfer Bank', value: 'BANK_TRANSFER' },
  { label: 'EDC / Lainnya', value: 'OTHER' }
]

const RECEIPT_TYPE_OPTIONS = [
  { key: 'patient', label: 'Kwitansi Pasien', sub: 'Untuk arsip pasien / keluarga' },
  { key: 'guarantor', label: 'Kwitansi Penjamin', sub: 'Untuk asuransi / perusahaan / BPJS' }
]

function SectionLabel({ letter, title }: { letter: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-5 h-5 rounded-full bg-gray-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {letter}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</span>
    </div>
  )
}

export default function PaymentPage() {
  const { encounterId } = useParams<{ encounterId: string }>()
  const [searchParams] = useSearchParams()
  const patientId = searchParams.get('patientId') ?? ''
  const navigate = useNavigate()

  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [printType, setPrintType] = useState<'patient' | 'guarantor'>('patient')

  // Watched form fields for reactive UI
  const paymentMethod = Form.useWatch('paymentMethod', form)
  const category = Form.useWatch('category', form)
  const amount = Form.useWatch('amount', form) || 0
  const isDeposit = category === 'INITIAL_DEPOSIT' || category === 'SUBSEQUENT_DEPOSIT'

  // Fetch invoice data
  const { data: invoiceData, isLoading: isLoadingInvoice } = client.kasir.getInvoice.useQuery({
    encounterId: encounterId!,
    patientId
  })

  const {
    data: detailData,
    isLoading: isLoadingDetail,
    refetch: refetchDetail
  } = useQuery({
    queryKey: ['kasir-invoice-detail', encounterId],
    queryFn: () => rpc.kasir.getInvoiceDetail({ encounterId: encounterId! }),
    enabled: !!encounterId
  })

  const { data: banksData } = useQuery({
    queryKey: ['kasir-banks'],
    queryFn: () => rpc.kasir.listBanks()
  })

  const invoice = (invoiceData as { result: Invoice } | undefined)?.result
  const persistedInvoice = (detailData as { result: PersistedInvoice } | undefined)?.result ?? null
  const banks = (banksData as { result: MasterBank[] } | undefined)?.result ?? []

  const remaining = persistedInvoice?.remaining ?? invoice?.total ?? 0
  const grandTotal = invoice?.total ?? 0
  const totalPaid = persistedInvoice ? persistedInvoice.total - persistedInvoice.remaining : 0

  const change = paymentMethod === 'CASH' && !isDeposit ? Math.max(0, amount - remaining) : 0

  // Kasir profile for print
  type KepegawaianEmployee = { id: number; nik?: string; namaLengkap?: string }
  const { profile } = useMyProfile()
  const { data: requesterData } = useQuery({
    queryKey: ['kepegawaian', 'list'],
    queryFn: () =>
      (window.api?.query as unknown as Record<string, { list: () => Promise<{ result: KepegawaianEmployee[] }> }>).kepegawaian?.list()
  })

  const cashierName = useMemo(() => {
    if (!profile) return ''
    if (!requesterData?.result) return profile.username || ''
    const employees = requesterData.result as KepegawaianEmployee[]
    const found = employees.find(
      (e) =>
        e.id === Number(profile.id) ||
        (typeof e.nik === 'string' && e.nik.trim() === String(profile.username || '').trim())
    )
    return found?.namaLengkap || profile.username || ''
  }, [profile, requesterData?.result])

  // Category summary for sidebar
  const categoryTotals = CATEGORIES_DISPLAY.map((cat) => {
    const items = invoice ? cat.getItems(invoice) : []
    const total = items.reduce((s, i) => s + i.subtotal, 0)
    const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0
    return { ...cat, total, pct }
  }).filter((c) => c.total > 0)

  const uploadProps: UploadProps = {
    beforeUpload: () => false,
    fileList,
    maxCount: 1,
    accept: '.jpg,.jpeg,.png,.pdf',
    onChange: ({ fileList: newList }) => setFileList(newList.slice(-1))
  }

  const doSubmit = async (andPrint: boolean) => {
    if (!encounterId || !patientId) {
      message.error('Data transaksi tidak lengkap')
      return
    }
    try {
      setLoading(true)
      const values = await form.validateFields()

      let file: ArrayBuffer | undefined
      let filename: string | undefined
      let mimetype: string | undefined

      if (fileList.length > 0 && fileList[0].originFileObj) {
        file = await fileList[0].originFileObj.arrayBuffer()
        filename = fileList[0].name
        mimetype = fileList[0].type ?? 'application/octet-stream'
      }

      const invoiceId = persistedInvoice?.id
      const res = (await rpc.kasir.recordPayment({
        invoiceId,
        encounterId,
        patientId,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        bankId: values.bankId,
        ref: values.ref ?? undefined,
        note: values.note ?? undefined,
        category: values.category,
        file,
        filename,
        mimetype
      })) as { success: boolean; message?: string }

      if (res.success) {
        message.success('Pembayaran berhasil dicatat')

        if (andPrint && invoice) {
          // Refetch to get updated persisted invoice, then print
          const fresh = await refetchDetail()
          const freshPersisted =
            (fresh.data as { result: PersistedInvoice } | undefined)?.result ?? persistedInvoice
          if (freshPersisted) {
            printReceipt(
              invoice,
              freshPersisted,
              { amount: values.amount, kode: freshPersisted.kode, date: new Date() },
              { printForKind: printType, cashierName }
            )
          }
        }

        navigate(`/dashboard/kasir/invoice/${encounterId}?patientId=${patientId}`, {
          replace: true
        })
      } else {
        message.error(res.message ?? 'Gagal mencatat pembayaran')
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (!encounterId || !patientId) {
    return <div className="p-4 text-red-500">Parameter tidak lengkap.</div>
  }

  const isPageLoading = isLoadingInvoice || isLoadingDetail

  return (
    <div className="p-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} size="small">
          Kembali
        </Button>
        <span className="font-semibold text-base text-gray-800">Input Pembayaran</span>
        {persistedInvoice?.kode && <Tag className="font-mono m-0">{persistedInvoice.kode}</Tag>}
      </div>

      {isPageLoading && (
        <div className="flex justify-center py-16">
          <Spin size="large" />
        </div>
      )}

      {!isPageLoading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: 16,
            alignItems: 'start'
          }}
        >
          {/* ── Left: payment form ──────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
            {/* Patient summary — card header */}
            <div className="flex justify-between items-center px-5 py-4 bg-gray-50 border-b border-gray-200">
              <div>
                <div className="font-semibold text-sm text-gray-800">
                  {invoice?.namaPatient ?? invoice?.patient?.name ?? '—'}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {invoice?.ruangan ?? '—'} · {invoice?.penjamin ?? 'Umum'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-0.5">
                  {isDeposit ? 'Deposit Sebelumnya' : 'Sisa Tagihan'}
                </div>
                <div
                  className={`text-lg font-black font-mono ${isDeposit ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {formatRupiah(remaining)}
                </div>
              </div>
            </div>

            {/* Form — no className so it doesn't add stray padding */}
            <Form
              form={form}
              layout="vertical"
              initialValues={{ paymentMethod: 'CASH', category: 'SETTLEMENT' }}
            >
              {/* Scrollable body */}
              <div className="px-5 pt-5 pb-2">

                {/* A. Kategori */}
                <SectionLabel letter="A" title="Kategori Pembayaran" />
                <Form.Item name="category" noStyle>
                  <Segmented options={PAYMENT_CATEGORY_OPTIONS} block />
                </Form.Item>

                <div className="border-t border-dashed border-gray-200 my-5" />

                {/* B. Metode */}
                <SectionLabel letter="B" title="Metode Pembayaran" />
                <Form.Item name="paymentMethod" noStyle>
                  <Segmented options={PAYMENT_METHOD_OPTIONS} block />
                </Form.Item>

                {paymentMethod === 'BANK_TRANSFER' && (
                  <Form.Item
                    name="bankId"
                    label="Bank Tujuan"
                    rules={[{ required: true, message: 'Pilih bank tujuan' }]}
                    className="!mt-4 !mb-0"
                  >
                    <Select
                      placeholder="Pilih bank..."
                      options={banks.map((b) => ({
                        label: `${b.name} – ${b.accountNumber} (${b.accountHolder})`,
                        value: b.id
                      }))}
                    />
                  </Form.Item>
                )}

                <div className="border-t border-dashed border-gray-200 my-5" />

                {/* C. Jumlah */}
                <SectionLabel letter="C" title="Jumlah Pembayaran" />

                <div className="grid grid-cols-2 gap-x-4">
                  <Form.Item
                    name="amount"
                    label="Jumlah Bayar"
                    required
                    rules={[
                      { required: true, message: 'Wajib diisi' },
                      { validator: (_, v) => v > 0 ? Promise.resolve() : Promise.reject('Harus lebih dari 0') }
                    ]}
                  >
                    <InputNumber<number>
                      min={1}
                      placeholder="0"
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                      parser={(v) => Number(v!.replace(/\./g, ''))}
                      addonBefore="Rp"
                      className="font-mono"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  <Form.Item name="ref" label="No. Referensi">
                    <Input placeholder="Opsional" className="font-mono" />
                  </Form.Item>
                </div>

                {paymentMethod === 'CASH' && !isDeposit && amount > remaining && (
                  <Alert
                    className="!-mt-2 !mb-6"
                    message={
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">Kembalian</span>
                        <span className="text-base font-black font-mono text-green-600">
                          {formatRupiah(change)}
                        </span>
                      </div>
                    }
                    type="success"
                  />
                )}

                <div className="grid grid-cols-2 gap-x-4">
                  <Form.Item name="note" label="Catatan" className="!mb-0">
                    <Input.TextArea rows={2} placeholder="Catatan tambahan (opsional)…" />
                  </Form.Item>
                  <Form.Item name="attachmentFile" label="Bukti Bayar" className="!mb-0">
                    <Upload {...uploadProps}>
                      <Button icon={<UploadOutlined />} block>Pilih File</Button>
                    </Upload>
                  </Form.Item>
                </div>

              </div>

              {/* Footer — flush card bottom, outside the scrollable body */}
              <div className="flex justify-end gap-2 px-5 py-3 mt-4 border-t border-gray-200 bg-gray-50 rounded-b">
                <Button onClick={() => navigate(-1)}>Batal</Button>
                <Button icon={<PrinterOutlined />} loading={loading} onClick={() => doSubmit(true)}>
                  Simpan & Cetak Kwitansi
                </Button>
                <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => doSubmit(false)}>
                  Simpan Pembayaran
                </Button>
              </div>
            </Form>
          </div>

          {/* ── Right: invoice summary + receipt selector ───────────────────── */}
          <div className="flex flex-col gap-3">
            {/* Invoice ringkasan */}
            <div className="bg-white border border-gray-200 rounded shadow-sm">
              <div className="px-4 py-2.5 border-b border-gray-200">
                <span className="font-semibold text-sm text-gray-700">Ringkasan Invoice</span>
              </div>
              <div className="p-4">
                {categoryTotals.map((cat) => (
                  <div key={cat.key} className="flex justify-between mb-1.5">
                    <span className="text-xs text-gray-500">{cat.label}</span>
                    <span className="text-xs font-mono">{formatRupiah(cat.total)}</span>
                  </div>
                ))}

                <div className="flex justify-between pt-2.5 border-t border-gray-200 mt-1 mb-2">
                  <span className="font-bold text-sm">Total</span>
                  <span className="font-bold font-mono text-sm">{formatRupiah(grandTotal)}</span>
                </div>

                {totalPaid > 0 && (
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-green-600">Sudah Dibayar</span>
                    <span className="text-xs font-mono font-semibold text-green-600">
                      {formatRupiah(totalPaid)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center mt-2 p-2.5 bg-red-50 border border-red-200 rounded">
                  <span className="font-semibold text-sm text-red-600">Sisa Bayar</span>
                  <span className="font-black font-mono text-base text-red-600">
                    {formatRupiah(remaining)}
                  </span>
                </div>

                {remaining === 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-green-600 text-xs font-semibold">
                    <CheckCircleOutlined />
                    <span>Invoice telah lunas</span>
                  </div>
                )}
              </div>
            </div>

            {/* Kwitansi type selector */}
            <div className="bg-white border border-gray-200 rounded shadow-sm">
              <div className="px-4 py-2.5 border-b border-gray-200">
                <span className="font-semibold text-sm text-gray-700">Jenis Kwitansi</span>
              </div>
              <div className="p-3">
                <div className="text-xs text-gray-400 mb-2">Pilih kwitansi yang akan dicetak:</div>
                {RECEIPT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setPrintType(opt.key as 'patient' | 'guarantor')}
                    className="w-full text-left p-2.5 mb-1.5 rounded border transition-colors"
                    style={{
                      background: printType === opt.key ? '#eff6ff' : '#f9fafb',
                      borderColor: printType === opt.key ? '#3b82f6' : '#e5e7eb',
                      borderWidth: printType === opt.key ? 1.5 : 1,
                      cursor: 'pointer'
                    }}
                  >
                    <div
                      className={`text-xs font-semibold ${printType === opt.key ? 'text-blue-600' : 'text-gray-700'}`}
                    >
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
