import React, { useMemo, useState } from 'react'

import { DesktopBadge } from '../atoms/DesktopBadge'
import { DesktopButton } from '../atoms/DesktopButton'
import { DesktopIcon } from '../atoms/DesktopIcon'
import { DesktopStatusPill, type DesktopStatusPillTone } from '../atoms/DesktopStatusPill'
import { DesktopTag } from '../atoms/DesktopTag'
import { DesktopTriageBadge, type DesktopTriageBadgeTone } from '../atoms/DesktopTriageBadge'
import { DesktopCard } from '../molecules/DesktopCard'
import { DesktopFormSection } from '../molecules/DesktopFormSection'
import { DesktopInputField, type DesktopInputFieldOption } from '../molecules/DesktopInputField'
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
  dischargeDisposition: string
  note: string
}

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
}

const referralUnitOptions: DesktopInputFieldOption[] = [
  { value: 'Poli Jantung & Pembuluh Darah', label: 'Poli Jantung & Pembuluh Darah' },
  { value: 'Poli Saraf', label: 'Poli Saraf' },
  { value: 'Poli Bedah Umum', label: 'Poli Bedah Umum' },
  { value: 'Poli Penyakit Dalam', label: 'Poli Penyakit Dalam' },
  { value: 'ICU / ICCU', label: 'ICU / ICCU' },
  { value: 'Kamar Operasi', label: 'Kamar Operasi' }
]

const getDispositionOption = (options: DesktopDispositionOption[], type: DesktopDispositionType) =>
  options.find((option) => option.key === type) ?? options[0]

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

