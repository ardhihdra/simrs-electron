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
import React, { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Modal } from 'antd'
import type { PatientAttributes } from 'simrs-types'

import { DesktopBadge } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import {
  buildRawatInapAdmissionCommand,
  createDefaultRawatInapAdmissionForm,
  createRawatInapAdmissionBedOptions,
  createRawatInapAdmissionFormPatchFromPatient,
  type RawatInapAdmissionBedOption,
  type RawatInapAdmissionFormState
} from './rawat-inap.admisi'
import type { RawatInapBedMapSnapshot } from './rawat-inap.state'

void React

const PatientLookupSelector = React.lazy(
  () => import('../../components/organisms/patient/PatientLookupSelector')
)

type AdmissionSource = 'rajal' | 'igd' | 'rujukan'

type RawatInapAdmisiPageProps = {
  onBack?: () => void
  onCancel?: () => void
  onSubmit?: (command: CreateRawatInapAdmissionInput) => void
  bedMapSnapshot?: RawatInapBedMapSnapshot | null
  isSubmitting?: boolean
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
  isSubmitting = false
}: RawatInapAdmisiPageProps) {
  const bedOptions = useMemo(
    () => createRawatInapAdmissionBedOptions(bedMapSnapshot),
    [bedMapSnapshot]
  )
  const [form, setForm] = useState<RawatInapAdmissionFormState>(() => ({
    ...createDefaultRawatInapAdmissionForm(),
    selectedBedId: bedOptions[0]?.bedId ?? ''
  }))
  const [submitError, setSubmitError] = useState('')
  const [isPatientLookupOpen, setIsPatientLookupOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientAttributes | undefined>()

  useEffect(() => {
    if (!selectedPatient) return
    setForm((current) => ({
      ...current,
      ...createRawatInapAdmissionFormPatchFromPatient(selectedPatient)
    }))
  }, [selectedPatient])

  useEffect(() => {
    setForm((current) => {
      if (bedOptions.some((option) => option.bedId === current.selectedBedId)) return current
      return {
        ...current,
        selectedBedId: bedOptions[0]?.bedId ?? ''
      }
    })
  }, [bedOptions])

  const updateForm = (patch: Partial<RawatInapAdmissionFormState>) => {
    setSubmitError('')
    setForm((current) => ({
      ...current,
      ...patch
    }))
  }

  const selectedBed = bedOptions.find((option) => option.bedId === form.selectedBedId)

  const handlePatientChange = (patient?: PatientAttributes) => {
    setSelectedPatient(patient)
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
      noKartu: ''
    }))
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
            Registrasi pasien masuk rawat inap · verifikasi BPJS & SEP · assign kamar
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
                  onClick={() => updateForm({ source: item.key })}
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
                  onChange={(value) => updateForm({ patientName: value })}
                  className="w-full"
                  disabled
                />
              </div>
              <div>
                <FieldLabel>Tgl Lahir / Usia</FieldLabel>
                <TextInput
                  defaultValue="12 Mar 1972 / 54 tahun"
                  value={form.patientSummary}
                  onChange={(value) => updateForm({ patientSummary: value })}
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
                <DesktopBadge tone="info">No. BPJS: {form.noKartu || '-'}</DesktopBadge>
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

          <AdmissionCard title="Verifikasi BPJS & SEP">
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
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
                <FieldLabel>{form.source === 'igd' ? 'Encounter IGD Asal' : 'Unit Rawat Inap'}</FieldLabel>
                <TextInput
                  defaultValue="Poli Penyakit Dalam"
                  value={form.source === 'igd' ? form.sourceEncounterId : form.serviceUnitId}
                  onChange={(value) =>
                    updateForm(
                      form.source === 'igd'
                        ? { sourceEncounterId: value }
                        : { serviceUnitId: value }
                    )
                  }
                  className="w-full"
                  disabled={isSubmitting}
                />
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
              <div className="col-span-3 flex items-center gap-[8px]">
                <DesktopButton
                  emphasis="primary"
                  size="small"
                  icon={<SafetyCertificateOutlined />}
                  disabled={isSubmitting}
                >
                  Bridging V-Claim — Terbitkan SEP RI
                </DesktopButton>
                <span className="text-[11.5px] text-[var(--ds-color-text-subtle)]">
                  SEP rawat inap akan diterbitkan otomatis setelah verifikasi eligibilitas.
                </span>
              </div>
            </div>
          </AdmissionCard>

          <AdmissionCard title="Diagnosis & Indikasi Rawat Inap">
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <FieldLabel>Diagnosis Masuk (ICD-10)</FieldLabel>
                <div className="flex gap-[8px]">
                  <TextInput
                    defaultValue="I10"
                    value={form.diagnosisCode}
                    onChange={(value) => updateForm({ diagnosisCode: value })}
                    className="w-[80px] font-mono"
                    disabled={isSubmitting}
                  />
                  <TextInput
                    defaultValue="Essential hypertension"
                    value={form.diagnosisText}
                    onChange={(value) => updateForm({ diagnosisText: value })}
                    className="min-w-0 flex-1"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>DPJP</FieldLabel>
                <SelectBox
                  className="w-full"
                  value={form.practitionerId}
                  disabled={isSubmitting}
                  onChange={(value) => updateForm({ practitionerId: value })}
                >
                  <option value="17">dr. Andi Wijaya, Sp.PD</option>
                  <option value="18">dr. Sari Dewi, Sp.PD</option>
                </SelectBox>
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
                  {['VIP', 'Kelas 1', 'Kelas 2', 'Kelas 3'].map((label) => (
                    <button
                      key={label}
                      type="button"
                      className="h-[28px] rounded-[calc(var(--ds-radius-md)-2px)] border-none px-[12px] text-[12px] font-semibold text-[var(--ds-color-text-muted)]"
                      style={
                        selectedBed?.classOfCareCodeId === label.toUpperCase().replace(' ', '_') ||
                        (!selectedBed && label === 'Kelas 1')
                          ? {
                              background: 'var(--ds-color-surface)',
                              color: 'var(--ds-color-text)',
                              boxShadow: 'var(--ds-shadow-xs)'
                            }
                          : undefined
                      }
                    >
                      {label}
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
                    disabled={isSubmitting || bedOptions.length === 0}
                    onChange={(value) => updateForm({ selectedBedId: value })}
                  >
                    {bedOptions.length > 0 ? (
                      bedOptions.map((option) => (
                        <option key={option.bedId} value={option.bedId}>
                          {formatBedOptionLabel(option)}
                        </option>
                      ))
                    ) : (
                      <option value="">Tidak ada bed tersedia</option>
                    )}
                  </SelectBox>
                  <SelectBox
                    className="w-[120px]"
                    value={form.paymentMethod}
                    disabled={isSubmitting}
                    onChange={(value) =>
                      updateForm({
                        paymentMethod: value as RawatInapAdmissionFormState['paymentMethod']
                      })
                    }
                  >
                    <option value="bpjs">BPJS</option>
                    <option value="cash">Umum</option>
                    <option value="asuransi">Asuransi</option>
                    <option value="company">Perusahaan</option>
                  </SelectBox>
                </div>
              </div>
              <div className="col-span-2 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-success)] bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] px-[12px] py-[10px] text-[11.5px]">
                <b className="text-[var(--ds-color-success)]">
                  Bed dipilih: {selectedBed ? formatBedOptionLabel(selectedBed) : '-'}
                </b>
                <span className="ml-[8px] text-[var(--ds-color-text-muted)]">
                  {selectedBed
                    ? `${selectedBed.classOfCareCodeId} · Status: Kosong & siap`
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
    </div>
  )
}
