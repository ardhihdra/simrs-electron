import React, { useMemo, useState } from 'react'

import { DesktopBadge } from '../atoms/DesktopBadge'
import { DesktopButton } from '../atoms/DesktopButton'
import { DesktopIcon } from '../atoms/DesktopIcon'
import { DesktopStatusPill, type DesktopStatusPillTone } from '../atoms/DesktopStatusPill'
import { DesktopTag } from '../atoms/DesktopTag'
import { DesktopTriageBadge, type DesktopTriageBadgeTone } from '../atoms/DesktopTriageBadge'
import { DesktopCard } from '../molecules/DesktopCard'
import { DesktopFormSection } from '../molecules/DesktopFormSection'
import { DesktopInputField } from '../molecules/DesktopInputField'
import { DesktopNoticePanel } from '../molecules/DesktopNoticePanel'
import { DesktopPropertyGrid, type DesktopPropertyItem } from '../molecules/DesktopPropertyGrid'

export type DesktopDispositionType =
  | 'pulang'
  | 'ranap'
  | 'rujuk-i'
  | 'rujuk-e'
  | 'meninggal'
  | 'paksa'

export type DesktopDispositionConfirmPayload = {
  type: DesktopDispositionType
  dischargeStatus?: DesktopDischargeStatus
  dischargeDisposition: string
  note: string
}

export type DesktopDischargeStatus = 'sembuh' | 'rujuk' | 'meninggal'

export type DesktopDispositionOption = {
  key: DesktopDispositionType
  label: string
  subtitle: string
  dischargeDisposition: string
  color: string
  softColor: string
  tone: DesktopStatusPillTone
}

export type DesktopDispositionBannerMeta = {
  label: string
  name: string
  colorName: string
  badgeTone: DesktopTriageBadgeTone
  background: string
  borderColor: string
  color: string
}

export type DesktopDispositionPatientSummary = {
  name: string
  registrationNumber: string
  ageLabel: string
  paymentLabel: string
  statusLabel?: string
  roomLabel?: string
  lengthOfStayLabel?: string
  patientTypeLabel?: string
  inaCbgLabel?: string
}

export type DesktopDispositionMedicationDispense = {
  status?: string
  patientId?: string
  quantity?: {
    value?: number
    unit?: string
  } | null
  medication?: {
    name?: string
  } | null
  dosageInstruction?: Array<{ text?: string }> | null
  authorizingPrescription?: {
    medication?: {
      name?: string
    } | null
    item?: {
      nama?: string
    } | null
    dosageInstruction?: Array<{ text?: string }> | null
    note?: string | null
  } | null
}

export type DesktopDispositionInvoiceLineItem = {
  category?: string
  description: string
  qty: number
  unitPrice: number
  subtotal: number
}

export type DesktopDispositionInvoice = {
  encounterId?: string
  encounterCode?: string
  patientId?: string
  total?: number
  penjamin?: string
  tindakanItems?: DesktopDispositionInvoiceLineItem[]
  bhpItems?: DesktopDispositionInvoiceLineItem[]
  laboratoryItems?: DesktopDispositionInvoiceLineItem[]
  radiologyItems?: DesktopDispositionInvoiceLineItem[]
  obatItems?: DesktopDispositionInvoiceLineItem[]
  administrasiItems?: DesktopDispositionInvoiceLineItem[]
}

export type DesktopDispositionMedicationRow = {
  drug: string
  instruction: string
  quantityLabel: string
}

export type DesktopDispositionBillingRow = {
  category: string
  item: string
  qtyLabel: string
  tariff: number
  total: number
}

export type DesktopDispositionBillingSummary = {
  rows: DesktopDispositionBillingRow[]
  total: number
  guarantorLabel: string
}

export type DesktopDispositionWorkflowProps = {
  patient: DesktopDispositionPatientSummary
  bannerMeta: DesktopDispositionBannerMeta
  summaryItems: DesktopPropertyItem[]
  options: DesktopDispositionOption[]
  onBack: () => void
  onConfirm: (payload: DesktopDispositionConfirmPayload) => void | Promise<void>
  isSubmitting?: boolean
  defaultDisposition?: DesktopDispositionType
  breadcrumbItems?: string[]
  title?: string
  backendNote?: React.ReactNode
  resumeDocumentLabel?: string
  renderReferralForm?: (args: {
    type: Extract<DesktopDispositionType, 'rujuk-i' | 'rujuk-e'>
  }) => React.ReactElement | null
  vitalContent?: React.ReactNode
  dischargeMedications?: DesktopDispositionMedicationDispense[]
  invoice?: DesktopDispositionInvoice | null
  dischargeStatusDispositionMap?: Partial<Record<DesktopDischargeStatus, string>>
  defaultDischargeStatus?: DesktopDischargeStatus
}

