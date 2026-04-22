import type { PatientAttributes } from 'simrs-types'
import React, { useMemo, useState } from 'react'
import { DesktopBadge } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopTag } from '../../components/design-system/atoms/DesktopTag'
import { DesktopCard } from '../../components/design-system/molecules/DesktopCard'
import { DesktopFormSection } from '../../components/design-system/molecules/DesktopFormSection'
import { DesktopInput } from '../../components/design-system/molecules/DesktopInput'
import { DesktopInputField } from '../../components/design-system/molecules/DesktopInputField'
import { DesktopInputGroupField } from '../../components/design-system/molecules/DesktopInputGroupField'
import { DesktopMetricTile } from '../../components/design-system/molecules/DesktopMetricTile'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'
import { DesktopSegmentedControl } from '../../components/design-system/molecules/DesktopSegmentedControl'
import { DesktopPageHeader } from '../../components/design-system/organisms/DesktopPageHeader'
import {
  buildIgdRegistrationCommand,
  type IgdDashboard,
  type IgdPaymentMethod,
  type IgdRegistrationDraft,
  type IgdRegistrationMode
} from './igd.data'

type IgdRegistrasiPageProps = {
  dashboard: IgdDashboard
  selectedExistingPatient?: PatientAttributes
  onSelectExistingPatient?: (patient?: PatientAttributes) => void
  lookupSelectorSlot?: React.ReactNode
  initialMode?: IgdRegistrationMode
  submitting?: boolean
  onDone?: () => void
  onSubmitRegistration?: (input: {
    command: ReturnType<typeof buildIgdRegistrationCommand>
    intent: 'daftar' | 'triase'
  }) => Promise<void> | void
}

const REGISTER_MODE_OPTIONS = [
  { label: 'Pasien Baru', value: 'baru' },
  { label: 'Pasien Terdaftar', value: 'existing' },
  { label: 'Pasien Sementara', value: 'temporary' }
]

const GENDER_OPTIONS = [
  { label: 'Laki-laki', value: 'L' },
  { label: 'Perempuan', value: 'P' }
]

const TEMP_GENDER_OPTIONS = [
  { label: 'L', value: 'L' },
  { label: 'P', value: 'P' },
  { label: '?', value: '?' }
]

const ARRIVAL_OPTIONS = [
  { label: 'Datang Sendiri', value: 'Datang sendiri' },
  { label: 'Rujukan', value: 'Rujukan' },
  { label: 'Polisi', value: 'Polisi' }
]

const PAYMENT_OPTIONS = [
  { label: 'BPJS', value: 'BPJS' },
  { label: 'Umum', value: 'Umum' },
  { label: 'Asuransi', value: 'Asuransi' },
  { label: 'Perusahaan', value: 'Perusahaan' }
]

const RELATIONSHIP_OPTIONS = [
  { label: 'Suami/Istri', value: 'Suami/Istri' },
  { label: 'Orang Tua', value: 'Orang Tua' },
  { label: 'Anak', value: 'Anak' },
  { label: 'Saudara', value: 'Saudara' },
  { label: 'Lainnya', value: 'Lainnya' }
]

const QUICK_TRIAGE_OPTIONS = [
  {
    label: 'Tidak sadarkan diri / Henti jantung → L1',
    value: 'l1-critical',
    level: 1 as const,
    title: 'Level 1 — Resusitasi',
    description: 'Warna Merah · Masuk langsung, tanpa antrian',
    tone: 'danger' as const
  },
  {
    label: 'Gawat, napas / sirkulasi terancam → L1',
    value: 'l1-airway',
    level: 1 as const,
    title: 'Level 1 — Resusitasi',
    description: 'Warna Merah · Prioritas pertama',
    tone: 'danger' as const
  },
  {
    label: 'Perdarahan aktif / Syok → L2',
    value: 'l2-shock',
    level: 2 as const,
    title: 'Level 2 — Emergensi',
    description: 'Warna Merah · Perlu tindakan segera',
    tone: 'warning' as const
  },
  {
    label: 'Nyeri hebat (VAS ≥ 7) → L3',
    value: 'l3-pain',
    level: 3 as const,
    title: 'Level 3 — Urgen',
    description: 'Warna Kuning · Butuh evaluasi cepat',
    tone: 'warning' as const
  },
  {
    label: 'Nyeri sedang (VAS 4–6) → L4',
    value: 'l4-moderate',
    level: 4 as const,
    title: 'Level 4 — Semi-Urgen',
    description: 'Warna Hijau · Dapat menunggu singkat',
    tone: 'success' as const
  },
  {
    label: 'Keluhan ringan / Stabil → L5',
    value: 'l5-stable',
    level: 5 as const,
    title: 'Level 5 — Tidak Urgen',
    description: 'Warna Hijau · Kondisi stabil',
    tone: 'neutral' as const
  }
]

