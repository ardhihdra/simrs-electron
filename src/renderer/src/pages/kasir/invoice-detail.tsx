import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  LockOutlined,
  PlusOutlined,
  PrinterOutlined,
  RollbackOutlined
} from '@ant-design/icons'
import { rpc, client } from '@renderer/utils/client'
import { Button, Divider, Popconfirm, Spin, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PaymentHistory } from './payment-history'
import { PaymentModal } from './payment-modal'
import { printInvoice, printReceipt } from '@renderer/utils/print-service'
import type { Invoice, PersistedInvoice, InvoiceLineItem } from '@renderer/utils/print-service'
import { Dropdown } from 'antd'
import { useMyProfile } from '@renderer/hooks/useProfile'
import logoUrl from '@renderer/assets/logo.png'

const { Title, Text } = Typography

const lineItemColumns: ColumnsType<InvoiceLineItem> = [
  { title: 'No.', dataIndex: 'no', key: 'no', width: 50 },
  { title: 'Deskripsi', dataIndex: 'description', key: 'description' },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 70, align: 'right' },
  {
    title: 'Harga Satuan',
    dataIndex: 'unitPrice',
    key: 'unitPrice',
    width: 140,
    align: 'right',
    render: (v: number) => formatRupiah(v)
  },
  {
    title: 'Subtotal',
    dataIndex: 'subtotal',
    key: 'subtotal',
    width: 140,
    align: 'right',
    render: (v: number) => formatRupiah(v)
  }
]

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

function numbered(items: InvoiceLineItem[]): InvoiceLineItem[] {
  return items.map((item, idx) => ({ ...item, no: idx + 1 }))
}

function escapeHtml(value: string | number | boolean | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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
  dp: { label: 'DP', color: 'blue' },
  sebagian: { label: 'Sebagian', color: 'violet' }
}

function InvoiceSection({
  title,
  tagColor,
  items
}: {
  title: string
  tagColor: string
  items: InvoiceLineItem[]
}) {
  if (items.length === 0) return null
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Title level={5} className="!mb-0">
          {title}
        </Title>
        <Tag color={tagColor}>{items.length} item</Tag>
      </div>
      <Table
        size="small"
        bordered
        pagination={false}
        columns={lineItemColumns}
        dataSource={numbered(items)}
        rowKey="no"
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={4} align="right">
              <Text strong>Subtotal</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right">
              <Text strong>{formatRupiah(items.reduce((s, i) => s + i.subtotal, 0))}</Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </div>
  )
}

function buildCategoryRows(title: string, items: InvoiceLineItem[], accentColor: string): string {
  if (items.length === 0) return ''
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
  const rows = items
    .map(
      (item, idx) => `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${escapeHtml(item.description)}</td>
        <td class="center">${escapeHtml(item.qty)}</td>
        <td class="right">${escapeHtml(formatRupiah(item.unitPrice))}</td>
        <td class="right">${escapeHtml(formatRupiah(item.subtotal))}</td>
      </tr>`
    )
    .join('')

  return `
    <tr class="cat-header" style="background:${accentColor};">
      <td colspan="5">${escapeHtml(title)}</td>
    </tr>
    ${rows}
    <tr class="subtotal-row">
      <td colspan="4" class="right"><em>Subtotal ${escapeHtml(title)}</em></td>
      <td class="right"><strong>${escapeHtml(formatRupiah(subtotal))}</strong></td>
    </tr>`
}

// function generateInvoicePrintView(
//   invoice: Invoice,
//   persistedInvoice: PersistedInvoice | null
// ): void {
//   const namaPatient = invoice.namaPatient ?? invoice.patient?.name ?? '-'
//   const medicalRecordNumber =
//     invoice.medicalRecordNumber ?? invoice.patient?.medicalRecordNumber ?? '-'
//   const tanggalLahir = formatPrintableDate(invoice.tanggalLahir ?? invoice.patient?.birthDate)
//   const alamat = invoice.alamat ?? invoice.patient?.address ?? '-'
//   const dokterPemeriksa = invoice.dokterPemeriksa ?? '-'
//   const ruangan = invoice.ruangan ?? '-'
//   const penjamin = invoice.penjamin ?? 'Umum'
//   const tanggalPendaftaran = formatPrintableDate(invoice.tanggalPendaftaran)
//   const noPendaftaran = invoice.noPendaftaran ?? '-'
//   const caraBayar = invoice.penjamin ?? 'Umum'
//   const metodeBayar = invoice.paymentMethod === 'cash' ? 'Tunai' : (invoice.paymentMethod ?? '-')
//   const noInvoice = persistedInvoice?.kode ?? '-'
//   const printedAt = formatPrintableDate(new Date())