const getDispositionOption = (options: DesktopDispositionOption[], type: DesktopDispositionType) =>
  options.find((option) => option.key === type) ?? options[0]

const ignoredMedicationStatuses = new Set(['entered-in-error', 'cancelled', 'stopped', 'declined'])

const invoiceCategoryGroups: Array<{
  label: string
  key: keyof Pick<
    DesktopDispositionInvoice,
    | 'tindakanItems'
    | 'bhpItems'
    | 'laboratoryItems'
    | 'radiologyItems'
    | 'obatItems'
    | 'administrasiItems'
  >
}> = [
  { label: 'Tindakan Medis', key: 'tindakanItems' },
  { label: 'BHP', key: 'bhpItems' },
  { label: 'Laboratorium', key: 'laboratoryItems' },
  { label: 'Radiologi', key: 'radiologyItems' },
  { label: 'Obat', key: 'obatItems' },
  { label: 'Administrasi', key: 'administrasiItems' }
]

const dischargeDocuments = [
  'Surat Keterangan Dirawat',
  'Surat Keterangan Istirahat',
  'Resume Medis',
  'Jadwal Kontrol',
  'Bukti Pembayaran'
]

const dischargeStatusOptions = [
  {
    key: 'sembuh',
    label: 'Sembuh / Perbaikan',
    color: 'var(--ds-color-success)',
    softColor: 'color-mix(in_srgb,var(--ds-color-success)_10%,white)'
  },
  {
    key: 'rujuk',
    label: 'Dirujuk',
    color: 'var(--ds-color-warning)',
    softColor: 'color-mix(in_srgb,var(--ds-color-warning)_12%,white)'
  },
  {
    key: 'meninggal',
    label: 'Meninggal',
    color: 'var(--ds-color-danger)',
    softColor: 'color-mix(in_srgb,var(--ds-color-danger)_10%,white)'
  }
]

const dischargeStatusPayloadMap: Record<
  DesktopDischargeStatus,
  {
    type: DesktopDispositionType
    dischargeDisposition: string
  }
> = {
  sembuh: { type: 'pulang', dischargeDisposition: 'CURED' },
  rujuk: { type: 'rujuk-e', dischargeDisposition: 'REFERRED' },
  meninggal: { type: 'meninggal', dischargeDisposition: 'DECEASED' }
}

const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value)

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)

const getFirstText = (items?: Array<{ text?: string }> | null) =>
  items?.map((item) => item.text?.trim()).find(Boolean)

export function buildDispositionMedicationRows(
  dispenses: DesktopDispositionMedicationDispense[] = []
): DesktopDispositionMedicationRow[] {
  return dispenses
    .filter(
      (dispense) => !ignoredMedicationStatuses.has(String(dispense.status ?? '').toLowerCase())
    )
    .map((dispense) => {
      const drug =
        dispense.medication?.name?.trim() ||
        dispense.authorizingPrescription?.medication?.name?.trim() ||
        dispense.authorizingPrescription?.item?.nama?.trim() ||
        '-'
      const instruction =
        getFirstText(dispense.dosageInstruction) ||
        getFirstText(dispense.authorizingPrescription?.dosageInstruction) ||
        dispense.authorizingPrescription?.note?.trim() ||
        '-'
      const quantity = dispense.quantity?.value
      const unit = dispense.quantity?.unit?.trim()
      const quantityLabel =
        typeof quantity === 'number' && Number.isFinite(quantity)
          ? `${formatNumber(quantity)}${unit ? ` ${unit}` : ''}`
          : '-'

      return { drug, instruction, quantityLabel }
    })
    .filter((row) => row.drug !== '-')
}

export function buildDispositionBillingSummary(
  invoice?: DesktopDispositionInvoice | null
): DesktopDispositionBillingSummary {
  const rows = invoiceCategoryGroups.flatMap(({ label, key }) =>
    (invoice?.[key] ?? []).map((item) => ({
      category: label,
      item: item.description,
      qtyLabel: formatNumber(item.qty),
      tariff: item.unitPrice,
      total: item.subtotal
    }))
  )
  const computedTotal = rows.reduce((sum, row) => sum + row.total, 0)

  return {
    rows,
    total:
      typeof invoice?.total === 'number' && Number.isFinite(invoice.total)
        ? invoice.total
        : computedTotal,
    guarantorLabel: invoice?.penjamin?.trim() || '-'
  }
}

