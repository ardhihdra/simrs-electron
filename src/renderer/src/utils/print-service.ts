import { terbilang } from './terbilang'
import logoUrl from '@renderer/assets/logo.png'

export interface InvoiceLineItem {
  category: string
  description: string
  qty: number
  unitPrice: number
  subtotal: number
  no?: number
}

export interface Invoice {
  encounterId: string
  encounterCode: string
  patientId: string
  total: number
  namaPatient?: string
  medicalRecordNumber?: string
  tanggalLahir?: string
  alamat?: string
  dokterPemeriksa?: string
  ruangan?: string
  penjamin?: string
  tanggalPendaftaran?: string
  noPendaftaran?: string
  patient?: {
    name?: string
    medicalRecordNumber?: string
    birthDate?: string
    address?: string
  }
  tindakanItems?: InvoiceLineItem[]
  bhpItems?: InvoiceLineItem[]
  laboratoryItems?: InvoiceLineItem[]
  radiologyItems?: InvoiceLineItem[]
  obatItems?: InvoiceLineItem[]
  paymentMethod?: string | null
  administrasiItems?: InvoiceLineItem[]
}

export interface PersistedInvoice {
  id: number
  kode: string
  encounterId: string
  clientId: string
  status: string
  total: number
  remaining: number
  payments: any[]
}