//   const tindakanRows = buildCategoryRows('Tindakan Medis', invoice.tindakanItems ?? [], '#1e40af')
//   const bhpRows = buildCategoryRows('Bahan Habis Pakai (BHP)', invoice.bhpItems ?? [], '#92400e')
//   const labRows = buildCategoryRows('Laboratorium', invoice.laboratoryItems ?? [], '#14532d')
//   const radRows = buildCategoryRows('Radiologi', invoice.radiologyItems ?? [], '#0e7490')
//   const obatRows = buildCategoryRows('Obat', invoice.obatItems ?? [], '#581c87')
//   const adminRows = buildCategoryRows('Administrasi', invoice.administrasiItems ?? [], '#475569')

//   const allEmpty =
//     (invoice.tindakanItems?.length ?? 0) === 0 &&
//     (invoice.bhpItems?.length ?? 0) === 0 &&
//     (invoice.laboratoryItems?.length ?? 0) === 0 &&
//     (invoice.radiologyItems?.length ?? 0) === 0 &&
//     (invoice.obatItems?.length ?? 0) === 0 &&
//     (invoice.administrasiItems?.length ?? 0) === 0

//   const tableBody = allEmpty
//     ? '<tr><td colspan="5" class="center" style="padding:16px;color:#6b7280;">Tidak ada item tagihan untuk kunjungan ini.</td></tr>'
//     : tindakanRows + bhpRows + labRows + radRows + obatRows + adminRows

//   const paymentRows =
//     persistedInvoice && persistedInvoice.payments?.length > 0
//       ? persistedInvoice.payments
//           .map(
//             (p, i: number) => `
//           <tr>
//             <td class="center">${i + 1}</td>
//             <td>${escapeHtml(formatPrintableDate(p.paidAt ?? p.createdAt))}</td>
//             <td>${escapeHtml(p.method ?? '-')}</td>
//             <td class="right">${escapeHtml(formatRupiah(p.amount ?? 0))}</td>
//           </tr>`
//           )
//           .join('')
//       : ''

//   const paymentSection =
//     persistedInvoice && paymentRows
//       ? `
//       <div class="section-banner" style="background:#374151;margin-top:10px;">Riwayat Pembayaran</div>
//       <table class="invoice-table">
//         <thead>
//           <tr>
//             <th style="width:40px;">No.</th>
//             <th>Tanggal</th>
//             <th>Metode</th>
//             <th style="width:140px;">Jumlah</th>
//           </tr>
//         </thead>
//         <tbody>${paymentRows}</tbody>
//       </table>`
//       : ''

//   const iframe = document.createElement('iframe')
//   iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:0;height:0;border:none;'
//   document.body.appendChild(iframe)

//   const doc = iframe.contentWindow?.document
//   if (!doc || !iframe.contentWindow) return