export function buildDispositionConfirmPayload({
  dischargeStatus,
  note,
  dispositionMap
}: {
  dischargeStatus: DesktopDischargeStatus
  note: string
  dispositionMap?: Partial<Record<DesktopDischargeStatus, string>>
}): DesktopDispositionConfirmPayload {
  const mapped = dischargeStatusPayloadMap[dischargeStatus]

  return {
    type: mapped.type,
    dischargeStatus,
    dischargeDisposition: dispositionMap?.[dischargeStatus] ?? mapped.dischargeDisposition,
    note
  }
}

function DesktopDispositionContextForm({ type }: { type: DesktopDispositionType }) {
  if (type === 'ranap') {
    return (
      <DesktopCard title="Detail Rawat Inap">
        <div className="igd-form-grid-3">
          <DesktopInputField
            label="Bangsal Tujuan"
            type="select"
            required
            placeholder="Pilih bangsal"
            options={[
              { value: 'Melati - Kelas 1', label: 'Melati - Kelas 1' },
              { value: 'Anggrek - Kelas 2', label: 'Anggrek - Kelas 2' },
              { value: 'Mawar - Kelas 3', label: 'Mawar - Kelas 3' },
              { value: 'ICU', label: 'ICU' },
              { value: 'ICCU', label: 'ICCU' }
            ]}
          />
          <DesktopInputField
            label="Dokter DPJP"
            type="select"
            required
            placeholder="Pilih DPJP"
            options={[
              { value: 'dr. Andi Wijaya, Sp.PD', label: 'dr. Andi Wijaya, Sp.PD' },
              { value: 'dr. Budi Santoso, Sp.JP', label: 'dr. Budi Santoso, Sp.JP' },
              { value: 'dr. Citra Dewi, Sp.B', label: 'dr. Citra Dewi, Sp.B' }
            ]}
          />
          <DesktopInputField
            label="No. Bed"
            type="select"
            placeholder="Pilih bed"
            options={[
              { value: '303-B', label: '303-B (Kosong)' },
              { value: '410-A', label: '410-A (Kosong)' }
            ]}
          />
          <DesktopInputField
            className="igd-form-field-span-3"
            label="Instruksi untuk DPJP"
            type="textarea"
            rows={3}
            placeholder="Catatan klinis dan instruksi serah terima untuk dokter DPJP..."
          />
        </div>
      </DesktopCard>
    )
  }

  if (type === 'pulang' || type === 'paksa') {
    return (
      <DesktopCard title="Informasi Kepulangan">
        <div className="igd-form-grid-3">
          <DesktopInputField
            label="Kondisi Saat Pulang"
            type="select"
            required
            value={type === 'paksa' ? 'Belum sembuh' : 'Sembuh'}
            options={[
              { value: 'Sembuh', label: 'Sembuh' },
              { value: 'Membaik', label: 'Membaik' },
              { value: 'Belum sembuh', label: 'Belum sembuh' }
            ]}
          />
          <DesktopInputField
            className="igd-form-field-span-2"
            label="Obat Pulang"
            placeholder="Nama obat, dosis, aturan pakai..."
          />
          <DesktopInputField
            className="igd-form-field-span-3"
            label="Instruksi & Edukasi Pasien"
            type="textarea"
            rows={3}
            placeholder="Perawatan di rumah, jadwal kontrol, tanda bahaya yang harus diwaspadai..."
          />
          {type === 'paksa' ? (
            <div className="igd-form-field-span-3 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-warning)] bg-[color-mix(in_srgb,var(--ds-color-warning)_12%,white)] px-[14px] py-[10px] text-[11.5px] text-[var(--ds-color-text-muted)]">
              Pasien/keluarga telah diberikan penjelasan tentang risiko pulang paksa dan wajib
              menandatangani surat pernyataan APS sebelum meninggalkan IGD.
            </div>
          ) : null}
        </div>
      </DesktopCard>
    )
  }

  if (type === 'meninggal') {
    return (
      <DesktopCard
        title="Keterangan Meninggal"
        extra={<DesktopTag tone="neutral">Perlu verifikasi</DesktopTag>}
      >
        <div className="igd-form-grid-3">
          <DesktopInputField
            label="Waktu Meninggal"
            required
            type="input"
            placeholder="YYYY-MM-DD HH:mm"
          />
          <DesktopInputField
            className="igd-form-field-span-2"
            label="Penyebab Kematian"
            placeholder="Diagnosis penyebab kematian utama..."
          />
          <DesktopInputField
            className="igd-form-field-span-3"
            label="Catatan"
            type="textarea"
            rows={3}
            placeholder="Keterangan tambahan, kondisi sebelum meninggal, dll..."
          />
        </div>
      </DesktopCard>
    )
  }

  return null
}