export interface PaymentRecord {
  id: number
  kode: string
  date: string | Date
  amount: number
  paymentMethod: string
  bankName: string | null
  ref: string | null
  note: string | null
  paymentStatus: string
  paidAt?: string | Date
  createdAt?: string | Date
  method?: string
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

function escapeHtml(value: any): string {
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

function buildCategoryRows(title: string, items: InvoiceLineItem[], accentColor: string): string {
  if (!items || items.length === 0) return ''
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

export function printInvoice(
  invoice: Invoice,
  persistedInvoice: PersistedInvoice | null,
  options: { printForKind: 'patient' | 'guarantor'; cashierName?: string }
): void {
  const isPatient = options.printForKind === 'patient'
  const printName = isPatient
    ? (invoice.namaPatient ?? invoice.patient?.name ?? '-')
    : (invoice.penjamin ?? 'Umum')

  const cashierName = options.cashierName || '__________________'

  const medicalRecordNumber =
    invoice.medicalRecordNumber ?? invoice.patient?.medicalRecordNumber ?? '-'
  const tanggalLahir = formatPrintableDate(invoice.tanggalLahir ?? invoice.patient?.birthDate)
  const alamat = invoice.alamat ?? invoice.patient?.address ?? '-'
  const dokterPemeriksa = invoice.dokterPemeriksa ?? '-'
  const ruangan = invoice.ruangan ?? '-'
  const penjamin = invoice.penjamin ?? 'Umum'
  const tanggalPendaftaran = formatPrintableDate(invoice.tanggalPendaftaran)
  const noPendaftaran = invoice.noPendaftaran ?? '-'
  const caraBayar = invoice.penjamin ?? 'Umum'
  const metodeBayar = invoice.paymentMethod === 'cash' ? 'Tunai' : (invoice.paymentMethod ?? '-')
  const noInvoice = persistedInvoice?.kode ?? '-'
  const printedAt = formatPrintableDate(new Date())

  const tindakanRows = buildCategoryRows('Tindakan Medis', invoice.tindakanItems ?? [], '#1e40af')
  const bhpRows = buildCategoryRows('Bahan Habis Pakai (BHP)', invoice.bhpItems ?? [], '#92400e')
  const labRows = buildCategoryRows('Laboratorium', invoice.laboratoryItems ?? [], '#14532d')
  const radRows = buildCategoryRows('Radiologi', invoice.radiologyItems ?? [], '#0e7490')
  const obatRows = buildCategoryRows('Obat', invoice.obatItems ?? [], '#581c87')

  const allEmpty =
    (invoice.tindakanItems?.length ?? 0) === 0 &&
    (invoice.bhpItems?.length ?? 0) === 0 &&
    (invoice.laboratoryItems?.length ?? 0) === 0 &&
    (invoice.radiologyItems?.length ?? 0) === 0 &&
    (invoice.obatItems?.length ?? 0) === 0

  const tableBody = allEmpty
    ? '<tr><td colspan="5" class="center" style="padding:16px;color:#6b7280;">Tidak ada item tagihan untuk kunjungan ini.</td></tr>'
    : tindakanRows + bhpRows + labRows + radRows + obatRows

  const paymentRows =
    persistedInvoice && persistedInvoice.payments?.length > 0
      ? persistedInvoice.payments
          .map(
            (p, i: number) => `
          <tr>
            <td class="center">${i + 1}</td>
            <td>${escapeHtml(formatPrintableDate(p.paidAt ?? p.createdAt ?? p.date))}</td>
            <td>${escapeHtml(p.method ?? p.paymentMethod ?? '-')}</td>
            <td class="right">${escapeHtml(formatRupiah(p.amount ?? 0))}</td>
          </tr>`
          )
          .join('')
      : ''

  const paymentSection =
    persistedInvoice && paymentRows
      ? `
      <div class="section-banner" style="background:#374151;margin-top:10px;">Riwayat Pembayaran</div>
      <table class="invoice-table">
        <thead>
          <tr>
            <th style="width:40px;">No.</th>
            <th>Tanggal</th>
            <th>Metode</th>
            <th style="width:140px;">Jumlah</th>
          </tr>
        </thead>
        <tbody>${paymentRows}</tbody>
      </table>`
      : ''

  const html = `
    <html>
    <head>
      <title>Invoice ${escapeHtml(noInvoice)}</title>
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        body { font-family: Arial, sans-serif; color: #111827; font-size: 12px; margin: 0; background: #fff; }
        .sheet { border: 1px solid #9ca3af; padding: 10px 12px; }
        .head-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #374151;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .brand { display: flex; align-items: center; gap: 10px; }
        .logo { width: 50px; height: auto; object-fit: contain; }
        .brand-text { line-height: 1.3; }
        .brand-title { font-size: 15px; font-weight: 700; text-transform: uppercase; }
        .brand-sub { font-size: 11px; color: #374151; }
        .invoice-badge { text-align: right; }
        .invoice-badge .title { font-size: 22px; font-weight: 900; letter-spacing: 3px; color: #1e3a8a; text-transform: uppercase; }
        .invoice-badge .no { font-size: 11px; color: #6b7280; }
        .meta-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 8px; }
        .meta-grid { width: 100%; border-collapse: collapse; }
        .meta-grid td { padding: 1px 3px; vertical-align: top; font-size: 12px; }
        .meta-label { width: 120px; font-weight: 700; }
        .section-banner {
          background: #1e3a8a;
          color: #fff;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          padding: 5px;
          margin: 8px 0 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        table.invoice-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .invoice-table th, .invoice-table td { border: 1px solid #d1d5db; padding: 4px 6px; font-size: 12px; }
        .invoice-table th { background: #374151; color: #fff; text-transform: uppercase; font-weight: 700; font-size: 11px; }
        .cat-header td { color: #fff; font-weight: 700; font-size: 11px; text-transform: uppercase; padding: 3px 6px; }
        .subtotal-row td { background: #f3f4f6; font-size: 11px; border-top: 1px solid #9ca3af; }
        .center { text-align: center; }
        .right { text-align: right; }
        .grand-total { margin-top: 10px; display: flex; justify-content: flex-end; }
        .grand-total-box { border: 2px solid #1e3a8a; padding: 8px 16px; text-align: right; min-width: 220px; }
        .grand-total-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #374151; }
        .grand-total-value { font-size: 18px; font-weight: 900; color: #1e3a8a; }
        .signatures { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .sign-item { text-align: center; }
        .sign-title { font-size: 12px; }
        .sign-space { height: 70px; }
        .sign-name { border-top: 1px solid #374151; padding-top: 2px; font-weight: 700; }
        .footnote { margin-top: 14px; border-top: 1px solid #6b7280; padding-top: 6px; font-size: 10px; color: #4b5563; }
        .printed { margin-top: 4px; font-size: 10px; color: #6b7280; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="head-top">
          <div class="brand">
            <img class="logo" src="${logoUrl}" alt="Logo" />
            <div class="brand-text">
              <div class="brand-title">SIMRS Rahayu Medical Center</div>
              <div class="brand-sub">Jl. Otista, Tarogong Garut</div>
              <div class="brand-sub">Telp. (0262) 2542608</div>
            </div>
          </div>
          <div class="invoice-badge">
            <div class="title">Invoice</div>
            <div class="no">No. ${escapeHtml(noInvoice)}</div>
          </div>
        </div>

        <div class="meta-wrap">
          <table class="meta-grid">
            <tr><td class="meta-label">Kepada (An.)</td><td style="font-weight:700;">: ${escapeHtml(printName)}</td></tr>
            <tr><td class="meta-label">Nama Pasien</td><td>: ${escapeHtml(invoice.namaPatient ?? invoice.patient?.name ?? '-')}</td></tr>
            <tr><td class="meta-label">No. RM</td><td>: ${escapeHtml(medicalRecordNumber)}</td></tr>
            <tr><td class="meta-label">Tgl. Lahir</td><td>: ${escapeHtml(tanggalLahir)}</td></tr>
            <tr><td class="meta-label">Alamat</td><td>: ${escapeHtml(alamat)}</td></tr>
          </table>
          <table class="meta-grid">
            <tr><td class="meta-label">No. Pendaftaran</td><td>: ${escapeHtml(noPendaftaran)}</td></tr>
            <tr><td class="meta-label">Tgl. Pendaftaran</td><td>: ${escapeHtml(tanggalPendaftaran)}</td></tr>
            <tr><td class="meta-label">Dokter</td><td>: ${escapeHtml(dokterPemeriksa)}</td></tr>
            <tr><td class="meta-label">Ruangan</td><td>: ${escapeHtml(ruangan)}</td></tr>
            <tr><td class="meta-label">Penjamin</td><td>: ${escapeHtml(penjamin)}</td></tr>
          </table>
        </div>

        <div class="section-banner">Rincian Tagihan Layanan Kesehatan</div>
        <table class="invoice-table">
          <thead>
            <tr>
              <th style="width:40px;">No.</th>
              <th>Deskripsi</th>
              <th style="width:50px;">Qty</th>
              <th style="width:130px;">Harga Satuan</th>
              <th style="width:130px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${tableBody}</tbody>
        </table>

        <div class="grand-total">
          <div class="grand-total-box">
            <div class="grand-total-label">Total Tagihan</div>
            <div class="grand-total-value">${escapeHtml(formatRupiah(invoice.total ?? 0))}</div>
          </div>
        </div>

        ${paymentSection}

        <div class="signatures">
          <div class="sign-item">
            <div class="sign-title">Petugas Kasir</div>
            <div class="sign-space"></div>
            <div class="sign-name">( ${escapeHtml(cashierName)} )</div>
          </div>
          <div class="sign-item">
            <div class="sign-title">Pasien / Keluarga</div>
            <div class="sign-space"></div>
            <div class="sign-name">(__________________)</div>
          </div>
        </div>

        <div class="footnote">
          Invoice ini dicetak otomatis dari sistem informasi manajemen rumah sakit dan sah tanpa tanda tangan basah.
        </div>
        <div class="printed">Dicetak: ${escapeHtml(printedAt)}</div>
      </div>
    </body>
    </html>`

  doPrint(html, `Invoice-${noInvoice}`)
}

export function printReceipt(
  invoice: Invoice,
  persistedInvoice: PersistedInvoice | null,
  payment: PaymentRecord | { amount: number; kode: string; date: string | Date },
  options: { printForKind: 'patient' | 'guarantor'; cashierName?: string }
): void {
  const isPatient = options.printForKind === 'patient'
  const printName = isPatient
    ? (invoice.namaPatient ?? invoice.patient?.name ?? '-')
    : (invoice.penjamin ?? 'Umum')

  const cashierName = options.cashierName || 'Petugas Kasir'

  const noReceipt = payment.kode ?? '-'
  const amount = payment.amount ?? 0
  const date = formatPrintableDate(
    payment.date ?? (payment as any).paidAt ?? (payment as any).createdAt
  )
  const terbilangText = terbilang(amount)
  const patientName = invoice.namaPatient ?? invoice.patient?.name ?? '-'
  const RM = invoice.medicalRecordNumber ?? invoice.patient?.medicalRecordNumber ?? '-'
  const printedAt = formatPrintableDate(new Date())

  const html = `
    <html>
    <head>
      <title>Kwitansi ${escapeHtml(noReceipt)}</title>
      <style>
        @page { size: A4 landscape; margin: 15mm; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; margin: 0; padding: 0; }
        .receipt-container {
            border: 2px solid #1e3a8a;
            padding: 20px;
            position: relative;
            background: #fff;
            min-height: 400px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .brand { display: flex; align-items: center; gap: 15px; }
        .logo { width: 60px; height: auto; }
        .hospital-info h1 { font-size: 20px; margin: 0; color: #1e3a8a; text-transform: uppercase; }
        .hospital-info p { font-size: 12px; margin: 2px 0; color: #4b5563; }
        .receipt-title { text-align: right; }
        .receipt-title h2 { font-size: 28px; font-weight: 900; margin: 0; color: #1e3a8a; text-transform: uppercase; letter-spacing: 2px; }
        .receipt-title p { font-size: 14px; margin: 5px 0; color: #6b7280; font-weight: 600; }
        
        .content { margin-top: 25px; }
        .row { display: flex; margin-bottom: 12px; align-items: flex-start; }
        .label { width: 180px; font-weight: 600; color: #374151; font-size: 14px; }
        .value { flex: 1; border-bottom: 1px dotted #9ca3af; padding-bottom: 2px; font-size: 14px; }
        
        .terbilang-box {
            background: #f3f4f6;
            padding: 12px 15px;
            border-left: 5px solid #1e3a8a;
            margin: 20px 0;
            font-style: italic;
            font-weight: 600;
            font-size: 15px;
        }
        
        .footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .amount-display {
            font-size: 24px;
            font-weight: 900;
            background: #1e3a8a;
            color: #fff;
            padding: 10px 25px;
            border-radius: 4px;
            display: inline-block;
        }
        .signature-box { text-align: center; width: 220px; }
        .signature-date { font-size: 13px; }
        .signature-space { height: 70px; }
        .signature-name { border-top: 1px solid #1f2937; font-weight: 700; padding-top: 5px; }
      </style>
    </head>
    <body>
        <div class="receipt-container">
            
            <div class="header">
                <div class="brand">
                    <img class="logo" src="${logoUrl}" />
                    <div class="hospital-info">
                        <h1>SIMRS Rahayu Medical Center</h1>
                        <p>Jl. Otista, Tarogong Garut | Telp. (0262) 2542608</p>
                    </div>
                </div>
                <div class="receipt-title">
                    <h2>KWITANSI</h2>
                    <p>No. ${escapeHtml(noReceipt)}</p>
                </div>
            </div>
            
            <div class="content">
                <div class="row">
                    <div class="label">Sudah Terima Dari</div>
                    <div class="value">: <strong>${escapeHtml(printName)}</strong></div>
                </div>
                <div class="row">
                    <div class="label">Banyaknya Uang</div>
                    <div class="value">: <span style="font-style: italic;">${terbilangText}</span></div>
                </div>
                <div class="row">
                    <div class="label">Untuk Pembayaran</div>
                    <div class="value">: Biaya Layanan Kesehatan / Tagihan No. ${escapeHtml(persistedInvoice?.kode ?? '-')} (An. ${escapeHtml(patientName)} / RM: ${escapeHtml(RM)})</div>
                </div>
            </div>
            
            <div class="terbilang-box">
                Terbilang: # ${terbilangText} #
            </div>
            
            <div class="footer">
                <div class="amount-display">
                    JUMLAH: ${escapeHtml(formatRupiah(amount))}
                </div>
                <div class="signature-box">
                    <div class="signature-date">Garut, ${date}</div>
                    <div class="signature-space"></div>
                    <div class="signature-name">( ${escapeHtml(cashierName)} )</div>
                </div>
            </div>
        </div>
        <p style="font-size: 9px; color: #9ca3af; margin-top: 5px;">Dicetak otomatis pada: ${printedAt}</p>
    </body>
    </html>
  `
  doPrint(html, `Kwitansi-${noReceipt}`)
}

function doPrint(html: string, title: string) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:0;height:0;border:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc || !iframe.contentWindow) return

  doc.open()
  doc.write(html)
  doc.close()

  iframe.contentWindow.focus()
  // Wait a bit for resources like images to load if any
  setTimeout(() => {
    iframe.contentWindow?.print()
    iframe.addEventListener('afterprint', () => document.body.removeChild(iframe))
  }, 300)
}
