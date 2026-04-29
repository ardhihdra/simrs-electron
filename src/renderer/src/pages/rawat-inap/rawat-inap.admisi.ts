import type { CreateRawatInapAdmissionInput } from '@main/rpc/procedure/rawat-inap-admission'
import type { RawatInapBedMapSnapshot } from './rawat-inap.state'

export type RawatInapAdmissionSource = 'rajal' | 'igd' | 'rujukan'
export type RawatInapAdmissionPaymentMethod = 'bpjs' | 'cash' | 'asuransi' | 'company'

const SOURCES_WITH_PARENT_ENCOUNTER = new Set<RawatInapAdmissionSource>(['rajal', 'igd'])

export type RawatInapAdmissionBedOption = {
  bedId: string
  bedName: string
  roomId: string
  roomName: string
  classOfCareCodeId: string
}

export type RawatInapAdmissionClassOption = {
  value: string
  label: string
  availableBeds: number
}

export type RawatInapAdmissionMitraOption = {
  value: number
  label: string
}

export type RawatInapAdmissionDiagnosisOption = {
  value: string
  code: string
  display: string
  label: string
}

export type RawatInapAdmissionPractitionerOption = {
  value: string
  label: string
}

export type RawatInapAdmissionPatientSnapshot = {
  id: string
  medicalRecordNumber?: string
  name?: string
  gender?: string
  birthDate?: string
  insuranceNumber?: string | null
}

export type RawatInapAdmissionFormState = {
  patientId: string
  medicalRecordNumber: string
  patientName: string
  patientSummary: string
  source: RawatInapAdmissionSource
  sourceEncounterId: string
  serviceUnitId: string
  practitionerId: string
  paymentMethod: RawatInapAdmissionPaymentMethod
  patientInsuranceId: string
  admissionDate: string
  noKartu: string
  noRujukan: string
  diagnosisCode: string
  diagnosisText: string
  indication: string
  selectedClassOfCareCodeId: string
  selectedBedId: string
}

export type RawatInapAdmissionInsuranceFormValues = {
  patientInsuranceId?: unknown
  mitraCodeNumber?: unknown
}

export const RAWAT_INAP_DEFAULT_SERVICE_UNIT_ID = '9f3c77d6-8481-443b-871d-f8ec0d268803'

export const RAWAT_INAP_ADMISSION_FALLBACK_BED_OPTIONS: RawatInapAdmissionBedOption[] = [
  {
    bedId: 'bed-melati-308-b',
    bedName: '308B',
    roomId: 'room-melati-308',
    roomName: 'Melati',
    classOfCareCodeId: 'KELAS_1'
  },
  {
    bedId: 'bed-melati-312-a',
    bedName: '312A',
    roomId: 'room-melati-312',
    roomName: 'Melati',
    classOfCareCodeId: 'KELAS_1'
  },
  {
    bedId: 'bed-melati-312-b',
    bedName: '312B',
    roomId: 'room-melati-312',
    roomName: 'Melati',
    classOfCareCodeId: 'KELAS_1'
  }
]

const todayDateOnly = () => new Date().toISOString().slice(0, 10)

const RAWAT_INAP_CLASS_LABELS: Record<string, string> = {
  VIP: 'VIP',
  KELAS_1: 'Kelas 1',
  KELAS_2: 'Kelas 2',
  KELAS_3: 'Kelas 3'
}

const RAWAT_INAP_CLASS_ORDER = ['VIP', 'KELAS_1', 'KELAS_2', 'KELAS_3']

export function normalizeRawatInapClassCode(value?: string | null) {
  const normalized = String(value || 'KELAS_1')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')

  if (normalized === 'KELAS_I' || normalized === 'CLASS_1') return 'KELAS_1'
  if (normalized === 'KELAS_II' || normalized === 'CLASS_2') return 'KELAS_2'
  if (normalized === 'KELAS_III' || normalized === 'CLASS_3') return 'KELAS_3'
  return normalized || 'KELAS_1'
}

export function formatRawatInapClassLabel(value?: string | null) {
  const code = normalizeRawatInapClassCode(value)
  return RAWAT_INAP_CLASS_LABELS[code] || value || code
}