function DesktopReferralMockupSections({
  type
}: {
  type: Extract<DesktopDispositionType, 'rujuk-i' | 'rujuk-e'>
}) {
  return (
    <>
      <DesktopCard
        title="A. Data Rujukan"
        subtitle="Tujuan & waktu"
        extra={
          <DesktopTag tone={type === 'rujuk-e' ? 'accent' : 'neutral'}>
            {type === 'rujuk-e' ? 'Eksternal' : 'Internal'}
          </DesktopTag>
        }
      >
        <div className="igd-form-grid-3">
          <DesktopInputField
            label="Tanggal & Waktu Rujukan"
            required
            placeholder="YYYY-MM-DD HH:mm"
          />
          {type === 'rujuk-e' ? (
            <DesktopInputField
              className="igd-form-field-span-2"
              label="RS / Faskes Tujuan"
              required
              placeholder="Nama RS atau fasilitas kesehatan tujuan..."
            />
          ) : null}
          <DesktopInputField
            className={type === 'rujuk-e' ? '' : 'igd-form-field-span-2'}
            label="Poli / Unit Tujuan"
            type="select"
            required
            placeholder="Pilih poli / unit"
            options={referralUnitOptions}
          />
          <DesktopInputField
            label="Dokter Tujuan"
            type="select"
            placeholder="Pilih dokter"
            options={[
              { value: 'dr. Andi Wijaya, Sp.JP', label: 'dr. Andi Wijaya, Sp.JP' },
              { value: 'dr. Budi Santoso, Sp.S', label: 'dr. Budi Santoso, Sp.S' },
              { value: 'dr. Citra Dewi, Sp.B', label: 'dr. Citra Dewi, Sp.B' }
            ]}
          />
          <DesktopInputField
            className="igd-form-field-span-3"
            label="Alasan Rujukan"
            type="textarea"
            required
            rows={3}
            placeholder="Jelaskan alasan klinis merujuk pasien ini..."
          />
        </div>
      </DesktopCard>

      <DesktopCard title="B. Data Klinis" subtitle="Diagnosis & kondisi saat rujuk">
        <div className="igd-form-grid-3">
          <DesktopInputField
            className="igd-form-field-span-2"
            label="Diagnosis Utama"
            required
            placeholder="Cari nama penyakit atau kode ICD-10..."
          />
          <DesktopInputField label="Kode ICD-10" disabled placeholder="-" />
          <DesktopInputField
            className="igd-form-field-span-3"
            label="Diagnosis Sekunder / Komorbid"
            placeholder="Contoh: Hipertensi grade II (I10), DM tipe 2 (E11.9)..."
          />
          <DesktopInputField
            label="Keadaan Saat Rujuk"
            type="select"
            required
            value="Stabil"
            options={[
              { value: 'Stabil', label: 'Stabil' },
              { value: 'Tidak Stabil', label: 'Tidak Stabil' },
              { value: 'Kritis', label: 'Kritis' },
              { value: 'Berpotensi memburuk', label: 'Berpotensi memburuk' }
            ]}
          />
          <DesktopInputField
            label="Tingkat Kesadaran"
            type="select"
            value="GCS 15 - Composmentis"
            options={[
              { value: 'GCS 15 - Composmentis', label: 'GCS 15 - Composmentis' },
              { value: 'GCS 14-13 - Somnolen', label: 'GCS 14-13 - Somnolen' },
              { value: 'GCS 12-9 - Stupor', label: 'GCS 12-9 - Stupor' },
              { value: 'GCS <=8 - Koma', label: 'GCS <=8 - Koma' }
            ]}
          />
        </div>
      </DesktopCard>

      <DesktopCard title="C. Resume Klinis" subtitle="Untuk surat rujukan">
        <div className="flex flex-col gap-[14px]">
          <DesktopInputField
            label="Ringkasan Pemeriksaan"
            type="textarea"
            required
            rows={4}
            placeholder="Anamnesis singkat, temuan pemeriksaan fisik, hasil penunjang yang relevan..."
          />
          <DesktopInputField
            label="Terapi / Tindakan yang Sudah Diberikan"
            type="textarea"
            required
            rows={3}
            placeholder="Obat, dosis, rute, prosedur, atau tindakan medis yang telah dilakukan..."
          />
        </div>
      </DesktopCard>

      <DesktopCard title="D. Transportasi">
        <div className="igd-form-grid-3">
          <DesktopInputField
            className="igd-form-field-span-2"
            label="Jenis Transportasi"
            type="select"
            required
            value="Ambulans AGD"
            options={[
              { value: 'Ambulans AGD', label: 'Ambulans AGD' },
              { value: 'Ambulans RS', label: 'Ambulans RS' },
              { value: 'Kendaraan Pribadi', label: 'Kendaraan Pribadi' },
              { value: 'Kendaraan Umum', label: 'Kendaraan Umum' }
            ]}
          />
          <DesktopInputField
            label="Pendamping"
            type="select"
            value="Perawat IGD"
            options={[
              { value: 'Perawat IGD', label: 'Perawat IGD' },
              { value: 'Dokter jaga', label: 'Dokter jaga' },
              { value: 'Keluarga saja', label: 'Keluarga saja' },
              { value: 'Tim medis khusus', label: 'Tim medis khusus' }
            ]}
          />
          <DesktopInputField
            className="igd-form-field-span-3"
            label="Catatan Transportasi"
            placeholder="No. ambulans, kondisi perlu pemantauan, peralatan dibawa, dll..."
          />
        </div>
      </DesktopCard>
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
  vitalContent
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
  const confirmDisabled = isSubmitting || (isReferralDisposition && !!renderReferralForm)

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
              <DesktopReferralMockupSections type={selectedDisposition} />
              {referralForm ? (
                <DesktopCard
                  title="Form Rujukan Terhubung"
                  subtitle="Simpan form ini untuk membuat rujukan dan menyelesaikan disposisi."
                >
                  {referralForm as unknown as React.ComponentProps<typeof DesktopCard>['children']}
                </DesktopCard>
              ) : null}
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
              onClick={() =>
                void onConfirm({
                  type: selectedDisposition,
                  dischargeDisposition: selectedOption?.dischargeDisposition ?? '',
                  note
                })
              }
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