//   doc.open()
//   doc.write(`
//     <html>
//     <head>
//       <title>Invoice ${escapeHtml(noInvoice)}</title>
//       <style>
//         @page { size: A4 portrait; margin: 12mm; }
//         body { font-family: Arial, sans-serif; color: #111827; font-size: 12px; margin: 0; background: #fff; }
//         .sheet { border: 1px solid #9ca3af; padding: 10px 12px; }
//         .head-top {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           border-bottom: 2px solid #374151;
//           padding-bottom: 8px;
//           margin-bottom: 8px;
//         }
//         .brand { display: flex; align-items: center; gap: 10px; }
//         .logo { width: 50px; height: auto; object-fit: contain; }
//         .brand-text { line-height: 1.3; }
//         .brand-title { font-size: 15px; font-weight: 700; text-transform: uppercase; }
//         .brand-sub { font-size: 11px; color: #374151; }
//         .invoice-badge { text-align: right; }
//         .invoice-badge .title { font-size: 22px; font-weight: 900; letter-spacing: 3px; color: #1e3a8a; text-transform: uppercase; }
//         .invoice-badge .no { font-size: 11px; color: #6b7280; }
//         .meta-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 8px; }
//         .meta-grid { width: 100%; border-collapse: collapse; }
//         .meta-grid td { padding: 1px 3px; vertical-align: top; font-size: 12px; }
//         .meta-label { width: 120px; font-weight: 700; }
//         .section-banner {
//           background: #1e3a8a;
//           color: #fff;
//           text-align: center;
//           font-size: 13px;
//           font-weight: 700;
//           padding: 5px;
//           margin: 8px 0 0;
//           text-transform: uppercase;
//           letter-spacing: 1px;
//         }
//         table.invoice-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
//         .invoice-table th, .invoice-table td { border: 1px solid #d1d5db; padding: 4px 6px; font-size: 12px; }
//         .invoice-table th { background: #374151; color: #fff; text-transform: uppercase; font-weight: 700; font-size: 11px; }
//         .cat-header td { color: #fff; font-weight: 700; font-size: 11px; text-transform: uppercase; padding: 3px 6px; }
//         .subtotal-row td { background: #f3f4f6; font-size: 11px; border-top: 1px solid #9ca3af; }
//         .center { text-align: center; }
//         .right { text-align: right; }
//         .grand-total { margin-top: 10px; display: flex; justify-content: flex-end; }
//         .grand-total-box { border: 2px solid #1e3a8a; padding: 8px 16px; text-align: right; min-width: 220px; }
//         .grand-total-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #374151; }
//         .grand-total-value { font-size: 18px; font-weight: 900; color: #1e3a8a; }
//         .signatures { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
//         .sign-item { text-align: center; }
//         .sign-title { font-size: 12px; }
//         .sign-space { height: 52px; }
//         .sign-name { border-top: 1px solid #374151; padding-top: 2px; font-weight: 700; }
//         .footnote { margin-top: 14px; border-top: 1px solid #6b7280; padding-top: 6px; font-size: 10px; color: #4b5563; }
//         .printed { margin-top: 4px; font-size: 10px; color: #6b7280; }
//         @media print {
//           body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
//         }
//       </style>
//     </head>
//     <body>
//       <div class="sheet">
//         <div class="head-top">
//           <div class="brand">
//             <img class="logo" src="${logoUrl}" alt="Logo" />
//             <div class="brand-text">
//               <div class="brand-title">SIMRS Rahayu Medical Center</div>
//               <div class="brand-sub">Jl. Otista, Tarogong Garut</div>
//               <div class="brand-sub">Telp. (0262) 2542608</div>
//             </div>
//           </div>
//           <div class="invoice-badge">
//             <div class="title">Invoice</div>
//             <div class="no">No. ${escapeHtml(noInvoice)}</div>
//           </div>
//         </div>

//         <div class="meta-wrap">
//           <table class="meta-grid">
//             <tr><td class="meta-label">Nama Pasien</td><td>: ${escapeHtml(namaPatient)}</td></tr>
//             <tr><td class="meta-label">No. RM</td><td>: ${escapeHtml(medicalRecordNumber)}</td></tr>
//             <tr><td class="meta-label">Tgl. Lahir</td><td>: ${escapeHtml(tanggalLahir)}</td></tr>
//             <tr><td class="meta-label">Alamat</td><td>: ${escapeHtml(alamat)}</td></tr>
//             <tr><td class="meta-label">Penjamin</td><td>: ${escapeHtml(penjamin)}</td></tr>
//           </table>
//           <table class="meta-grid">
//             <tr><td class="meta-label">No. Kunjungan</td><td>: ${escapeHtml(invoice.encounterId)}</td></tr>
//             <tr><td class="meta-label">No. Pendaftaran</td><td>: ${escapeHtml(noPendaftaran)}</td></tr>
//             <tr><td class="meta-label">Tgl. Pendaftaran</td><td>: ${escapeHtml(tanggalPendaftaran)}</td></tr>
//             <tr><td class="meta-label">Dokter</td><td>: ${escapeHtml(dokterPemeriksa)}</td></tr>
//             <tr><td class="meta-label">Ruangan</td><td>: ${escapeHtml(ruangan)}</td></tr>
//             <tr><td class="meta-label">Cara Bayar</td><td>: ${escapeHtml(caraBayar)}</td></tr>
//             <tr><td class="meta-label">Metode Bayar</td><td>: ${escapeHtml(metodeBayar)}</td></tr>
//           </table>
//         </div>

