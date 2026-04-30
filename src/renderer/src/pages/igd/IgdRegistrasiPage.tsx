import { Modal } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import type { PatientAttributes } from 'simrs-types'
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
import { DesktopPropertyGrid } from '../../components/design-system/molecules/DesktopPropertyGrid'
import { DesktopSegmentedControl } from '../../components/design-system/molecules/DesktopSegmentedControl'
import { DesktopPageHeader } from '../../components/design-system/organisms/DesktopPageHeader'
import {
  buildIgdRegistrationCommand,
  getDefaultGuarantorSource,
  getExistingPatientRelatedPersons,
  getSelectedExistingGuarantor,
  type IgdDashboard,
  type IgdGuarantorSource,
  type IgdPaymentMethod,
  type IgdRegistrationDraft,
  type IgdRegistrationMode
} from './igd.data'
import {
  filterAvailableBedsForTriage,
  getAllowedBedZonesForTriage,
  IGD_BED_ZONE_ORDER
} from './igd.bed-zoning'
import {
  DEFAULT_IGD_QUICK_TRIAGE_CONDITION,
  getQuickTriageMeta,
  IGD_QUICK_TRIAGE_OPTIONS
} from './igd.quick-triage'
import { getIgdTriageLevelMeta } from './igd.triage-level'

type IgdMitraOption = {
  label: string
  value: string
}

type IgdMitraOptionsByPaymentMethod = Partial<
  Record<Exclude<IgdPaymentMethod, 'Umum'>, IgdMitraOption[]>
>

