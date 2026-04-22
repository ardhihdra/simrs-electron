import { DesktopBadge } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopTag } from '../../components/design-system/atoms/DesktopTag'
import { DesktopTriageBadge } from '../../components/design-system/atoms/DesktopTriageBadge'
import { DesktopCard } from '../../components/design-system/molecules/DesktopCard'
import { DesktopFormSection } from '../../components/design-system/molecules/DesktopFormSection'
import { DesktopInput } from '../../components/design-system/molecules/DesktopInput'
import { DesktopInputField } from '../../components/design-system/molecules/DesktopInputField'
import { DesktopInputGroupField } from '../../components/design-system/molecules/DesktopInputGroupField'
import { DesktopMetricTile } from '../../components/design-system/molecules/DesktopMetricTile'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'
import { DesktopSegmentedControl } from '../../components/design-system/molecules/DesktopSegmentedControl'
import { DesktopPageHeader } from '../../components/design-system/organisms/DesktopPageHeader'
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { IGD_PAGE_PATHS } from './igd.config'
import { useIgdStore } from './igd.state'

type IgdRegistrasiPageProps = {
  onDone?: () => void
  onOpenTriase?: () => void
}

type RegisterMode = 'baru' | 'existing' | 'temporary'
type GenderMode = 'L' | 'P' | '?'

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
  { label: 'Asuransi', value: 'Asuransi' }
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

const getTodayDateTimeLocal = () => '2026-04-21T10:25'

const calculateAgeYears = (birthDate: string) => {
  if (!birthDate) return ''

  const today = new Date('2026-04-21T00:00:00')
  const birth = new Date(`${birthDate}T00:00:00`)

  if (Number.isNaN(birth.getTime())) return ''

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }

  return String(age)
}