//         <div class="section-banner">Rincian Tagihan Layanan Kesehatan</div>
//         <table class="invoice-table">
//           <thead>
//             <tr>
//               <th style="width:40px;">No.</th>
//               <th>Deskripsi</th>
//               <th style="width:50px;">Qty</th>
//               <th style="width:130px;">Harga Satuan</th>
//               <th style="width:130px;">Subtotal</th>
//             </tr>
//           </thead>
//           <tbody>${tableBody}</tbody>
//         </table>

//         <div class="grand-total">
//           <div class="grand-total-box">
//             <div class="grand-total-label">Total Tagihan</div>
//             <div class="grand-total-value">${escapeHtml(formatRupiah(invoice.total ?? 0))}</div>
//           </div>
//         </div>

//         ${paymentSection}

//         <div class="signatures">
//           <div class="sign-item">
//             <div class="sign-title">Petugas Kasir</div>
//             <div class="sign-space"></div>
//             <div class="sign-name">(__________________)</div>
//           </div>
//           <div class="sign-item">
//             <div class="sign-title">Pasien / Keluarga</div>
//             <div class="sign-space"></div>
//             <div class="sign-name">(__________________)</div>
//           </div>
//         </div>

//         <div class="footnote">
//           Invoice ini dicetak otomatis dari sistem informasi manajemen rumah sakit dan sah tanpa tanda tangan basah.
//         </div>
//         <div class="printed">Dicetak: ${escapeHtml(printedAt)}</div>
//       </div>
//     </body>
//     </html>
//   `)
//   doc.close()

//   iframe.contentWindow.focus()
//   iframe.contentWindow.print()
//   iframe.addEventListener('afterprint', () => document.body.removeChild(iframe))
// }