export function createRawatInapAdmissionClassOptions(
  bedOptions: RawatInapAdmissionBedOption[]
): RawatInapAdmissionClassOption[] {
  const counts = new Map<string, number>()

  for (const option of bedOptions) {
    const classCode = normalizeRawatInapClassCode(option.classOfCareCodeId)
    counts.set(classCode, (counts.get(classCode) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([value, availableBeds]) => ({
      value,
      label: formatRawatInapClassLabel(value),
      availableBeds
    }))
    .sort((left, right) => {
      const leftIndex = RAWAT_INAP_CLASS_ORDER.indexOf(left.value)
      const rightIndex = RAWAT_INAP_CLASS_ORDER.indexOf(right.value)
      if (leftIndex === -1 && rightIndex === -1) return left.label.localeCompare(right.label)
      if (leftIndex === -1) return 1
      if (rightIndex === -1) return -1
      return leftIndex - rightIndex
    })
}

export function createDefaultRawatInapAdmissionForm(): RawatInapAdmissionFormState {
  return {
    patientId: '',
    medicalRecordNumber: '02-14-88-21',
    patientName: '',
    patientSummary: '',
    source: 'rajal',
    sourceEncounterId: '',
    serviceUnitId: RAWAT_INAP_DEFAULT_SERVICE_UNIT_ID,
    practitionerId: '',
    paymentMethod: 'bpjs',
    patientInsuranceId: '',
    admissionDate: todayDateOnly(),
    noKartu: '0001234567890',
    noRujukan: '0301R0010426V000142',
    diagnosisCode: '',
    diagnosisText: '',
    indication: '',
    selectedClassOfCareCodeId: '',
    selectedBedId: ''
  }
}

export function formatPatientAdmissionSummary(patient?: RawatInapAdmissionPatientSnapshot | null) {
  if (!patient) return ''

  const parts = [
    patient.name,
    patient.gender ? patient.gender.toUpperCase() : null,
    patient.birthDate,
    patient.insuranceNumber ? `BPJS ${patient.insuranceNumber}` : null
  ].filter(Boolean)

  return parts.join(' · ')
}

export function createRawatInapAdmissionFormPatchFromPatient(
  patient: RawatInapAdmissionPatientSnapshot
): Partial<RawatInapAdmissionFormState> {
  return {
    patientId: patient.id,
    medicalRecordNumber: patient.medicalRecordNumber || '',
    patientName: patient.name || '',
    patientSummary: formatPatientAdmissionSummary(patient),
    noKartu: patient.insuranceNumber || ''
  }
}

const hasOwn = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key)

const toFormString = (value: unknown) => {
  if (value === null || value === undefined) return ''

  return String(value)
}

const hasFilledValue = (value: unknown) => value !== null && value !== undefined

export function mergeRawatInapAdmissionInsuranceFormValues(
  form: RawatInapAdmissionFormState,
  values: RawatInapAdmissionInsuranceFormValues
): RawatInapAdmissionFormState {
  return {
    ...form,
    patientInsuranceId: hasOwn(values, 'patientInsuranceId')
      ? toFormString(values.patientInsuranceId)
      : form.patientInsuranceId,
    noKartu:
      hasOwn(values, 'mitraCodeNumber') && hasFilledValue(values.mitraCodeNumber)
        ? toFormString(values.mitraCodeNumber)
        : form.noKartu
  }
}

export function buildRawatInapAdmissionCommand(
  form: RawatInapAdmissionFormState,
  bedOptions: RawatInapAdmissionBedOption[]
): CreateRawatInapAdmissionInput {
  const selectedBed = bedOptions.find((bed) => bed.bedId === form.selectedBedId)
  if (!form.patientId.trim()) throw new Error('Pilih pasien terlebih dahulu')
  if (form.source === 'igd' && !form.sourceEncounterId.trim()) {
    throw new Error('Encounter asal IGD wajib diisi')
  }
  if (form.source === 'rajal' && !form.sourceEncounterId.trim()) {
    throw new Error('Encounter asal Rawat Jalan wajib diisi')
  }
  if (!selectedBed) throw new Error('Pilih bed rawat inap yang tersedia')
  if (!form.serviceUnitId.trim()) throw new Error('Unit rawat inap wajib diisi')
  if (!form.diagnosisCode.trim()) throw new Error('Kode diagnosis wajib diisi')
  if (!form.diagnosisText.trim()) throw new Error('Nama diagnosis wajib diisi')
  if (!form.indication.trim()) throw new Error('Indikasi rawat inap wajib diisi')

  const practitionerId = form.practitionerId.trim() ? Number(form.practitionerId) : undefined
  const patientInsuranceId = form.patientInsuranceId.trim()
    ? Number(form.patientInsuranceId)
    : undefined
  const admissionDateTime = new Date(`${form.admissionDate}T00:00:00.000Z`).toISOString()

  const command: CreateRawatInapAdmissionInput = {
    patientId: form.patientId.trim(),
    source: form.source,
    sourceEncounterId: SOURCES_WITH_PARENT_ENCOUNTER.has(form.source)
      ? form.sourceEncounterId.trim() || undefined
      : undefined,
    serviceUnitId: form.serviceUnitId.trim(),
    practitionerId: Number.isFinite(practitionerId) ? practitionerId : undefined,
    paymentMethod: form.paymentMethod,
    patientInsuranceId: Number.isFinite(patientInsuranceId) ? patientInsuranceId : undefined,
    admissionDateTime,
    diagnosis: {
      code: form.diagnosisCode.trim(),
      text: form.diagnosisText.trim()
    },
    indication: form.indication.trim(),
    placement: {
      roomCodeId: selectedBed.roomId,
      bedCodeId: selectedBed.bedId,
      classOfCareCodeId: selectedBed.classOfCareCodeId
    }
  }

  if (form.paymentMethod === 'bpjs' && form.noKartu.trim()) {
    command.sep = {
      noKartu: form.noKartu.trim(),
      noRujukan: form.noRujukan.trim() || undefined,
      kelasRawatHak: selectedBed.classOfCareCodeId
    }
  }

  return command
}

export function createRawatInapAdmissionBedOptions(
  snapshot?: RawatInapBedMapSnapshot | null
): RawatInapAdmissionBedOption[] {
  if (!snapshot) return RAWAT_INAP_ADMISSION_FALLBACK_BED_OPTIONS

  const options = snapshot.wards.flatMap((room) =>
    /^igd\b|^igd[-_\s]/i.test(room.roomName)
      ? []
      : room.beds
          .filter((bed) => bed.status === 'TERSEDIA' && !bed.patient)
          .map((bed) => ({
            bedId: bed.bedId,
            bedName: bed.bedName,
            roomId: room.roomId,
            roomName: room.roomName,
            classOfCareCodeId: normalizeRawatInapClassCode(room.classLabel)
          }))
  )

  return options.length > 0 ? options : []
}