export function IgdRegistrasiPage({ onDone, onOpenTriase }: IgdRegistrasiPageProps) {
  const patients = useIgdStore((state) => state.patients)
  const beds = useIgdStore((state) => state.beds)
  const registrationDraft = useIgdStore((state) => state.registrationDraft)
  const updateRegistrationDraft = useIgdStore((state) => state.updateRegistrationDraft)
  const submitRegistration = useIgdStore((state) => state.submitRegistration)
  const assignBed = useIgdStore((state) => state.assignBed)

  const [registerMode, setRegisterMode] = useState<RegisterMode>('baru')
  const [nik, setNik] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<GenderMode>('L')
  const [phone, setPhone] = useState('')
  const [estimatedAge, setEstimatedAge] = useState('~45')
  const [existingSearch, setExistingSearch] = useState('Sutrisno')
  const [arrivalDateTime, setArrivalDateTime] = useState(getTodayDateTimeLocal())
  const [referralFacility, setReferralFacility] = useState('')
  const [selectedBedCode, setSelectedBedCode] = useState('')
  const [guarantorName, setGuarantorName] = useState('')
  const [relationship, setRelationship] = useState('Suami/Istri')
  const [guarantorKtp, setGuarantorKtp] = useState('')
  const [guarantorPhone, setGuarantorPhone] = useState('')
  const [quickCondition, setQuickCondition] = useState(QUICK_TRIAGE_OPTIONS[0].value)
  const [quickComplaint, setQuickComplaint] = useState('')

  const existingPatient = patients.find((patient) => patient.name.includes('Sutrisno')) ?? patients[1] ?? patients[0]
  const availableBeds = beds.filter((bed) => bed.status === 'available')
  const occupiedCount = beds.filter((bed) => bed.status === 'occupied').length
  const cleaningCount = beds.filter((bed) => bed.status === 'cleaning').length
  const nextRegistrationNumber = `IGD-2604-${String(patients.length + 1).padStart(3, '0')}`
  const quickTriageMeta = QUICK_TRIAGE_OPTIONS.find((item) => item.value === quickCondition) ?? QUICK_TRIAGE_OPTIONS[0]

  const zoneStats = useMemo(
    () =>
      ['Resusitasi', 'Observasi', 'Treatment'].map((zone) => {
        const zoneBeds = beds.filter((bed) => bed.zone === zone)
        const available = zoneBeds.filter((bed) => bed.status === 'available').length

        return {
          zone,
          total: zoneBeds.length,
          available,
          occupiedRatio: zoneBeds.length === 0 ? 0 : ((zoneBeds.length - available) / zoneBeds.length) * 100
        }
      }),
    [beds]
  )

  const bedOptions = availableBeds.map((bed) => ({
    label: `${bed.code} (${bed.zone} — kosong)`,
    value: bed.code
  }))

  const applyExistingPatient = () => {
    updateRegistrationDraft({
      hasMedicalRecord: true,
      medicalRecordNumber: existingPatient.medicalRecordNumber ?? '',
      name: existingPatient.name,
      paymentLabel: existingPatient.paymentLabel,
      arrivalSource: existingPatient.arrivalSource
    })
    setQuickComplaint(existingPatient.complaint)
    setGender(existingPatient.ageLabel.includes('P') ? 'P' : 'L')
  }

  const handleRegisterModeChange = (nextMode: string) => {
    const mode = nextMode as RegisterMode
    setRegisterMode(mode)

    if (mode === 'existing') {
      applyExistingPatient()
      return
    }

    updateRegistrationDraft({
      hasMedicalRecord: mode !== 'temporary',
      medicalRecordNumber: '',
      name: '',
      paymentLabel: mode === 'temporary' ? 'Umum' : registrationDraft.paymentLabel,
      arrivalSource: registrationDraft.arrivalSource
    })

    if (mode === 'temporary') {
      setEstimatedAge('~45')
      setGender('?')
    } else {
      setGender('L')
    }
  }

  const derivedAgeLabel =
    registerMode === 'temporary'
      ? `${estimatedAge || '~45'} ${gender}`
      : `${calculateAgeYears(birthDate) || '0'} ${gender}`

  const canSubmit =
    quickComplaint.trim().length > 0 &&
    (registerMode === 'temporary' ? estimatedAge.trim().length > 0 : registrationDraft.name.trim().length > 0)

  const handleSubmit = (openTriaseAfterSave: boolean) => {
    if (!canSubmit) return

    const createdPatientId = submitRegistration({
      hasMedicalRecord: registerMode !== 'temporary',
      medicalRecordNumber: registerMode === 'existing' ? registrationDraft.medicalRecordNumber : undefined,
      name: registerMode === 'temporary' ? registrationDraft.name.trim() || 'TIDAK DIKENAL' : registrationDraft.name,
      ageLabel: derivedAgeLabel,
      complaint: quickComplaint,
      paymentLabel: registrationDraft.paymentLabel,
      arrivalSource: registrationDraft.arrivalSource
    })

    if (selectedBedCode) {
      assignBed({ patientId: createdPatientId, bedCode: selectedBedCode })
    }

    if (openTriaseAfterSave) {
      onOpenTriase?.()
      return
    }

    onDone?.()
  }

  return (
    <div className="igd-parity-scope flex flex-col gap-[16px]">
      <DesktopPageHeader
        eyebrow="Modul IGD"
        title="Registrasi Pasien IGD"
        subtitle="Form intake awal dengan struktur registrasi, triase cepat, dan snapshot ketersediaan bed seperti pada mock operasional IGD."
        status="Draft lokal"
        metadata={<DesktopBadge tone="accent">Tanpa API backend</DesktopBadge>}
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
              <DesktopTag tone="neutral">RM AUTO</DesktopTag>
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
                <DesktopInputGroupField
                  label="Cari Pasien"
                  required
                  addon="Cari"
                  placeholder="Nama, NIK, atau No. RM…"
                  value={existingSearch}
                  onChange={(value) => {
                    setExistingSearch(value)
                    applyExistingPatient()
                  }}
                />
              </div>
            ) : null}

            {registerMode === 'temporary' ? (
              <DesktopNoticePanel
                tone="violet"
                title="Pasien Tidak Dikenal"
                description="ID sementara otomatis (cth: IGD-2026-0001). Dapat di-merge ke pasien asli setelah teridentifikasi."
              />
            ) : null}

            <DesktopFormSection title="A. Identitas Pasien">
              <div className="igd-form-grid-3">
                {registerMode !== 'temporary' ? (
                  <DesktopInputGroupField
                    label="NIK"
                    addon="NIK"
                    placeholder="16 digit"
                    value={nik}
                    onChange={setNik}
                    mono
                  />
                ) : null}

                <div className="md:col-span-2">
                  <DesktopInputField
                    label={`Nama${registerMode === 'temporary' ? ' (opsional)' : ''}`}
                    required={registerMode !== 'temporary'}
                    placeholder={
                      registerMode === 'temporary' ? 'Kosongkan jika tidak diketahui' : 'Nama lengkap sesuai KTP'
                    }
                    value={registrationDraft.name}
                    onChange={(value) => updateRegistrationDraft({ name: value })}
                  />
                </div>

                {registerMode !== 'temporary' ? (
                  <>
                    <DesktopInputField
                      label="Tgl. Lahir"
                      required
                      type="input"
                      value={birthDate}
                      onChange={setBirthDate}
                    />
                    <div className="desktop-input-field flex flex-col gap-[var(--ds-space-xs)]">
                      <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                        Jenis Kelamin <span className="ml-[2px] text-[var(--ds-color-danger)]">*</span>
                      </div>
                      <DesktopSegmentedControl value={gender} options={GENDER_OPTIONS} onChange={(value) => setGender(value as GenderMode)} />
                    </div>
                    <DesktopInputGroupField
                      label="No. Telepon"
                      addon="+62"
                      placeholder="812 xxxx xxxx"
                      value={phone}
                      onChange={setPhone}
                      mono
                    />
                  </>
                ) : (
                  <>
                    <div className="desktop-input-field flex flex-col gap-[var(--ds-space-xs)]">
                      <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                        Estimasi Umur
                      </div>
                      <div className="flex items-center gap-[8px]">
                        <div className="flex-1">
                          <DesktopInput
                            placeholder="~45"
                            value={estimatedAge}
                            onChange={setEstimatedAge}
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
                        value={gender}
                        options={TEMP_GENDER_OPTIONS}
                        onChange={(value) => setGender(value as GenderMode)}
                      />
                    </div>
                  </>
                )}
              </div>
            </DesktopFormSection>

            <DesktopFormSection title="B. Data Kunjungan IGD" divided>
              <div className="igd-form-grid-3">
                <DesktopInputField
                  label="No. Rawat"
                  required
                  value={nextRegistrationNumber}
                  disabled
                  hint="Otomatis dihasilkan"
                  className="font-mono"
                />
                <DesktopInputField
                  label="Waktu Datang"
                  required
                  value={arrivalDateTime}
                  onChange={setArrivalDateTime}
                />
                <DesktopInputField label="Jenis Kunjungan" value="IGD" disabled />

                <div className="desktop-input-field md:col-span-3 flex flex-col gap-[var(--ds-space-xs)]">
                  <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                    Sumber Pasien <span className="ml-[2px] text-[var(--ds-color-danger)]">*</span>
                  </div>
                  <div className="igd-inline-segment-tight">
                    <DesktopSegmentedControl
                      value={registrationDraft.arrivalSource}
                      options={ARRIVAL_OPTIONS}
                      onChange={(value) => updateRegistrationDraft({ arrivalSource: value })}
                    />
                  </div>
                </div>

                {registrationDraft.arrivalSource === 'Rujukan' ? (
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
                  placeholder="— Pilih bed —"
                  value={selectedBedCode}
                  options={bedOptions}
                  onChange={setSelectedBedCode}
                  hint={`${availableBeds.length} bed tersedia`}
                />

                <div className="desktop-input-field flex flex-col gap-[var(--ds-space-xs)]">
                  <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                    Penjamin Biaya
                  </div>
                  <DesktopSegmentedControl
                    value={registrationDraft.paymentLabel}
                    options={PAYMENT_OPTIONS}
                    onChange={(value) => updateRegistrationDraft({ paymentLabel: value })}
                  />
                </div>
              </div>
            </DesktopFormSection>

            <DesktopFormSection
              title="C. Penanggung Jawab"
              subtitle="(opsional — dapat diisi nanti)"
              divided
            >
              <div className="igd-form-grid-3">
                <div className="md:col-span-2">
                  <DesktopInputField
                    label="Nama Penanggung Jawab"
                    placeholder="Nama lengkap…"
                    value={guarantorName}
                    onChange={setGuarantorName}
                  />
                </div>
                <DesktopInputField
                  label="Hubungan"
                  type="select"
                  value={relationship}
                  options={RELATIONSHIP_OPTIONS}
                  onChange={setRelationship}
                />
                <DesktopInputField
                  label="No. KTP PJ"
                  placeholder="16 digit NIK"
                  value={guarantorKtp}
                  onChange={setGuarantorKtp}
                  className="font-mono"
                />
                <div className="md:col-span-2">
                  <DesktopInputGroupField
                    label="No. Telepon PJ"
                    addon="+62"
                    placeholder="812 xxxx xxxx"
                    value={guarantorPhone}
                    onChange={setGuarantorPhone}
                    mono
                  />
                </div>
              </div>
            </DesktopFormSection>

            <div className="igd-registrasi-actions">
              <DesktopButton emphasis="ghost" onClick={onDone}>
                Batal
              </DesktopButton>
              <DesktopButton emphasis="toolbar" onClick={() => handleSubmit(false)} disabled={!canSubmit}>
                Simpan - Triase Nanti
              </DesktopButton>
              <DesktopButton emphasis="primary" onClick={() => handleSubmit(true)} disabled={!canSubmit}>
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
              <DesktopInputField
                label="Keluhan Singkat"
                type="textarea"
                rows={3}
                placeholder="Deskripsikan keluhan utama…"
                value={quickComplaint}
                onChange={setQuickComplaint}
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
        </div>
      </div>
    </div>
  )
}

export default function IgdRegistrasiRoute() {
  const navigate = useNavigate()

  return (
    <IgdRegistrasiPage
      onDone={() => navigate(IGD_PAGE_PATHS.daftar)}
      onOpenTriase={() => navigate(IGD_PAGE_PATHS.triase)}
    />
  )
}
