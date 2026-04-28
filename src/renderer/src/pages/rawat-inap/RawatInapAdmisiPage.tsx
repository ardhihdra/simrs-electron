import {
  ArrowLeftOutlined,
  CheckOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  RightOutlined,
  SearchOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import type { CreateRawatInapAdmissionInput } from '@main/rpc/procedure/rawat-inap-admission'
import { DatePicker, Form, Modal, Select } from 'antd'
import React, { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PatientAttributes } from 'simrs-types'

import { DesktopBadge } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import PatientInsurancePickerField from '../../components/organisms/visit-management/PatientInsurancePickerField'
import type {
  SourceEncounterLookupRow,
  SourceEncounterLookupType
} from '../../components/organisms/rawat-inap/igd-encounter-lookup'
import {
  buildRawatInapAdmissionCommand,
  createDefaultRawatInapAdmissionForm,
  createRawatInapAdmissionBedOptions,
  createRawatInapAdmissionClassOptions,
  createRawatInapAdmissionFormPatchFromPatient,
  normalizeRawatInapClassCode,
  type RawatInapAdmissionBedOption,
  type RawatInapAdmissionDiagnosisOption,
  type RawatInapAdmissionFormState,
  type RawatInapAdmissionMitraOption,
  type RawatInapAdmissionPractitionerOption
} from './rawat-inap.admisi'
import type { RawatInapBedMapSnapshot } from './rawat-inap.state'

void React

const PatientLookupSelector = React.lazy(
  () => import('../../components/organisms/patient/PatientLookupSelector')
)

const IgdEncounterLookupSelector = React.lazy(
  () => import('../../components/organisms/rawat-inap/IgdEncounterLookupSelector')
)

type AdmissionSource = 'rajal' | 'igd' | 'rujukan'

type SourceEncounterConfig = {
  type: SourceEncounterLookupType
  label: string
  fieldLabel: string
}

const REFERRAL_ENCOUNTER_FIELD = {
  fieldLabel: 'Encounter Rujukan Luar',
  value: 'Tidak ada encounter asal'
}

const SOURCE_ENCOUNTER_CONFIG: Partial<Record<AdmissionSource, SourceEncounterConfig>> = {
  igd: {
    type: 'EMER',
    label: 'IGD',
    fieldLabel: 'Encounter IGD Asal'
  },
  rajal: {
    type: 'AMB',
    label: 'Rawat Jalan',
    fieldLabel: 'Encounter Rawat Jalan Asal'
  }
}

type RawatInapAdmisiPageProps = {
  onBack?: () => void
  onCancel?: () => void
  onSubmit?: (command: CreateRawatInapAdmissionInput) => void
  bedMapSnapshot?: RawatInapBedMapSnapshot | null
  isSubmitting?: boolean
  mitraOptionsByPaymentMethod?: Partial<
    Record<Exclude<RawatInapAdmissionFormState['paymentMethod'], 'cash'>, RawatInapAdmissionMitraOption[]>
  >
  diagnosisOptions?: RawatInapAdmissionDiagnosisOption[]
  practitionerOptions?: RawatInapAdmissionPractitionerOption[]
  isDiagnosisLoading?: boolean
  isPractitionerLoading?: boolean
  onDiagnosisSearch?: (query: string) => void
  initialForm?: Partial<RawatInapAdmissionFormState>
}

const ADMISSION_SOURCES: Array<{
  key: AdmissionSource
  icon: ReactNode
  label: string
  subtitle: string
}> = [
  {
    key: 'rajal',
    icon: <MedicineBoxOutlined />,
    label: 'Rawat Jalan',
    subtitle: 'Rujukan dari poli / dokter'
  },
  {
    key: 'igd',
    icon: <HeartOutlined />,
    label: 'IGD',
    subtitle: 'Transfer dari instalasi gawat darurat'
  },
  {
    key: 'rujukan',
    icon: <RightOutlined />,
    label: 'Rujukan Luar',
    subtitle: 'RS / puskesmas eksternal'
  }
]

const INPUT_CLASSNAME =
  'h-[32px] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[10px] text-[12px] text-[var(--ds-color-text)] outline-none transition-colors focus:border-[var(--ds-color-accent)] focus:shadow-[0_0_0_3px_var(--ds-color-accent-soft)]'

const PAYMENT_LABELS: Record<RawatInapAdmissionFormState['paymentMethod'], string> = {
  bpjs: 'BPJS',
  cash: 'Umum / Tunai',
  asuransi: 'Asuransi',
  company: 'Perusahaan'
}

function AdmissionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)]">
      <div className="flex min-h-[42px] items-center border-b border-[var(--ds-color-border)] px-[14px]">
        <h3 className="m-0 text-[13px] font-semibold text-[var(--ds-color-text)]">{title}</h3>
      </div>
      <div className="p-[14px]">{children}</div>
    </section>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-[6px] block text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--ds-color-text-subtle)]">
      {children}
    </label>
  )
}