type IgdRegistrasiPageProps = {
  dashboard: IgdDashboard
  selectedExistingPatient?: PatientAttributes
  onSelectExistingPatient?: (patient?: PatientAttributes) => void
  lookupSelectorSlot?: React.ReactNode
  mitraOptionsByPaymentMethod?: IgdMitraOptionsByPaymentMethod
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

const formatExistingPatientGender = (gender: unknown) => {
  if (gender === 'male' || gender === 'L') return 'Laki-laki'
  if (gender === 'female' || gender === 'P') return 'Perempuan'
  if (typeof gender === 'string' && gender.trim()) return gender
  return '-'
}

const formatExistingPatientBirthDate = (birthDate: unknown) => {
  if (typeof birthDate !== 'string' || !birthDate.trim()) {
    return '-'
  }

  const age = calculateAgeYears(birthDate)
  return age ? `${birthDate} (${age} th)` : birthDate
}

const getPatientText = (patient: PatientAttributes | undefined, key: string) => {
  const value = (patient as Record<string, unknown> | undefined)?.[key]
  return typeof value === 'string' && value.trim() ? value : '-'
}

function createInitialDraft(): IgdRegistrationDraft {
  return {
    name: '',
    nik: '',
    birthDate: '',
    gender: 'L',
    religion: '',
    phone: '',
    estimatedAge: '~45',
    arrivalDateTime: getTodayDateTimeLocal(),
    arrivalSource: 'Datang sendiri',
    paymentMethod: 'Umum',
    mitraId: undefined,
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
  mitraOptionsByPaymentMethod = {},
  initialMode = 'baru',
  submitting = false,
  onDone,
  onSubmitRegistration
}: IgdRegistrasiPageProps) {
  const [registerMode, setRegisterMode] = useState<IgdRegistrationMode>(initialMode)
  const [draft, setDraft] = useState<IgdRegistrationDraft>(createInitialDraft)
  const [referralFacility, setReferralFacility] = useState('')
  const [selectedBedCode, setSelectedBedCode] = useState('')
  const [quickCondition, setQuickCondition] = useState(DEFAULT_IGD_QUICK_TRIAGE_CONDITION)
  const [guarantorSource, setGuarantorSource] = useState<IgdGuarantorSource>('new')
  const [patientLookupModalOpen, setPatientLookupModalOpen] = useState(false)

  const allAvailableBeds = dashboard.beds.filter((bed) => bed.status === 'available')
  const occupiedCount = dashboard.beds.filter((bed) => bed.status === 'occupied').length
  const cleaningCount = dashboard.beds.filter((bed) => bed.status === 'cleaning').length
  const quickTriageMeta = getQuickTriageMeta(quickCondition)
  const activeTriageLevel = quickTriageMeta.level
  const allowedZones = useMemo(
    () => getAllowedBedZonesForTriage(activeTriageLevel),
    [activeTriageLevel]
  )
  const availableBeds = useMemo(
    () => filterAvailableBedsForTriage(dashboard.beds, activeTriageLevel),
    [dashboard.beds, activeTriageLevel]
  )
  const existingRelatedPersons = useMemo(
    () => getExistingPatientRelatedPersons(selectedExistingPatient),
    [selectedExistingPatient]
  )
  const selectedExistingGuarantor = useMemo(
    () => getSelectedExistingGuarantor(selectedExistingPatient, guarantorSource),
    [selectedExistingPatient, guarantorSource]
  )
  const selectedExistingPatientInfoItems = useMemo(
    () => [
      {
        label: 'No. RM',
        value: selectedExistingPatient?.medicalRecordNumber || '-',
        mono: true
      },
      { label: 'NIK', value: getPatientText(selectedExistingPatient, 'nik'), mono: true },
      {
        label: 'Tgl. Lahir',
        value: formatExistingPatientBirthDate(selectedExistingPatient?.birthDate)
      },
      {
        label: 'Jenis Kelamin',
        value: formatExistingPatientGender(selectedExistingPatient?.gender)
      },
      { label: 'Telepon', value: getPatientText(selectedExistingPatient, 'phone'), mono: true },
      { label: 'Alamat', value: getPatientText(selectedExistingPatient, 'address') }
    ],
    [selectedExistingPatient]
  )
  const guarantorFieldValues = selectedExistingGuarantor
    ? {
        name: selectedExistingGuarantor.name,
        relationship: selectedExistingGuarantor.relationship,
        nik: '',
        phone: selectedExistingGuarantor.phone
      }
    : {
        name: draft.guarantorName,
        relationship: draft.guarantorRelationship,
        nik: draft.guarantorNik,
        phone: draft.guarantorPhone
      }
  const isUsingExistingGuarantor = !!selectedExistingGuarantor
  const guarantorSourceOptions = useMemo(
    () => [
      ...existingRelatedPersons.map((person, index) => ({
        label: `${person.name || 'Tanpa Nama'}${person.relationship ? ` · ${person.relationship}` : ''}`,
        value: `existing:${index}`
      })),
      { label: 'Buat Baru', value: 'new' }
    ],
    [existingRelatedPersons]
  )

  const zoneStats = useMemo(
    () =>
      IGD_BED_ZONE_ORDER.map((zone) => {
        const zoneBeds = dashboard.beds.filter((bed) => bed.zone === zone)
        const available = zoneBeds.filter((bed) => bed.status === 'available').length

        return {
          zone,
          total: zoneBeds.length,
          available,
          occupiedRatio:
            zoneBeds.length === 0 ? 0 : ((zoneBeds.length - available) / zoneBeds.length) * 100
        }
      }),
    [dashboard.beds]
  )

  const bedOptions = useMemo(
    () =>
      availableBeds.map((bed) => ({
        label: `${bed.code} (${bed.zone} — kosong)`,
        value: bed.code
      })),
    [availableBeds]
  )

  const isBedSelectionLocked = allowedZones.length === 0
  const bedFieldHint = isBedSelectionLocked
    ? 'Pilih level triase terlebih dahulu untuk melihat bed yang sesuai.'
    : bedOptions.length === 0
      ? 'Tidak ada bed kosong yang sesuai dengan level triase ini.'
      : `Bed yang tersedia: ${allowedZones.join(', ')}. Snapshot bed ini tidak mengikat assignment backend pada fase registrasi.`
  const selectedPaymentNeedsMitra = draft.paymentMethod !== 'Umum'
  const selectedMitraOptions = useMemo(
    () =>
      selectedPaymentNeedsMitra
        ? (mitraOptionsByPaymentMethod[
            draft.paymentMethod as Exclude<IgdPaymentMethod, 'Umum'>
          ] ?? [])
        : [],
    [draft.paymentMethod, mitraOptionsByPaymentMethod, selectedPaymentNeedsMitra]
  )
  const mitraFieldHint = !selectedPaymentNeedsMitra
    ? 'Mitra tidak diperlukan untuk pembayaran umum/tunai.'
    : selectedMitraOptions.length === 0
      ? 'Data mitra aktif belum tersedia untuk metode pembayaran ini.'
      : 'Pilih mitra penjamin sesuai metode pembayaran pasien.'

  const derivedAgeLabel =
    registerMode === 'temporary'
      ? `${draft.estimatedAge || '~45'} ${draft.gender}`
      : `${calculateAgeYears(draft.birthDate) || '0'} ${draft.gender}`

  const canSubmit =
    draft.complaint.trim().length > 0 &&
    (!selectedPaymentNeedsMitra || !!draft.mitraId) &&
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

  useEffect(() => {
    if (!selectedBedCode) {
      return
    }

    const isSelectedBedStillAllowed = bedOptions.some((option) => option.value === selectedBedCode)

    if (!isSelectedBedStillAllowed) {
      setSelectedBedCode('')
    }
  }, [bedOptions, selectedBedCode])

  useEffect(() => {
    if (selectedPaymentNeedsMitra) {
      return
    }

    setDraft((current) =>
      current.mitraId
        ? {
            ...current,
            mitraId: undefined
          }
        : current
    )
  }, [selectedPaymentNeedsMitra])

  useEffect(() => {
    if (!selectedPaymentNeedsMitra || !draft.mitraId) {
      return
    }

    const selectedMitraStillExists = selectedMitraOptions.some(
      (option) => option.value === draft.mitraId
    )
    if (!selectedMitraStillExists) {
      setDraft((current) => ({
        ...current,
        mitraId: undefined
      }))
    }
  }, [draft.mitraId, selectedMitraOptions, selectedPaymentNeedsMitra])

  useEffect(() => {
    if (registerMode !== 'existing') {
      setGuarantorSource('new')
      return
    }

    setGuarantorSource(getDefaultGuarantorSource(selectedExistingPatient))
  }, [registerMode, selectedExistingPatient])

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
        selectedPatient: selectedExistingPatient,
        guarantorSource,
        intent,
        quickCondition
      }),
      intent
    })
  }

  return (
    <div className="igd-parity-scope flex flex-col gap-4">
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
              <div className="igd-existing-patient-summary rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[14px] py-[12px]">
                {selectedExistingPatient ? (
                  <div className="grid gap-[12px]">
                    <div className="flex flex-wrap items-start justify-between gap-[12px]">
                      <div className="min-w-0">
                        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                          Pasien Terdaftar
                        </div>
                        <div className="mt-[3px] truncate text-[16px] font-bold text-[var(--ds-color-text)]">
                          {selectedExistingPatient.name || '-'}
                        </div>
                      </div>
                      <DesktopButton
                        emphasis="toolbar"
                        size="small"
                        onClick={() => setPatientLookupModalOpen(true)}
                      >
                        Ganti Pasien
                      </DesktopButton>
                    </div>
                    <DesktopPropertyGrid items={selectedExistingPatientInfoItems} columns={3} />
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-[12px]">
                    <DesktopNoticePanel
                      title="Belum ada pasien terdaftar dipilih"
                      description="Pilih pasien dari data rekam medis sebelum menyimpan registrasi existing."
                    />
                    <DesktopButton
                      emphasis="primary"
                      size="small"
                      onClick={() => setPatientLookupModalOpen(true)}
                    >
                      Pilih Pasien
                    </DesktopButton>
                  </div>
                )}
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
                      type="date"
                      value={draft.birthDate}
                      onChange={(value) => updateDraft({ birthDate: value })}
                    />

                    <div className="desktop-input-field flex flex-col gap-[var(--ds-space-xs)]">
                      <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                        Jenis Kelamin{' '}
                        <span className="ml-[2px] text-[var(--ds-color-danger)]">*</span>
                      </div>
                      <DesktopSegmentedControl
                        value={draft.gender}
                        options={GENDER_OPTIONS}
                        onChange={(value) =>
                          updateDraft({ gender: value as IgdRegistrationDraft['gender'] })
                        }
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

                    <DesktopInputField
                      label="Agama"
                      placeholder="Opsional"
                      value={draft.religion}
                      onChange={(value) => updateDraft({ religion: value })}
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
                        <span className="text-[12px] text-[var(--ds-color-text-subtle)]">
                          tahun
                        </span>
                      </div>
                    </div>

                    <div className="desktop-input-field flex flex-col gap-[var(--ds-space-xs)]">
                      <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                        Jenis Kelamin
                      </div>
                      <DesktopSegmentedControl
                        value={draft.gender}
                        options={TEMP_GENDER_OPTIONS}
                        onChange={(value) =>
                          updateDraft({ gender: value as IgdRegistrationDraft['gender'] })
                        }
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
                  type="datetime-local"
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
                        updateDraft({
                          arrivalSource: value as IgdRegistrationDraft['arrivalSource']
                        })
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
                  placeholder={
                    isBedSelectionLocked
                      ? 'Pilih level triase dulu'
                      : bedOptions.length === 0
                        ? 'Tidak ada bed sesuai triase'
                        : 'Pilih bed sesuai triase'
                  }
                  value={selectedBedCode}
                  options={bedOptions}
                  onChange={setSelectedBedCode}
                  disabled={isBedSelectionLocked}
                  hint={bedFieldHint}
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

                {selectedPaymentNeedsMitra ? (
                  <DesktopInputField
                    label="Mitra Penjamin"
                    required
                    type="select"
                    placeholder={
                      selectedMitraOptions.length === 0 ? 'Mitra tidak tersedia' : 'Pilih mitra'
                    }
                    value={draft.mitraId}
                    options={selectedMitraOptions}
                    onChange={(value) => updateDraft({ mitraId: value || undefined })}
                    hint={mitraFieldHint}
                    disabled={selectedMitraOptions.length === 0}
                    allowClear
                  />
                ) : null}

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

            <DesktopFormSection
              title="C. Penanggung Jawab"
              subtitle="(opsional — dapat diisi nanti)"
              divided
            >
              <div className="igd-form-grid-3">
                {registerMode === 'existing' &&
                selectedExistingPatient &&
                existingRelatedPersons.length > 0 ? (
                  <div className="md:col-span-3">
                    <DesktopInputField
                      label="Sumber Penanggung Jawab"
                      type="select"
                      value={guarantorSource}
                      options={guarantorSourceOptions}
                      onChange={(value) => setGuarantorSource(value as IgdGuarantorSource)}
                      hint="Pilih related person pasien yang akan dijadikan penanggung jawab, atau buat data baru."
                    />
                  </div>
                ) : null}
                <div className="md:col-span-2">
                  <DesktopInputField
                    label="Nama Penanggung Jawab"
                    placeholder="Nama lengkap…"
                    value={guarantorFieldValues.name}
                    onChange={(value) => updateDraft({ guarantorName: value })}
                    disabled={isUsingExistingGuarantor}
                  />
                </div>
                <DesktopInputField
                  label="Hubungan"
                  type="select"
                  value={guarantorFieldValues.relationship}
                  options={RELATIONSHIP_OPTIONS}
                  onChange={(value) => updateDraft({ guarantorRelationship: value })}
                  disabled={isUsingExistingGuarantor}
                />
                <DesktopInputField
                  label="No. KTP PJ"
                  placeholder="16 digit NIK"
                  value={guarantorFieldValues.nik}
                  onChange={(value) => updateDraft({ guarantorNik: value })}
                  className="font-mono"
                  disabled={isUsingExistingGuarantor}
                  hint={
                    isUsingExistingGuarantor
                      ? 'Data existing belum menyimpan NIK penanggung jawab.'
                      : undefined
                  }
                />
                <div className="md:col-span-2">
                  <DesktopInputGroupField
                    label="No. Telepon PJ"
                    addon="+62"
                    placeholder="812 xxxx xxxx"
                    value={guarantorFieldValues.phone}
                    onChange={(value) => updateDraft({ guarantorPhone: value })}
                    mono
                    disabled={isUsingExistingGuarantor}
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
                options={IGD_QUICK_TRIAGE_OPTIONS.map((item) => ({
                  label: item.label,
                  value: item.value
                }))}
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
                      background: getIgdTriageLevelMeta(quickTriageMeta.level).badgeStyle.backgroundColor,
                      border: `1px solid ${getIgdTriageLevelMeta(quickTriageMeta.level).badgeStyle.borderColor}`,
                      color: getIgdTriageLevelMeta(quickTriageMeta.level).badgeStyle.color
                    }}
                  >
                    {getIgdTriageLevelMeta(quickTriageMeta.level).label}
                  </div>
                }
              />
              <DesktopNoticePanel
                title="Quick triage awal ikut dikirim saat registrasi triase"
                description="Level triase final tetap bisa diperbarui lagi di workflow triase lengkap setelah pasien masuk IGD."
              />
            </div>
          </DesktopCard>

          <DesktopCard title="Ketersediaan Bed IGD">
            <div>
              <div className="igd-bed-availability-grid">
                <DesktopMetricTile
                  label="Tersedia"
                  value={String(allAvailableBeds.length)}
                  tone="success"
                />
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

      <Modal
        title="Pilih Pasien Terdaftar"
        open={patientLookupModalOpen}
        onCancel={() => setPatientLookupModalOpen(false)}
        footer={null}
        width={1100}
        destroyOnHidden
      >
        {lookupSelectorSlot === undefined ||
        lookupSelectorSlot === null ||
        typeof lookupSelectorSlot === 'bigint' ? null : (
          <>{lookupSelectorSlot}</>
        )}
      </Modal>
    </div>
  )
}
