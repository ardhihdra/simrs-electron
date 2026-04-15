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

type InvoiceLineItemCategory =
  | 'tindakan'
  | 'bhp'
  | 'service_request'
  | 'obat'
  | 'laboratory'
  | 'radiology'

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
  draft: { label: 'Draft', color: 'default' }
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

  const statusInfo = persistedInvoice
    ? (STATUS_LABEL[persistedInvoice.status as keyof typeof STATUS_LABEL] ?? STATUS_LABEL.issued)
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

        {isConfirmed && !isPaid && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setPaymentModalOpen(true)}>
            Tambah Pembayaran
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

          {(invoice.tindakanItems?.length ?? 0) === 0 &&
            (invoice.bhpItems?.length ?? 0) === 0 &&
            (invoice.laboratoryItems?.length ?? 0) === 0 &&
            (invoice.radiologyItems?.length ?? 0) === 0 &&
            (invoice.obatItems?.length ?? 0) === 0 && (
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

      {/* Payment Modal */}
      {isConfirmed && persistedInvoice && (
        <PaymentModal
          open={paymentModalOpen}
          invoiceId={persistedInvoice.id}
          remaining={persistedInvoice.remaining}
          onCancel={() => setPaymentModalOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