function DesktopNativeField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-[6px] block text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--ds-color-text-subtle)]">
        {label}
      </span>
      {children}
    </label>
  )
}

function DesktopInputShell(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-[32px] w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[10px] text-[12px] text-[var(--ds-color-text)] outline-none focus:border-[var(--ds-color-accent)]"
    />
  )
}

function DesktopSelectShell(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-[32px] w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[10px] text-[12px] text-[var(--ds-color-text)] outline-none focus:border-[var(--ds-color-accent)]"
    />
  )
}

function DesktopDischargeWorkflow({
  patient,
  medications,
  invoice,
  initialDischargeStatus,
  note,
  onNoteChange,
  onBack,
  onConfirm,
  isSubmitting,
  referralForm,
  backendNote,
  resumeDocumentLabel
}: {
  patient: DesktopDispositionPatientSummary
  medications: DesktopDispositionMedicationDispense[]
  invoice?: DesktopDispositionInvoice | null
  initialDischargeStatus: DesktopDischargeStatus
  note: string
  onNoteChange: (value: string) => void
  onBack: () => void
  onConfirm: (status: DesktopDischargeStatus) => void
  isSubmitting: boolean
  referralForm?: React.ReactElement | null
  backendNote?: React.ReactNode
  resumeDocumentLabel: string
}) {
  const [dischargeStatus, setDischargeStatus] =
    useState<DesktopDischargeStatus>(initialDischargeStatus)
  const medicationRows = buildDispositionMedicationRows(medications)
  const billingSummary = buildDispositionBillingSummary(invoice)
  const isReferralStatus = dischargeStatus === 'rujuk'
  const claimCoverage =
    billingSummary.guarantorLabel.toLowerCase().includes('bpjs') && billingSummary.total > 0
      ? billingSummary.total
      : 0
  const patientBill = Math.max(0, billingSummary.total - claimCoverage)

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-[14px]">
        <div>
          <DesktopButton emphasis="ghost" size="small" onClick={onBack} className="mb-[6px]">
            <span className="flex items-center gap-[6px]">
              <DesktopIcon name="arrow-left" size={13} />
              Daftar Pasien
            </span>
          </DesktopButton>
          <h1 className="text-[22px] font-bold leading-tight text-[var(--ds-color-text)]">
            Proses Pemulangan (Discharge)
          </h1>
          <div className="mt-[4px] text-[12px] text-[var(--ds-color-text-muted)]">
            {[
              patient.name,
              patient.roomLabel,
              patient.lengthOfStayLabel,
              patient.patientTypeLabel ?? patient.paymentLabel
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-[8px]">
          <DesktopButton emphasis="toolbar">
            <span className="flex items-center gap-[6px]">
              <DesktopIcon name="print" size={14} />
              Cetak Resume
            </span>
          </DesktopButton>
          {isReferralStatus ? (
            <DesktopButton emphasis="toolbar" disabled>
              Lengkapi Form Rujukan
            </DesktopButton>
          ) : (
            <DesktopButton
              emphasis="primary"
              loading={isSubmitting}
              onClick={() => onConfirm(dischargeStatus)}
            >
              <span className="flex items-center gap-[6px]">
                <DesktopIcon name="check" size={14} />
                Finalisasi & Pulangkan
              </span>
            </DesktopButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 items-start gap-[14px]">
        <div className="flex min-w-0 flex-col gap-[14px]">
          <DesktopCard title="Status Keluar">
            <div className="mb-[12px] grid grid-cols-3 gap-[8px]">
              {dischargeStatusOptions.map((status) => {
                const selected = dischargeStatus === status.key
                return (
                  <button
                    key={status.key}
                    type="button"
                    className="min-h-[38px] rounded-[var(--ds-radius-md)] border px-[8px] py-[9px] text-center text-[12px] font-semibold"
                    style={{
                      background: selected ? status.softColor : 'var(--ds-color-surface-muted)',
                      borderColor: selected ? status.color : 'var(--ds-color-border)',
                      color: selected ? status.color : 'var(--ds-color-text)'
                    }}
                    onClick={() => setDischargeStatus(status.key as DesktopDischargeStatus)}
                  >
                    {status.label}
                  </button>
                )
              })}
            </div>
            <div className="grid grid-cols-2 gap-[10px]">
              <DesktopNativeField label="Tanggal Pulang">
                <DesktopInputShell type="date" defaultValue="2026-04-25" />
              </DesktopNativeField>
              <DesktopNativeField label="Jadwal Kontrol">
                <DesktopInputShell type="date" defaultValue="2026-05-09" />
              </DesktopNativeField>
              <DesktopNativeField label="Poli Kontrol">
                <DesktopSelectShell defaultValue="Poli Penyakit Dalam">
                  <option>Poli Penyakit Dalam</option>
                  <option>Poli Jantung</option>
                  <option>Poli Saraf</option>
                </DesktopSelectShell>
              </DesktopNativeField>
              <DesktopNativeField label="Dokter Kontrol">
                <DesktopSelectShell defaultValue="dr. Andi Wijaya, Sp.PD">
                  <option>dr. Andi Wijaya, Sp.PD</option>
                  <option>dr. Budi Santoso, Sp.JP</option>
                </DesktopSelectShell>
              </DesktopNativeField>
            </div>
          </DesktopCard>

          {isReferralStatus ? (
            <DesktopCard
              title="Form Rujukan"
              subtitle="Gunakan form rujukan existing untuk memilih internal atau eksternal."
            >
              {referralForm ?? (
                <DesktopNoticePanel
                  title="Form rujukan belum terhubung"
                  description="Hubungkan renderReferralForm agar rujukan internal/eksternal bisa diproses dari status keluar."
                  tone="violet"
                />
              )}
            </DesktopCard>
          ) : (
            <DesktopCard title="Obat Pulang">
              <div className="flex flex-col gap-[8px]">
                {medicationRows.length > 0 ? (
                  medicationRows.map((row) => (
                    <div
                      key={`${row.drug}-${row.quantityLabel}-${row.instruction}`}
                      className="flex items-center justify-between gap-[10px] rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[10px] py-[8px] text-[12px]"
                    >
                      <div className="min-w-0">
                        <b className="text-[var(--ds-color-text)]">{row.drug}</b>
                        <span className="ml-[6px] text-[var(--ds-color-text-subtle)]">
                          {row.instruction}
                        </span>
                      </div>
                      <span className="shrink-0 font-mono text-[var(--ds-color-text-subtle)]">
                        {row.quantityLabel}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[10px] py-[12px] text-[12px] text-[var(--ds-color-text-subtle)]">
                    Belum ada MedicationDispense untuk encounter ini.
                  </div>
                )}
              </div>
            </DesktopCard>
          )}

          <DesktopCard title="Surat & Dokumen">
            <div className="flex flex-col gap-[6px]">
              {dischargeDocuments.map((documentLabel) => (
                <div
                  key={documentLabel}
                  className="flex items-center justify-between gap-[10px] rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[10px] py-[7px] text-[12px]"
                >
                  <label className="flex min-w-0 items-center gap-[8px] text-[var(--ds-color-text)]">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="accent-[var(--ds-color-accent)]"
                    />
                    <span className="truncate">
                      {documentLabel === 'Resume Medis' ? resumeDocumentLabel : documentLabel}
                    </span>
                  </label>
                  <DesktopButton emphasis="ghost" size="small">
                    <span className="flex items-center gap-[5px]">
                      <DesktopIcon name="print" size={11} />
                      Cetak
                    </span>
                  </DesktopButton>
                </div>
              ))}
            </div>
          </DesktopCard>

          <DesktopCard title="Catatan Disposisi" subtitle="opsional">
            <DesktopInputField
              label="Catatan"
              type="textarea"
              rows={3}
              value={note}
              onChange={onNoteChange}
              placeholder="Catatan klinis tambahan, instruksi khusus, atau hal yang perlu diketahui pasien..."
            />
          </DesktopCard>
        </div>

        <div className="flex min-w-0 flex-col gap-[14px]">
          <DesktopCard
            title="Rincian Billing"
            extra={
              <DesktopBadge tone="info">
                {patient.inaCbgLabel
                  ? `BPJS INA-CBG: ${patient.inaCbgLabel}`
                  : billingSummary.guarantorLabel}
              </DesktopBadge>
            }
            noPadding
          >
            <div className="overflow-hidden">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--ds-color-text-subtle)]">
                    <th className="px-[12px] py-[8px] text-left">Kategori</th>
                    <th className="px-[12px] py-[8px] text-left">Item</th>
                    <th className="px-[12px] py-[8px] text-right">Qty</th>
                    <th className="px-[12px] py-[8px] text-right">Tarif</th>
                    <th className="px-[12px] py-[8px] text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billingSummary.rows.length > 0 ? (
                    billingSummary.rows.map((row, index) => (
                      <tr
                        key={`${row.category}-${row.item}-${index}`}
                        className="border-b border-[var(--ds-color-border)] last:border-0"
                      >
                        <td className="px-[12px] py-[8px]">
                          <DesktopBadge>{row.category}</DesktopBadge>
                        </td>
                        <td className="px-[12px] py-[8px] text-[var(--ds-color-text)]">
                          {row.item}
                        </td>
                        <td className="px-[12px] py-[8px] text-right font-mono text-[11px]">
                          {row.qtyLabel}
                        </td>
                        <td className="px-[12px] py-[8px] text-right font-mono text-[11px]">
                          {formatNumber(row.tariff)}
                        </td>
                        <td className="px-[12px] py-[8px] text-right font-mono text-[11px] font-semibold">
                          {formatNumber(row.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-[12px] py-[18px] text-center text-[var(--ds-color-text-subtle)]"
                      >
                        Billing/invoice encounter ini belum tersedia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-[8px] border-t-2 border-[var(--ds-color-border)] px-[16px] py-[12px] text-[12px]">
              <div className="flex justify-between gap-[10px]">
                <span className="text-[var(--ds-color-text-muted)]">Total Biaya RS</span>
                <b className="font-mono">{formatRupiah(billingSummary.total)}</b>
              </div>
              <div className="flex justify-between gap-[10px]">
                <span className="text-[var(--ds-color-text-muted)]">
                  Ditanggung {billingSummary.guarantorLabel}
                  {patient.inaCbgLabel ? ` (INA-CBG ${patient.inaCbgLabel})` : ''}
                </span>
                <b className="font-mono text-[var(--ds-color-success)]">
                  {formatRupiah(claimCoverage)}
                </b>
              </div>
              <div className="flex justify-between gap-[10px] border-t border-[var(--ds-color-border)] pt-[8px]">
                <b className="text-[13px]">Selisih / Tagihan Pasien</b>
                <b
                  className="font-mono text-[15px]"
                  style={{
                    color: patientBill > 0 ? 'var(--ds-color-warning)' : 'var(--ds-color-success)'
                  }}
                >
                  {formatRupiah(patientBill)}
                </b>
              </div>
            </div>
          </DesktopCard>

          <DesktopCard title="SATUSEHAT & Klaim BPJS">
            <div className="flex flex-col gap-[10px]">
              {[
                ['Resume Medis -> SATUSEHAT', 'pending'],
                ['Klaim INA-CBG -> BPJS', 'pending'],
                ['Verifikasi billing', billingSummary.rows.length > 0 ? 'ready' : 'pending']
              ].map(([label, status]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[12px] py-[8px] text-[12px]"
                >
                  <span>{label}</span>
                  <DesktopBadge tone={status === 'ready' ? 'success' : 'warning'}>
                    {status}
                  </DesktopBadge>
                </div>
              ))}
              <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-info)] bg-[color-mix(in_srgb,var(--ds-color-info)_10%,white)] px-[12px] py-[8px] text-[11.5px] text-[var(--ds-color-text-muted)]">
                SATUSEHAT dan klaim BPJS akan disubmit otomatis saat finalisasi discharge.
              </div>
            </div>
          </DesktopCard>

          {backendNote ? (
            <DesktopNoticePanel title="Catatan integrasi backend" description={backendNote} />
          ) : null}
        </div>
      </div>
    </>
  )
}

export function DesktopDispositionWorkflow({
  patient,
  bannerMeta,
  summaryItems,
  options,
  onBack,
  onConfirm,
  isSubmitting = false,
  defaultDisposition = 'pulang',
  breadcrumbItems = ['IGD', 'Daftar Pasien'],
  title = 'Disposisi Pasien',
  backendNote,
  resumeDocumentLabel = 'Resume Medis IGD',
  renderReferralForm,
  vitalContent,
  dischargeMedications = [],
  invoice,
  dischargeStatusDispositionMap,
  defaultDischargeStatus
}: DesktopDispositionWorkflowProps) {
  const [selectedDisposition, setSelectedDisposition] =
    useState<DesktopDispositionType>(defaultDisposition)
  const [note, setNote] = useState('')
  const selectedOption = getDispositionOption(options, selectedDisposition)
  const isReferralDisposition =
    selectedDisposition === 'rujuk-i' || selectedDisposition === 'rujuk-e'
  const referralForm = useMemo(
    () =>
      isReferralDisposition && renderReferralForm
        ? renderReferralForm({ type: selectedDisposition })
        : null,
    [isReferralDisposition, renderReferralForm, selectedDisposition]
  )
  const dischargeReferralForm = useMemo(
    () => (renderReferralForm ? renderReferralForm({ type: 'rujuk-e' }) : null),
    [renderReferralForm]
  )
  const confirmDisabled = isSubmitting || (isReferralDisposition && !!renderReferralForm)
  const handleConfirm = () =>
    void onConfirm({
      type: selectedDisposition,
      dischargeDisposition: selectedOption?.dischargeDisposition ?? '',
      note
    })
  const handleDischargeConfirm = (dischargeStatus: DesktopDischargeStatus) =>
    void onConfirm(
      buildDispositionConfirmPayload({
        dischargeStatus,
        note,
        dispositionMap: dischargeStatusDispositionMap
      })
    )
  const initialDischargeStatus: DesktopDischargeStatus =
    defaultDischargeStatus ??
    (defaultDisposition === 'meninggal'
      ? 'meninggal'
      : defaultDisposition === 'rujuk-i' || defaultDisposition === 'rujuk-e'
        ? 'rujuk'
        : 'sembuh')

  if (
    selectedDisposition === 'pulang' ||
    selectedDisposition === 'rujuk-i' ||
    selectedDisposition === 'rujuk-e' ||
    selectedDisposition === 'meninggal'
  ) {
    return (
      <div className="flex flex-col gap-[16px]">
        <DesktopDischargeWorkflow
          patient={patient}
          medications={dischargeMedications}
          invoice={invoice}
          initialDischargeStatus={initialDischargeStatus}
          note={note}
          onNoteChange={setNote}
          onBack={onBack}
          onConfirm={handleDischargeConfirm}
          isSubmitting={isSubmitting}
          referralForm={dischargeReferralForm}
          backendNote={backendNote}
          resumeDocumentLabel={resumeDocumentLabel}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-wrap items-center gap-[8px]">
        <DesktopButton emphasis="ghost" size="small" onClick={onBack}>
          <span className="flex items-center gap-[6px]">
            <DesktopIcon name="arrow-left" size={13} />
            Kembali
          </span>
        </DesktopButton>
        <span className="text-[11px] text-[var(--ds-color-text-subtle)]">
          {breadcrumbItems.join(' / ')} /
        </span>
        <span className="text-[11px] font-semibold text-[var(--ds-color-text)]">{title}</span>
      </div>

      <div
        className="igd-disposisi-patient-banner"
        style={{
          background: bannerMeta.background,
          borderColor: bannerMeta.borderColor
        }}
      >
        <DesktopTriageBadge tone={bannerMeta.badgeTone}>{bannerMeta.label}</DesktopTriageBadge>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-bold" style={{ color: bannerMeta.color }}>
            {patient.name}
          </div>
          <div className="mt-[2px] text-[11.5px] text-[var(--ds-color-text-muted)]">
            <span className="font-mono">{patient.registrationNumber}</span>
            <span className="mx-[6px]">-</span>
            <span>{patient.ageLabel}</span>
            <span className="mx-[6px]">-</span>
            <span>{patient.paymentLabel}</span>
          </div>
        </div>
        <div className="ml-auto">
          <DesktopBadge tone="accent">{patient.statusLabel ?? 'Encounter'}</DesktopBadge>
        </div>
      </div>

      <div className="igd-disposisi-grid">
        <div className="flex min-w-0 flex-col gap-[12px]">
          <DesktopCard title="Jenis Disposisi" subtitle="Pilih rencana pengelolaan akhir">
            <div className="igd-disposisi-option-grid grid-cols-4!">
              {options.map((option) => {
                const isSelected = selectedDisposition === option.key
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`igd-disposisi-option ${isSelected ? 'igd-disposisi-option--selected' : ''}`}
                    style={
                      {
                        '--igd-disposisi-color': option.color,
                        '--igd-disposisi-soft': option.softColor
                      } as React.CSSProperties
                    }
                    onClick={() => setSelectedDisposition(option.key)}
                  >
                    <span className="igd-disposisi-option-label">{option.label}</span>
                    <span className="igd-disposisi-option-subtitle">{option.subtitle}</span>
                  </button>
                )
              })}
            </div>
          </DesktopCard>

          {isReferralDisposition ? (
            <>
              {referralForm ? (
                <DesktopCard
                  title={
                    selectedDisposition === 'rujuk-i'
                      ? 'Form Rujukan Internal'
                      : 'Form Rujukan Eksternal'
                  }
                  subtitle="Gunakan form rujukan yang sudah terhubung dengan encounter ini."
                >
                  {referralForm as unknown as React.ComponentProps<typeof DesktopCard>['children']}
                </DesktopCard>
              ) : (
                <DesktopNoticePanel
                  title="Form rujukan belum terhubung"
                  description="Rujukan internal dan eksternal diproses dari form rujukan existing. Hubungkan renderReferralForm untuk melanjutkan."
                  tone="violet"
                />
              )}
            </>
          ) : (
            <DesktopDispositionContextForm type={selectedDisposition} />
          )}

          <DesktopCard title="Catatan Disposisi" subtitle="opsional">
            <DesktopInputField
              label="Catatan"
              type="textarea"
              rows={3}
              value={note}
              onChange={setNote}
              placeholder="Catatan klinis tambahan, instruksi khusus, atau hal yang perlu diketahui penerima pasien..."
            />
          </DesktopCard>

          {isReferralDisposition && renderReferralForm ? (
            <DesktopNoticePanel
              title="Rujukan dikonfirmasi dari form rujukan"
              description="Lengkapi lalu simpan form rujukan terhubung. Setelah berhasil, encounter akan diselesaikan sebagai rujukan."
              tone="violet"
            />
          ) : null}

          {backendNote ? (
            <DesktopNoticePanel title="Catatan integrasi backend" description={backendNote} />
          ) : null}

          <div className="flex flex-wrap justify-end gap-[8px] pb-[8px]">
            <DesktopButton emphasis="ghost" onClick={onBack}>
              Batal
            </DesktopButton>
            {isReferralDisposition ? (
              <DesktopButton emphasis="toolbar" disabled={!selectedDisposition}>
                <span className="flex items-center gap-[6px]">
                  <DesktopIcon name="print" size={13} />
                  Cetak Surat Rujukan
                </span>
              </DesktopButton>
            ) : null}
            <DesktopButton
              emphasis="primary"
              loading={isSubmitting}
              disabled={confirmDisabled}
              onClick={handleConfirm}
            >
              <span className="flex items-center gap-[6px]">
                <DesktopIcon name="check" size={14} />
                Konfirmasi Disposisi
              </span>
            </DesktopButton>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-[12px]">
          <DesktopCard
            title="Ringkasan Pasien"
            extra={
              selectedOption ? (
                <DesktopStatusPill tone={selectedOption.tone}>
                  {selectedOption.label}
                </DesktopStatusPill>
              ) : null
            }
          >
            <DesktopFormSection title="Data Pasien">
              <DesktopPropertyGrid items={summaryItems} />
            </DesktopFormSection>
          </DesktopCard>

          <DesktopCard title="Vital Sign Terakhir">
            {
              (vitalContent ?? (
                <DesktopNoticePanel
                  title="Tanda vital belum tersedia"
                  description="Data tanda vital detail belum tampil di halaman disposisi."
                />
              )) as React.ComponentProps<typeof DesktopCard>['children']
            }
          </DesktopCard>

          {selectedOption ? (
            <div
              className="igd-disposisi-selected"
              style={{
                background: selectedOption.softColor,
                borderColor: selectedOption.color
              }}
            >
              <div
                className="igd-disposisi-selected-eyebrow"
                style={{ color: selectedOption.color }}
              >
                Disposisi Dipilih
              </div>
              <div className="text-[14px] font-bold" style={{ color: selectedOption.color }}>
                {selectedOption.label}
              </div>
              <div className="mt-[3px] text-[11px] text-[var(--ds-color-text-muted)]">
                {selectedOption.subtitle}
              </div>
            </div>
          ) : null}

          <DesktopCard title="Dokumen">
            <div className="flex flex-col gap-[7px]">
              {isReferralDisposition ? (
                <DesktopButton emphasis="toolbar" className="!justify-center">
                  <span className="flex items-center gap-[6px]">
                    <DesktopIcon name="print" size={13} />
                    Cetak Surat Rujukan
                  </span>
                </DesktopButton>
              ) : null}
              <DesktopButton emphasis="toolbar" className="!justify-center !opacity-60" disabled>
                <span className="flex items-center gap-[6px]">
                  <DesktopIcon name="print" size={13} />
                  {resumeDocumentLabel}
                </span>
              </DesktopButton>
              <DesktopButton emphasis="toolbar" className="!justify-center !opacity-60" disabled>
                <span className="flex items-center gap-[6px]">
                  <DesktopIcon name="download" size={13} />
                  Ekspor PDF
                </span>
              </DesktopButton>
            </div>
          </DesktopCard>
        </aside>
      </div>
    </div>
  )
}