export default function InvoiceDetailPage() {
  const { encounterId } = useParams<{ encounterId: string }>()
  const [searchParams] = useSearchParams()
  const patientId = searchParams.get('patientId') ?? ''
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const { Title, Text } = Typography

  // Dynamic invoice (always fresh from encounter data)
  const { data, isLoading, isError, error } = client.kasir.getInvoice.useQuery({
    encounterId: encounterId!,
    patientId
  })
  console.log('invoice data', data)

  // Persisted invoice (null if not yet confirmed)
  const {
    data: detailData,
    isLoading: isLoadingDetail,
    refetch: refetchDetail
  } = useQuery({
    queryKey: ['kasir-invoice-detail', encounterId],
    queryFn: () => rpc.kasir.getInvoiceDetail({ encounterId: encounterId! }),
    enabled: !!encounterId
  })
  console.log('detailData', detailData)

  const invoice = (data as { result: Invoice } | undefined)?.result
  const persistedInvoice = (detailData as { result: PersistedInvoice } | undefined)?.result ?? null

  const { profile } = useMyProfile()
  const { data: requesterData } = useQuery({
    queryKey: ['kepegawaian', 'list'],
    queryFn: () => (window.api?.query as any).kepegawaian?.list()
  })

  // Resolve cashier name
  const cashierName = (() => {
    if (!profile || !requesterData?.result) return profile?.username || ''
    const employees = requesterData.result as any[]
    const sessionId = Number(profile.id)
    const sessionUsername = String(profile.username || '').trim()
    const foundEmployee = employees.find(
      (e) =>
        e.id === sessionId ||
        (typeof e.nik === 'string' && e.nik.trim() === sessionUsername) ||
        (typeof e.namaLengkap === 'string' && e.namaLengkap.trim() === sessionUsername)
    )
    return foundEmployee?.namaLengkap || profile.username || ''
  })()

  const reopenEncounterMutation = client.encounter.reopen.useMutation()

  const handleReopenEncounter = async () => {
    if (!encounterId) return
    try {
      await reopenEncounterMutation.mutateAsync(encounterId)
      message.success('Kunjungan berhasil dikembalikan ke perawat.')
      navigate('/kasir/encounter-table')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Gagal mengembalikan kunjungan.'
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

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false)
    refetchDetail()
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
      return total === 0 ? 'dp' : 'sebagian'
    }
    return s
  })()

  const statusInfo = persistedInvoice
    ? (STATUS_LABEL[currentStatus as keyof typeof STATUS_LABEL] ?? STATUS_LABEL.issued)
    : null
  const isConfirmed = !!persistedInvoice && persistedInvoice.status !== 'draft'
  const isPaid = persistedInvoice?.status === 'balanced'
  const totalPaid = persistedInvoice ? persistedInvoice.total - persistedInvoice.remaining : 0

  return (
    <div className="p-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Kembali
        </Button>
        <Dropdown
          menu={{
            items: [
              {
                key: 'patient',
                label: 'Atas Nama Pasien',
                onClick: () =>
                  invoice &&
                  printInvoice(invoice, persistedInvoice, { printForKind: 'patient', cashierName })
              },
              {
                key: 'guarantor',
                label: 'Atas Nama Penjamin',
                onClick: () =>
                  invoice &&
                  printInvoice(invoice, persistedInvoice, {
                    printForKind: 'guarantor',
                    cashierName
                  })
              }
            ]
          }}
          disabled={!invoice}
        >
          <Button type="primary" icon={<PrinterOutlined />}>
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
                    const totalPaid = persistedInvoice.total - persistedInvoice.remaining
                    printReceipt(
                      invoice,
                      persistedInvoice,
                      {
                        amount: totalPaid,
                        kode: persistedInvoice.kode,
                        date: new Date()
                      },
                      { printForKind: 'patient', cashierName }
                    )
                  }
                }
              },
              {
                key: 'guarantor',
                label: 'Atas Nama Penjamin',
                onClick: () => {
                  if (invoice && persistedInvoice) {
                    const totalPaid = persistedInvoice.total - persistedInvoice.remaining
                    printReceipt(
                      invoice,
                      persistedInvoice,
                      {
                        amount: totalPaid,
                        kode: persistedInvoice.kode,
                        date: new Date()
                      },
                      { printForKind: 'guarantor', cashierName }
                    )
                  }
                }
              }
            ]
          }}
          disabled={
            !invoice ||
            !persistedInvoice ||
            persistedInvoice.total - persistedInvoice.remaining <= 0
          }
        >
          <Button icon={<PrinterOutlined />}>Cetak Kwitansi</Button>
        </Dropdown>

        {!isPaid && (
          <Popconfirm
            title="Kembalikan ke Perawat?"
            description="Status kunjungan akan berubah kembali menjadi Pemeriksaan agar bisa diperbaiki oleh Nurse/Dokter."
            onConfirm={handleReopenEncounter}
            okText="Ya, Kembalikan"
            cancelText="Batal"
            okButtonProps={{ danger: true, loading: reopenEncounterMutation.isPending }}
          >
            <Button icon={<RollbackOutlined />} danger loading={reopenEncounterMutation.isPending}>
              Kembalikan ke Perawat
            </Button>
          </Popconfirm>
        )}

        {!isConfirmed && !isLoadingDetail && (
          <Button
            type="primary"
            icon={<LockOutlined />}
            loading={confirming}
            onClick={handleConfirm}
            disabled={!invoice}
          >
            Konfirmasi Invoice
          </Button>
        )}

        {!isPaid && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setPaymentModalOpen(true)}>
            {isConfirmed ? 'Tambah Pembayaran' : 'Input DP (Uang Muka)'}
          </Button>
        )}

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
          <span className="text-gray-500 text-sm">No. {persistedInvoice.kode}</span>
        )}
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

      {invoice && (
        <div className="bg-white p-6 max-w-3xl mx-auto border border-gray-200 rounded">
          {/* Header */}
          <div className="flex justify-between items-start pb-4 mb-4 border-b-2 border-gray-700">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Logo" className="w-12 h-auto object-contain" />
              <div>
                <div className="font-bold text-base uppercase">SIMRS Rahayu Medical Center</div>
                <div className="text-xs text-gray-500">Jl. Otista, Tarogong Garut</div>
                <div className="text-xs text-gray-500">Telp. (0262) 2542608</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black tracking-widest text-blue-900 uppercase">
                Invoice
              </div>
              {persistedInvoice && (
                <div className="text-xs text-gray-500">No. {persistedInvoice.kode}</div>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Nama Pasien', invoice.namaPatient ?? invoice.patient?.name ?? '-'],
                  [
                    'No. RM',
                    invoice.medicalRecordNumber ?? invoice.patient?.medicalRecordNumber ?? '-'
                  ],
                  [
                    'Tgl. Lahir',
                    formatPrintableDate(invoice.tanggalLahir ?? invoice.patient?.birthDate)
                  ],
                  ['Alamat', invoice.alamat ?? invoice.patient?.address ?? '-']
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="font-semibold text-gray-500 w-32 py-0.5 pr-2">{label}</td>
                    <td className="py-0.5">: {value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['No. Kunjungan', invoice.encounterCode ?? invoice.encounterId ?? '-'],
                  ['No. Pendaftaran', invoice.noPendaftaran ?? '-'],
                  ['Tgl. Pendaftaran', formatPrintableDate(invoice.tanggalPendaftaran)],
                  ['Dokter', invoice.dokterPemeriksa ?? '-'],
                  ['Ruangan', invoice.ruangan ?? '-'],
                  ['Cara Bayar', invoice.penjamin ?? 'Umum'],
                  [
                    'Metode Bayar',
                    invoice.paymentMethod === 'cash' ? 'Tunai' : (invoice.paymentMethod ?? '-')
                  ]
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="font-semibold text-gray-500 w-36 py-0.5 pr-2">{label}</td>
                    <td className="py-0.5">: {value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section banner */}
          <div className="bg-blue-900 text-white text-center font-bold text-sm py-1.5 uppercase tracking-wider mb-3">
            Rincian Tagihan Layanan Kesehatan
          </div>

          {/* Line item sections */}
          <InvoiceSection
            title="Tindakan Medis"
            tagColor="blue"
            items={invoice.tindakanItems ?? []}
          />
          <InvoiceSection
            title="Bahan Habis Pakai (BHP)"
            tagColor="orange"
            items={invoice.bhpItems ?? []}
          />
          <InvoiceSection
            title="Laboratorium"
            tagColor="green"
            items={invoice.laboratoryItems ?? []}
          />
          <InvoiceSection title="Radiologi" tagColor="cyan" items={invoice.radiologyItems ?? []} />
          <InvoiceSection title="Obat" tagColor="purple" items={invoice.obatItems ?? []} />
          <InvoiceSection
            title="Administrasi"
            tagColor="gray"
            items={invoice.administrasiItems ?? []}
          />

          {(invoice.tindakanItems?.length ?? 0) === 0 &&
            (invoice.bhpItems?.length ?? 0) === 0 &&
            (invoice.laboratoryItems?.length ?? 0) === 0 &&
            (invoice.radiologyItems?.length ?? 0) === 0 &&
            (invoice.obatItems?.length ?? 0) === 0 &&
            (invoice.administrasiItems?.length ?? 0) === 0 && (
              <div className="text-center py-8 text-gray-400">
                Tidak ada item tagihan untuk kunjungan ini.
              </div>
            )}

          <Divider />

          {/* Grand Total */}
          <div className="flex justify-end">
            <div className="border-2 border-blue-900 px-6 py-3 text-right">
              <div className="text-xs font-bold uppercase text-gray-600 mb-1">Total Tagihan</div>
              <div className="text-2xl font-black text-blue-900">{formatRupiah(invoice.total)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Payment section (only shown when invoice is confirmed) */}
      {isConfirmed && persistedInvoice && (
        <div className="max-w-3xl mx-auto mt-2">
          <PaymentHistory
            payments={persistedInvoice.payments}
            totalPaid={totalPaid}
            remaining={persistedInvoice.remaining}
            invoice={invoice}
            persistedInvoice={persistedInvoice}
            cashierName={cashierName}
          />
        </div>
      )}

      <PaymentModal
        open={paymentModalOpen}
        invoiceId={persistedInvoice?.id}
        encounterId={encounterId}
        patientId={patientId}
        remaining={persistedInvoice?.remaining ?? invoice?.total ?? 0}
        onCancel={() => setPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