const getTodayDateTimeLocal = () => {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

const calculateAgeYears = (birthDate: string) => {
  if (!birthDate) return ''

  const today = new Date()
  const birth = new Date(`${birthDate}T00:00:00`)

  if (Number.isNaN(birth.getTime())) return ''

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }

  return String(age)
}

function createInitialDraft(): IgdRegistrationDraft {
  return {
    name: '',
    nik: '',
    birthDate: '',
    gender: 'L',
    phone: '',
    estimatedAge: '~45',
    arrivalDateTime: getTodayDateTimeLocal(),
    arrivalSource: 'Datang sendiri',
    paymentMethod: 'Umum',
    complaint: '',
    guarantorName: '',
    guarantorRelationship: 'Suami/Istri',
    guarantorNik: '',
    guarantorPhone: ''
  }
}

export function IgdRegistrasiPage({
  dashboard,
  selectedExistingPatient,
  onSelectExistingPatient,
  lookupSelectorSlot,
  initialMode = 'baru',
  submitting = false,
  onDone,
  onSubmitRegistration
}: IgdRegistrasiPageProps) {
  const [registerMode, setRegisterMode] = useState<IgdRegistrationMode>(initialMode)
  const [draft, setDraft] = useState<IgdRegistrationDraft>(createInitialDraft)
  const [referralFacility, setReferralFacility] = useState('')
  const [selectedBedCode, setSelectedBedCode] = useState('')
  const [quickCondition, setQuickCondition] = useState(QUICK_TRIAGE_OPTIONS[0].value)

  const availableBeds = dashboard.beds.filter((bed) => bed.status === 'available')
  const occupiedCount = dashboard.beds.filter((bed) => bed.status === 'occupied').length
  const cleaningCount = dashboard.beds.filter((bed) => bed.status === 'cleaning').length
  const quickTriageMeta =
    QUICK_TRIAGE_OPTIONS.find((item) => item.value === quickCondition) ?? QUICK_TRIAGE_OPTIONS[0]

  const zoneStats = useMemo(
    () =>
      ['Resusitasi', 'Observasi', 'Treatment'].map((zone) => {
        const zoneBeds = dashboard.beds.filter((bed) => bed.zone === zone)
        const available = zoneBeds.filter((bed) => bed.status === 'available').length

        return {
          zone,
          total: zoneBeds.length,
          available,
          occupiedRatio: zoneBeds.length === 0 ? 0 : ((zoneBeds.length - available) / zoneBeds.length) * 100
        }
      }),
    [dashboard.beds]
  )

  const bedOptions = availableBeds.map((bed) => ({
    label: `${bed.code} (${bed.zone} — kosong)`,
    value: bed.code
  }))

  const derivedAgeLabel =
    registerMode === 'temporary'
      ? `${draft.estimatedAge || '~45'} ${draft.gender}`
      : `${calculateAgeYears(draft.birthDate) || '0'} ${draft.gender}`

  const canSubmit =
    draft.complaint.trim().length > 0 &&
    (registerMode === 'temporary'
      ? draft.estimatedAge.trim().length > 0
      : registerMode === 'existing'
        ? !!selectedExistingPatient?.id
        : draft.name.trim().length > 0)

  const updateDraft = (patch: Partial<IgdRegistrationDraft>) => {
    setDraft((current) => ({
      ...current,
      ...patch
    }))
  }

  const handleRegisterModeChange = (nextMode: string) => {
    const mode = nextMode as IgdRegistrationMode
    setRegisterMode(mode)

    if (mode !== 'existing') {
      onSelectExistingPatient?.(undefined)
    }

    setDraft((current) => ({
      ...current,
      gender: mode === 'temporary' ? '?' : 'L'
    }))
  }

  const handleSubmit = async (intent: 'daftar' | 'triase') => {
    if (!canSubmit || !onSubmitRegistration) return

    await onSubmitRegistration({
      command: buildIgdRegistrationCommand({
        mode: registerMode,
        draft,
        selectedPatient: selectedExistingPatient
      }),
      intent
    })
  }

  return (
    <div className="igd-parity-scope flex flex-col gap-[16px]">
      <DesktopPageHeader
        eyebrow="Modul IGD"
        title="Registrasi Pasien IGD"
        subtitle="Form intake awal terhubung ke backend registrasi IGD, dengan lookup pasien existing dan snapshot bed operasional."
        status="Terhubung backend"
        metadata={<DesktopBadge tone="accent">Submit langsung buat encounter IGD</DesktopBadge>}
        actions={
          <DesktopButton emphasis="toolbar" onClick={onDone}>
            Kembali ke Daftar
          </DesktopButton>
        }
      />

      <div className="igd-registrasi-grid">
        <DesktopCard
          title="Registrasi Pasien IGD"
          extra={
            <div className="flex items-center gap-[8px]">
              <DesktopTag tone="danger">IGD</DesktopTag>
              <DesktopTag tone="neutral">Encounter langsung</DesktopTag>
            </div>
          }
        >
          <div className="grid gap-[16px]">
            <div className="igd-inline-segment">
              <DesktopSegmentedControl
                value={registerMode}
                options={REGISTER_MODE_OPTIONS}
                onChange={handleRegisterModeChange}
              />
            </div>

            {registerMode === 'existing' ? (
              <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[14px] py-[12px]">
                {lookupSelectorSlot ?? null}
              </div>
            ) : null}

            {registerMode === 'temporary' ? (
              <DesktopNoticePanel
                tone="violet"
                title="Pasien Tidak Dikenal"
                description="Kode temporary akan di-generate backend saat submit dan langsung dipakai untuk encounter IGD."
              />
            ) : null}

            <DesktopFormSection title="A. Identitas Pasien">
              <div className="igd-form-grid-3">
                {registerMode === 'baru' ? (
                  <>
                    <DesktopInputGroupField
                      label="NIK"
                      addon="NIK"
                      placeholder="16 digit"
                      value={draft.nik}
                      onChange={(value) => updateDraft({ nik: value })}
                      mono
                    />

                    <div className="md:col-span-2">
                      <DesktopInputField
                        label="Nama"
                        required
                        placeholder="Nama lengkap sesuai identitas"
                        value={draft.name}
                        onChange={(value) => updateDraft({ name: value })}
                      />
                    </div>

                    <DesktopInputField
                      label="Tgl. Lahir"
                      required
                      value={draft.birthDate}
                      onChange={(value) => updateDraft({ birthDate: value })}
                    />

                    <div className="desktop-input-field flex flex-col gap-[var(--ds-space-xs)]">
                      <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                        Jenis Kelamin <span className="ml-[2px] text-[var(--ds-color-danger)]">*</span>
                      </div>
                      <DesktopSegmentedControl
                        value={draft.gender}
                        options={GENDER_OPTIONS}
                        onChange={(value) => updateDraft({ gender: value as IgdRegistrationDraft['gender'] })}
                      />
                    </div>

                    <DesktopInputGroupField
                      label="No. Telepon"
                      addon="+62"
                      placeholder="812 xxxx xxxx"
                      value={draft.phone}
                      onChange={(value) => updateDraft({ phone: value })}
                      mono
                    />
                  </>
                ) : null}

                {registerMode === 'temporary' ? (
                  <>
                    <div className="md:col-span-2">
                      <DesktopInputField
                        label="Nama (opsional)"
                        placeholder="Kosongkan jika tidak diketahui"
                        value={draft.name}
                        onChange={(value) => updateDraft({ name: value })}
                      />
                    </div>

                    <div className="desktop-input-field flex flex-col gap-[var(--ds-space-xs)]">
                      <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                        Estimasi Umur
                      </div>
                      <div className="flex items-center gap-[8px]">
                        <div className="flex-1">
                          <DesktopInput
                            placeholder="~45"
                            value={draft.estimatedAge}
                            onChange={(value) => updateDraft({ estimatedAge: value })}
                          />
                        </div>
                        <span className="text-[12px] text-[var(--ds-color-text-subtle)]">tahun</span>
                      </div>
                    </div>

                    <div className="desktop-input-field flex flex-col gap-[var(--ds-space-xs)]">
                      <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                        Jenis Kelamin
                      </div>
                      <DesktopSegmentedControl
                        value={draft.gender}
                        options={TEMP_GENDER_OPTIONS}
                        onChange={(value) => updateDraft({ gender: value as IgdRegistrationDraft['gender'] })}
                      />
                    </div>

                    <DesktopInputGroupField
                      label="No. Telepon"
                      addon="+62"
                      placeholder="Opsional"
                      value={draft.phone}
                      onChange={(value) => updateDraft({ phone: value })}
                      mono
                    />
                  </>
                ) : null}

                {registerMode === 'existing' && selectedExistingPatient ? (
                  <>
                    <DesktopInputField
                      label="No. RM"
                      value={selectedExistingPatient.medicalRecordNumber || '-'}
                      disabled
                      className="font-mono"
                    />
                    <div className="md:col-span-2">
                      <DesktopInputField
                        label="Pasien Terpilih"
                        value={selectedExistingPatient.name || '-'}
                        disabled
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </DesktopFormSection>

            <DesktopFormSection title="B. Data Kunjungan IGD" divided>
              <div className="igd-form-grid-3">
                <DesktopInputField
                  label="No. Rawat"
                  required
                  value="Auto saat submit"
                  disabled
                  hint="Backend akan menghasilkan nomor registrasi IGD"
                  className="font-mono"
                />
                <DesktopInputField
                  label="Waktu Datang"
                  required
                  value={draft.arrivalDateTime}
                  onChange={(value) => updateDraft({ arrivalDateTime: value })}
                />
                <DesktopInputField label="Jenis Kunjungan" value="IGD" disabled />

                <div className="desktop-input-field md:col-span-3 flex flex-col gap-[var(--ds-space-xs)]">
                  <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                    Sumber Pasien <span className="ml-[2px] text-[var(--ds-color-danger)]">*</span>
                  </div>
                  <div className="igd-inline-segment-tight">
                    <DesktopSegmentedControl
                      value={draft.arrivalSource}
                      options={ARRIVAL_OPTIONS}
                      onChange={(value) =>
                        updateDraft({ arrivalSource: value as IgdRegistrationDraft['arrivalSource'] })
                      }
                    />
                  </div>
                </div>

                {draft.arrivalSource === 'Rujukan' ? (
                  <div className="md:col-span-3">
                    <DesktopInputField
                      label="Asal Faskes Rujukan"
                      placeholder="Nama puskesmas/RS perujuk…"
                      value={referralFacility}
                      onChange={setReferralFacility}
                    />
                  </div>
                ) : null}

                <DesktopInputField
                  label="Bed IGD"
                  type="select"
                  placeholder="Informasional"
                  value={selectedBedCode}
                  options={bedOptions}
                  onChange={setSelectedBedCode}
                  hint="Snapshot bed ini tidak mengikat assignment backend pada fase registrasi."
                />

                <div className="desktop-input-field flex flex-col gap-[var(--ds-space-xs)]">
                  <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                    Penjamin Biaya
                  </div>
                  <DesktopSegmentedControl
                    value={draft.paymentMethod}
                    options={PAYMENT_OPTIONS}
                    onChange={(value) => updateDraft({ paymentMethod: value as IgdPaymentMethod })}
                  />
                </div>

                <div className="md:col-span-3">
                  <DesktopInputField
                    label="Keluhan Singkat"
                    type="textarea"
                    rows={3}
                    placeholder="Deskripsikan keluhan utama…"
                    value={draft.complaint}
                    onChange={(value) => updateDraft({ complaint: value })}
                  />
                </div>
              </div>
            </DesktopFormSection>

            <DesktopFormSection title="C. Penanggung Jawab" subtitle="(opsional — dapat diisi nanti)" divided>
              <div className="igd-form-grid-3">
                <div className="md:col-span-2">
                  <DesktopInputField
                    label="Nama Penanggung Jawab"
                    placeholder="Nama lengkap…"
                    value={draft.guarantorName}
                    onChange={(value) => updateDraft({ guarantorName: value })}
                  />
                </div>
                <DesktopInputField
                  label="Hubungan"
                  type="select"
                  value={draft.guarantorRelationship}
                  options={RELATIONSHIP_OPTIONS}
                  onChange={(value) => updateDraft({ guarantorRelationship: value })}
                />
                <DesktopInputField
                  label="No. KTP PJ"
                  placeholder="16 digit NIK"
                  value={draft.guarantorNik}
                  onChange={(value) => updateDraft({ guarantorNik: value })}
                  className="font-mono"
                />
                <div className="md:col-span-2">
                  <DesktopInputGroupField
                    label="No. Telepon PJ"
                    addon="+62"
                    placeholder="812 xxxx xxxx"
                    value={draft.guarantorPhone}
                    onChange={(value) => updateDraft({ guarantorPhone: value })}
                    mono
                  />
                </div>
              </div>
            </DesktopFormSection>

            <div className="igd-registrasi-actions">
              <DesktopButton emphasis="ghost" onClick={onDone}>
                Batal
              </DesktopButton>
              <DesktopButton
                emphasis="toolbar"
                onClick={() => void handleSubmit('daftar')}
                disabled={!canSubmit || submitting}
              >
                Simpan - Triase Nanti
              </DesktopButton>
              <DesktopButton
                emphasis="primary"
                onClick={() => void handleSubmit('triase')}
                disabled={!canSubmit || submitting}
              >
                Simpan & Langsung Triase
              </DesktopButton>
            </div>
          </div>
        </DesktopCard>

        <div className="igd-registrasi-side">
          <DesktopCard title="Triase Cepat" subtitle="Tentukan sebelum registrasi selesai">
            <div className="grid gap-[14px]">
              <DesktopInputField
                label="Kondisi Umum"
                required
                type="select"
                value={quickCondition}
                options={QUICK_TRIAGE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))}
                onChange={setQuickCondition}
              />
              <DesktopNoticePanel
                tone={quickTriageMeta.tone === 'neutral' ? 'success' : quickTriageMeta.tone}
                title={quickTriageMeta.title}
                description={quickTriageMeta.description}
                leading={
                  <div
                    className="grid h-[38px] w-[38px] place-items-center rounded-[var(--ds-radius-md)] text-[15px] font-black text-white"
                    style={{
                      background:
                        quickTriageMeta.tone === 'warning'
                          ? 'var(--ds-color-warning)'
                          : quickTriageMeta.tone === 'success'
                            ? 'var(--ds-color-success)'
                            : quickTriageMeta.tone === 'neutral'
                              ? 'var(--ds-color-accent)'
                              : 'var(--ds-color-danger)'
                    }}
                  >
                    {`L${quickTriageMeta.level}`}
                  </div>
                }
              />
              <DesktopNoticePanel
                title="Level triase final tetap dicatat di workflow triase"
                description="Pada fase ini data quick triage hanya membantu intake dan belum dikirim sebagai write-flow triase."
              />
            </div>
          </DesktopCard>

          <DesktopCard title="Ketersediaan Bed IGD">
            <div>
              <div className="igd-bed-availability-grid">
                <DesktopMetricTile label="Tersedia" value={String(availableBeds.length)} tone="success" />
                <DesktopMetricTile label="Terisi" value={String(occupiedCount)} tone="danger" />
                <DesktopMetricTile label="Cleaning" value={String(cleaningCount)} tone="warning" />
              </div>

              {zoneStats.map((zone) => (
                <div key={zone.zone} className="igd-bed-zone-row">
                  <span className="igd-bed-zone-label">{zone.zone}</span>
                  <div className="igd-bed-zone-bar">
                    <div
                      className="igd-bed-zone-bar-fill"
                      style={{
                        width: `${zone.occupiedRatio}%`,
                        background: zone.available === 0 ? 'var(--danger)' : 'var(--accent)'
                      }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-[var(--ds-color-text-subtle)] min-w-[36px]">
                    {zone.available}/{zone.total}
                  </span>
                </div>
              ))}
            </div>
          </DesktopCard>

          <DesktopCard title="Ringkasan Submit" subtitle="Data yang akan dikirim ke backend IGD">
            <DesktopNoticePanel
              title={
                registerMode === 'existing'
                  ? `Pasien existing${selectedExistingPatient?.name ? ` · ${selectedExistingPatient.name}` : ''}`
                  : registerMode === 'temporary'
                    ? `Pasien temporary · ${derivedAgeLabel}`
                    : `Pasien baru · ${draft.name || 'Belum diisi'}`
              }
              description={`Keluhan: ${draft.complaint || 'Belum diisi'} · Pembayaran: ${draft.paymentMethod}`}
            />
          </DesktopCard>
        </div>
      </div>
    </div>
  )
}