function TextInput({
  defaultValue,
  value,
  onChange,
  className = '',
  type = 'text',
  disabled = false
}: {
  defaultValue: string
  value?: string
  onChange?: (value: string) => void
  className?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      defaultValue={value === undefined ? defaultValue : undefined}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.value)}
      className={`${INPUT_CLASSNAME} ${className}`.trim()}
    />
  )
}

function SelectBox({
  className = '',
  children,
  value,
  onChange,
  disabled = false
}: {
  className?: string
  children: ReactNode
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
}) {
  return (
    <select
      className={`${INPUT_CLASSNAME} ${className}`.trim()}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.value)}
    >
      {children}
    </select>
  )
}

const formatBedOptionLabel = (option: RawatInapAdmissionBedOption) => {
  return `${option.roomName} - ${option.bedName}`
}

export function RawatInapAdmisiPage({
  onBack,
  onCancel,
  onSubmit,
  bedMapSnapshot,
  isSubmitting = false,
  mitraOptionsByPaymentMethod = {},
  diagnosisOptions = [],
  practitionerOptions = [],
  isDiagnosisLoading = false,
  isPractitionerLoading = false,
  onDiagnosisSearch,
  initialForm
}: RawatInapAdmisiPageProps) {
  const [insuranceForm] = Form.useForm()
  const bedOptions = useMemo(
    () => createRawatInapAdmissionBedOptions(bedMapSnapshot),
    [bedMapSnapshot]
  )
  const classOptions = useMemo(
    () => createRawatInapAdmissionClassOptions(bedOptions),
    [bedOptions]
  )
  const [form, setForm] = useState<RawatInapAdmissionFormState>(() => ({
    ...createDefaultRawatInapAdmissionForm(),
    ...initialForm,
    selectedClassOfCareCodeId:
      initialForm?.selectedClassOfCareCodeId ?? bedOptions[0]?.classOfCareCodeId ?? '',
    selectedBedId:
      initialForm?.selectedBedId ??
      bedOptions.find(
        (option) =>
          normalizeRawatInapClassCode(option.classOfCareCodeId) ===
          normalizeRawatInapClassCode(initialForm?.selectedClassOfCareCodeId)
      )?.bedId ??
      bedOptions[0]?.bedId ??
      ''
  }))
  const [submitError, setSubmitError] = useState('')
  const [isPatientLookupOpen, setIsPatientLookupOpen] = useState(false)
  const [isSourceEncounterLookupOpen, setIsSourceEncounterLookupOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientAttributes | undefined>()
  const [selectedSourceEncounter, setSelectedSourceEncounter] = useState<
    SourceEncounterLookupRow | undefined
  >()

  const watchedPatientInsuranceId = Form.useWatch('patientInsuranceId', insuranceForm)
  const watchedMitraCodeNumber = Form.useWatch('mitraCodeNumber', insuranceForm)
  const watchedMitraId = Form.useWatch('mitraId', insuranceForm)

  const paymentNeedsPenjaminData = form.paymentMethod !== 'cash'
  const selectedMitraOptions = paymentNeedsPenjaminData
    ? (mitraOptionsByPaymentMethod[
        form.paymentMethod as Exclude<RawatInapAdmissionFormState['paymentMethod'], 'cash'>
      ] ?? [])
    : []
  const showBpjsVerification = form.paymentMethod === 'bpjs'
  const sourceEncounterConfig = SOURCE_ENCOUNTER_CONFIG[form.source]
  const diagnosisSelectOptions = useMemo(
    () =>
      diagnosisOptions.map((option) => ({
        value: option.value,
        label: option.label
      })),
    [diagnosisOptions]
  )
  const selectedClassOfCareCodeId =
    form.selectedClassOfCareCodeId || classOptions[0]?.value || ''
  const filteredBedOptions = selectedClassOfCareCodeId
    ? bedOptions.filter(
        (option) =>
          normalizeRawatInapClassCode(option.classOfCareCodeId) === selectedClassOfCareCodeId
      )
    : bedOptions

  useEffect(() => {
    if (!selectedPatient) return
    setForm((current) => ({
      ...current,
      ...createRawatInapAdmissionFormPatchFromPatient(selectedPatient)
    }))
  }, [selectedPatient])

  useEffect(() => {
    setForm((current) => {
      const currentClass = normalizeRawatInapClassCode(current.selectedClassOfCareCodeId)
      const nextClass = classOptions.some((option) => option.value === currentClass)
        ? currentClass
        : classOptions[0]?.value ?? ''
      const nextBedOptions = nextClass
        ? bedOptions.filter(
            (option) => normalizeRawatInapClassCode(option.classOfCareCodeId) === nextClass
          )
        : bedOptions
      const nextBedId = nextBedOptions.some((option) => option.bedId === current.selectedBedId)
        ? current.selectedBedId
        : nextBedOptions[0]?.bedId ?? ''

      if (
        current.selectedClassOfCareCodeId === nextClass &&
        current.selectedBedId === nextBedId
      ) {
        return current
      }

      return {
        ...current,
        selectedClassOfCareCodeId: nextClass,
        selectedBedId: nextBedId
      }
    })
  }, [bedOptions, classOptions])

  useEffect(() => {
    if (paymentNeedsPenjaminData) return

    insuranceForm.resetFields()
    setForm((current) => ({
      ...current,
      patientInsuranceId: '',
      noKartu: ''
    }))
  }, [insuranceForm, paymentNeedsPenjaminData])

  useEffect(() => {
    setForm((current) => ({
      ...current,
      patientInsuranceId:
        watchedPatientInsuranceId === undefined || watchedPatientInsuranceId === null
          ? ''
          : String(watchedPatientInsuranceId),
      noKartu:
        watchedMitraCodeNumber === undefined || watchedMitraCodeNumber === null
          ? current.noKartu
          : String(watchedMitraCodeNumber)
    }))
  }, [watchedMitraCodeNumber, watchedPatientInsuranceId])

  const updateForm = (patch: Partial<RawatInapAdmissionFormState>) => {
    setSubmitError('')
    setForm((current) => ({
      ...current,
      ...patch
    }))
  }

  const selectedBed = bedOptions.find((option) => option.bedId === form.selectedBedId)

  const handleSourceChange = (source: AdmissionSource) => {
    const sourceSupportsEncounter = Boolean(SOURCE_ENCOUNTER_CONFIG[source])

    updateForm({
      source,
      sourceEncounterId:
        sourceSupportsEncounter && source === form.source ? form.sourceEncounterId : ''
    })

    if (!sourceSupportsEncounter || source !== form.source) {
      setSelectedSourceEncounter(undefined)
      setIsSourceEncounterLookupOpen(false)
    }
  }

  const handlePatientChange = (patient?: PatientAttributes) => {
    setSelectedPatient(patient)
    insuranceForm.resetFields()

    if (patient) {
      setIsPatientLookupOpen(false)
      setSubmitError('')
      return
    }

    setForm((current) => ({
      ...current,
      patientId: '',
      medicalRecordNumber: '',
      patientName: '',
      patientSummary: '',
      patientInsuranceId: '',
      noKartu: ''
    }))
  }

  const handleSourceEncounterChange = (encounter?: SourceEncounterLookupRow) => {
    setSelectedSourceEncounter(encounter)

    if (!encounter) {
      updateForm({ sourceEncounterId: '' })
      return
    }

    const encounterLabel = sourceEncounterConfig?.label ?? ''
    setIsSourceEncounterLookupOpen(false)
    setSubmitError('')
    updateForm({
      sourceEncounterId: encounter.id,
      patientId: encounter.patientId || form.patientId,
      medicalRecordNumber: encounter.patientMrNo !== '-' ? encounter.patientMrNo : form.medicalRecordNumber,
      patientName: encounter.patientName !== '-' ? encounter.patientName : form.patientName,
      patientSummary: [
        encounter.status ? `${encounterLabel} ${encounter.status}`.trim() : '',
        encounter.startTime ? new Date(encounter.startTime).toLocaleString('id-ID') : ''
      ]
        .filter(Boolean)
        .join(' - ')
    })
  }

  const handlePaymentMethodChange = (value: string) => {
    const paymentMethod = value as RawatInapAdmissionFormState['paymentMethod']
    insuranceForm.resetFields()
    updateForm({
      paymentMethod,
      patientInsuranceId: '',
      noKartu: paymentMethod === 'bpjs' ? form.noKartu : ''
    })
  }

  const handleDiagnosisChange = (value: string) => {
    const selectedDiagnosis = diagnosisOptions.find((option) => option.value === value)
    updateForm({
      diagnosisCode: selectedDiagnosis?.code ?? '',
      diagnosisText: selectedDiagnosis?.display ?? ''
    })
  }

  const handleClassOfCareChange = (value: string) => {
    const nextBed = bedOptions.find(
      (option) => normalizeRawatInapClassCode(option.classOfCareCodeId) === value
    )
    updateForm({
      selectedClassOfCareCodeId: value,
      selectedBedId: nextBed?.bedId ?? ''
    })
  }

  const handleSubmit = () => {
    try {
      const command = buildRawatInapAdmissionCommand(form, bedOptions)
      onSubmit?.(command)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Form admisi belum lengkap')
    }
  }

  return (
    <div className="rawat-inap-admisi-page flex flex-col gap-[14px]">
      <div className="flex flex-wrap items-start justify-between gap-[16px]">
        <div className="min-w-0 flex-1">
          <DesktopButton
            emphasis="ghost"
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            className="mb-[6px]"
          >
            Peta Bed
          </DesktopButton>
          <h1 className="m-0 text-[22px] font-bold tracking-[0] text-[var(--ds-color-text)]">
            Admisi Baru — Rawat Inap
          </h1>
          <div className="mt-[3px] text-[13px] text-[var(--ds-color-text-muted)]">
            Registrasi pasien masuk rawat inap - verifikasi BPJS & SEP - assign kamar
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-[8px]">
          <DesktopButton emphasis="ghost" onClick={onCancel}>
            Batal
          </DesktopButton>
          <DesktopButton
            emphasis="primary"
            icon={<CheckOutlined />}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Memproses...' : 'Simpan & Proses Admisi'}
          </DesktopButton>
        </div>
      </div>

      {submitError ? (
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)] bg-[color-mix(in_srgb,var(--ds-color-danger)_8%,white)] px-[12px] py-[9px] text-[12px] font-semibold text-[var(--ds-color-danger)]">
          {submitError}
        </div>
      ) : null}

      <div
        className="grid items-start gap-[14px]"
        style={{ gridTemplateColumns: '200px minmax(0, 1fr)' }}
      >
        <section className="overflow-hidden rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)]">
          <div className="border-b border-[var(--ds-color-border)] px-[14px] py-[10px]">
            <h3 className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
              Sumber Masuk
            </h3>
          </div>
          <div className="flex flex-col gap-[4px] p-[8px_10px]">
            {ADMISSION_SOURCES.map((item) => {
              const selected = form.source === item.key

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSourceChange(item.key)}
                  className="flex cursor-pointer flex-col gap-[3px] rounded-[var(--ds-radius-md)] px-[12px] py-[10px] text-left transition-colors"
                  style={{
                    background: selected
                      ? 'var(--ds-color-accent-soft)'
                      : 'var(--ds-color-surface-muted)',
                    border: `1px solid ${
                      selected ? 'var(--ds-color-accent)' : 'var(--ds-color-border)'
                    }`,
                    color: selected ? 'var(--ds-color-accent)' : 'var(--ds-color-text)'
                  }}
                >
                  <span className="flex items-center gap-[8px] text-[12.5px] font-semibold">
                    <span className="text-[13px]">{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="text-[10.5px] leading-[1.3] opacity-75">{item.subtitle}</span>
                </button>
              )
            })}
          </div>
        </section>

        <div className="flex flex-col gap-[14px]">
          <AdmissionCard title="Data Pasien">
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div>
                <FieldLabel>No. RM</FieldLabel>
                <TextInput
                  defaultValue="02-14-88-21"
                  value={form.medicalRecordNumber}
                  className="w-full font-mono"
                  disabled
                />
              </div>
              <div>
                <FieldLabel>Nama Pasien</FieldLabel>
                <TextInput
                  defaultValue="Budi Santoso"
                  value={form.patientName}
                  className="w-full"
                  disabled
                />
              </div>
              <div>
                <FieldLabel>Tgl Lahir / Usia</FieldLabel>
                <TextInput
                  defaultValue="12 Mar 1972 / 54 tahun"
                  value={form.patientSummary}
                  className="w-full"
                  disabled
                />
              </div>
              <div className="col-span-3 flex items-center gap-[16px] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-success)] bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] px-[12px] py-[10px] text-[11.5px]">
                <CheckOutlined className="text-[14px] text-[var(--ds-color-success)]" />
                <div className="min-w-0 flex-1">
                  <b className="text-[var(--ds-color-success)]">
                    {form.patientId ? 'Pasien ditemukan' : 'Cari pasien berdasarkan No. RM'}
                  </b>
                  <span className="ml-[8px] text-[var(--ds-color-text-muted)]">
                    {form.patientSummary || 'Gunakan tombol Pilih Pasien untuk menghubungkan patientId'}
                  </span>
                </div>
                <DesktopBadge tone="info">Penjamin: {PAYMENT_LABELS[form.paymentMethod]}</DesktopBadge>
                <DesktopButton
                  emphasis="primary"
                  size="small"
                  icon={<SearchOutlined />}
                  disabled={isSubmitting}
                  onClick={() => setIsPatientLookupOpen(true)}
                >
                  Pilih Pasien
                </DesktopButton>
              </div>
            </div>
          </AdmissionCard>

          <AdmissionCard title="Penjamin">
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div>
                <FieldLabel>Penjamin</FieldLabel>
                <SelectBox
                  className="w-full"
                  value={form.paymentMethod}
                  disabled={isSubmitting}
                  onChange={handlePaymentMethodChange}
                >
                  <option value="bpjs">BPJS</option>
                  <option value="cash">Umum / Tunai</option>
                  <option value="asuransi">Asuransi</option>
                  <option value="company">Perusahaan</option>
                </SelectBox>
              </div>
              <div>
                <FieldLabel>
                  {sourceEncounterConfig?.fieldLabel ?? REFERRAL_ENCOUNTER_FIELD.fieldLabel}
                </FieldLabel>
                {sourceEncounterConfig ? (
                  <div className="flex gap-[8px]">
                    <TextInput
                      defaultValue=""
                      value={
                        selectedSourceEncounter
                          ? `${selectedSourceEncounter.patientName} - ${selectedSourceEncounter.id}`
                          : form.sourceEncounterId
                      }
                      className="min-w-0 flex-1"
                      disabled
                    />
                    <DesktopButton
                      emphasis="primary"
                      size="small"
                      icon={<SearchOutlined />}
                      disabled={isSubmitting}
                      onClick={() => setIsSourceEncounterLookupOpen(true)}
                    >
                      Pilih Encounter
                    </DesktopButton>
                  </div>
                ) : (
                  <TextInput
                    defaultValue=""
                    value={REFERRAL_ENCOUNTER_FIELD.value}
                    className="w-full"
                    disabled
                  />
                )}
              </div>
              <div>
                <FieldLabel>Tanggal Masuk</FieldLabel>
                <TextInput
                  type="date"
                  defaultValue="2026-04-22"
                  value={form.admissionDate}
                  onChange={(value) => updateForm({ admissionDate: value })}
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>

              {paymentNeedsPenjaminData ? (
                <div className="col-span-3 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-[12px]">
                  <Form form={insuranceForm} layout="vertical">
                    <Form.Item name="patientInsuranceId" hidden>
                      <input />
                    </Form.Item>
                    <div className="grid gap-[12px]" style={{ gridTemplateColumns: '1fr 2fr 1fr' }}>
                      <Form.Item name="mitraId" label="Mitra Penjamin" className="m-0">
                        <Select
                          options={selectedMitraOptions}
                          disabled={isSubmitting || selectedMitraOptions.length === 0}
                          placeholder={
                            selectedMitraOptions.length === 0 ? 'Mitra tidak tersedia' : 'Pilih mitra'
                          }
                          showSearch
                          optionFilterProp="label"
                          onChange={() => insuranceForm.setFieldValue('patientInsuranceId', undefined)}
                        />
                      </Form.Item>

                      {typeof window !== 'undefined' ? (
                        <PatientInsurancePickerField
                          form={insuranceForm}
                          patientId={form.patientId}
                          mitraOptions={selectedMitraOptions}
                          disabled={isSubmitting || !form.patientId}
                          required={form.paymentMethod === 'bpjs'}
                        />
                      ) : (
                        <div />
                      )}

                      <Form.Item name="mitraCodeExpiredDate" label="Expired At" className="m-0">
                        <DatePicker
                          style={{ width: '100%' }}
                          disabled={isSubmitting}
                          onChange={() => insuranceForm.setFieldValue('patientInsuranceId', undefined)}
                        />
                      </Form.Item>
                    </div>
                    {!form.patientId ? (
                      <div className="mt-[8px] text-[11.5px] text-[var(--ds-color-text-subtle)]">
                        Pilih pasien terlebih dahulu untuk mengambil data penjamin pasien.
                      </div>
                    ) : null}
                    {watchedMitraId && !watchedPatientInsuranceId ? (
                      <div className="mt-[8px] text-[11.5px] text-[var(--ds-color-text-subtle)]">
                        Nomor kartu bisa diisi manual atau diambil dari data asuransi pasien.
                      </div>
                    ) : null}
                  </Form>
                </div>
              ) : null}
            </div>
          </AdmissionCard>

          {showBpjsVerification ? (
            <AdmissionCard title="Verifikasi BPJS & SEP">
              <div className="grid gap-[12px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <FieldLabel>No. Rujukan / SEP Asal</FieldLabel>
                  <TextInput
                    defaultValue="0301R0010426V000142"
                    value={form.noRujukan}
                    onChange={(value) => updateForm({ noRujukan: value })}
                    className="w-full font-mono"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <FieldLabel>No. Kartu BPJS</FieldLabel>
                  <TextInput
                    defaultValue="0001234567890"
                    value={form.noKartu}
                    onChange={(value) => updateForm({ noKartu: value })}
                    className="w-full font-mono"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="col-span-2 flex items-center gap-[8px]">
                  <DesktopButton
                    emphasis="primary"
                    size="small"
                    icon={<SafetyCertificateOutlined />}
                    disabled={isSubmitting}
                  >
                    Bridging V-Claim - Terbitkan SEP RI
                  </DesktopButton>
                  <span className="text-[11.5px] text-[var(--ds-color-text-subtle)]">
                    SEP rawat inap akan diterbitkan otomatis setelah verifikasi eligibilitas.
                  </span>
                </div>
              </div>
            </AdmissionCard>
          ) : null}

          <AdmissionCard title="Diagnosis & Indikasi Rawat Inap">
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <FieldLabel>Diagnosis Masuk (ICD-10)</FieldLabel>
                <Select
                  className="w-full"
                  value={form.diagnosisCode || undefined}
                  options={diagnosisSelectOptions}
                  disabled={isSubmitting}
                  loading={isDiagnosisLoading}
                  showSearch
                  filterOption={false}
                  optionFilterProp="label"
                  placeholder="Ketik kode ICD-10 atau nama diagnosis"
                  notFoundContent={isDiagnosisLoading ? 'Memuat diagnosis...' : 'Diagnosis tidak ditemukan'}
                  onSearch={onDiagnosisSearch}
                  onChange={handleDiagnosisChange}
                  allowClear
                  onClear={() => updateForm({ diagnosisCode: '', diagnosisText: '' })}
                />
                {form.diagnosisText ? (
                  <div className="mt-[6px] text-[11.5px] text-[var(--ds-color-text-muted)]">
                    {form.diagnosisCode} - {form.diagnosisText}
                  </div>
                ) : null}
              </div>
              <div>
                <FieldLabel>DPJP Utama</FieldLabel>
                <Select
                  className="w-full"
                  value={form.practitionerId || undefined}
                  options={practitionerOptions}
                  disabled={isSubmitting}
                  loading={isPractitionerLoading}
                  placeholder="Pilih DPJP utama dari data dokter"
                  showSearch
                  optionFilterProp="label"
                  onChange={(value) => updateForm({ practitionerId: value })}
                  allowClear
                  onClear={() => updateForm({ practitionerId: '' })}
                />
              </div>
              <div className="col-span-2">
                <FieldLabel>Indikasi Rawat Inap</FieldLabel>
                <textarea
                  rows={3}
                  value={form.indication}
                  disabled={isSubmitting}
                  onChange={(event) => updateForm({ indication: event.target.value })}
                  className={`${INPUT_CLASSNAME} h-auto w-full resize-y py-[8px] leading-[1.6]`}
                />
              </div>
            </div>
          </AdmissionCard>

          <AdmissionCard title="Penempatan Kamar">
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <FieldLabel>Kelas Kamar</FieldLabel>
                <div className="inline-flex rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] p-[2px]">
                  {classOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleClassOfCareChange(option.value)}
                      disabled={isSubmitting}
                      title={`${option.availableBeds} bed tersedia`}
                      className="h-[28px] rounded-[calc(var(--ds-radius-md)-2px)] border-none px-[12px] text-[12px] font-semibold text-[var(--ds-color-text-muted)]"
                      style={
                        selectedClassOfCareCodeId === option.value
                          ? {
                              background: 'var(--ds-color-surface)',
                              color: 'var(--ds-color-text)',
                              boxShadow: 'var(--ds-shadow-xs)'
                            }
                          : undefined
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Bangsal & Bed</FieldLabel>
                <div className="flex gap-[8px]">
                  <SelectBox
                    className="min-w-0 flex-1"
                    value={form.selectedBedId}
                    disabled={isSubmitting || filteredBedOptions.length === 0}
                    onChange={(value) => updateForm({ selectedBedId: value })}
                  >
                    {filteredBedOptions.length > 0 ? (
                      filteredBedOptions.map((option) => (
                        <option key={option.bedId} value={option.bedId}>
                          {formatBedOptionLabel(option)}
                        </option>
                      ))
                    ) : (
                      <option value="">Tidak ada bed tersedia</option>
                    )}
                  </SelectBox>
                </div>
              </div>
              <div className="col-span-2 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-success)] bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] px-[12px] py-[10px] text-[11.5px]">
                <b className="text-[var(--ds-color-success)]">
                  Bed dipilih: {selectedBed ? formatBedOptionLabel(selectedBed) : '-'}
                </b>
                <span className="ml-[8px] text-[var(--ds-color-text-muted)]">
                  {selectedBed
                    ? `${selectedBed.classOfCareCodeId} - Status: Kosong & siap`
                    : 'Tidak ada bed kosong yang bisa dipilih'}
                </span>
              </div>
            </div>
          </AdmissionCard>
        </div>
      </div>

      <Modal
        open={isPatientLookupOpen}
        onCancel={() => setIsPatientLookupOpen(false)}
        footer={null}
        width={980}
        title="Pilih Pasien"
      >
        {isPatientLookupOpen ? (
          <Suspense fallback={<div className="py-[16px] text-[12px]">Memuat daftar pasien...</div>}>
            <PatientLookupSelector
              value={selectedPatient}
              onChange={handlePatientChange}
              disabled={isSubmitting}
              title="Data Pasien"
              createButtonLabel="Buat Pasien Baru"
            />
          </Suspense>
        ) : null}
      </Modal>

      <Modal
        open={isSourceEncounterLookupOpen}
        onCancel={() => setIsSourceEncounterLookupOpen(false)}
        footer={null}
        width={1100}
        title={`Pilih Encounter ${sourceEncounterConfig?.label ?? ''}`}
      >
        {isSourceEncounterLookupOpen ? (
          <Suspense
            fallback={
              <div className="py-[16px] text-[12px]">
                Memuat encounter {sourceEncounterConfig?.label ?? ''}...
              </div>
            }
          >
            <IgdEncounterLookupSelector
              value={selectedSourceEncounter}
              onChange={handleSourceEncounterChange}
              disabled={isSubmitting}
              title={`Encounter ${sourceEncounterConfig?.label ?? ''}`}
              encounterType={sourceEncounterConfig?.type ?? 'EMER'}
              encounterLabel={sourceEncounterConfig?.label ?? 'IGD'}
            />
          </Suspense>
        ) : null}
      </Modal>
    </div>
  )
}
