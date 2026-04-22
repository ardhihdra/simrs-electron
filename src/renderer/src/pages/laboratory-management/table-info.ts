import dayjs from 'dayjs'
import type { PatientInfoCardData } from '@renderer/components/molecules/PatientInfoCard'

export interface PatientInfoSource {
  name?: string
  mrn?: string
  medicalRecordNumber?: string
  nik?: string
  heightCm?: number | string | null
  weightKg?: number | string | null
  pregnancyStatus?: 'Hamil' | 'Tidak Hamil' | '-' | string | null
  birthDate?: string
  address?: string
  gender?: string
  religion?: string
  paymentMethod?: string
  status?: string
  visitDate?: string
  poliName?: string
  doctorName?: string
  allergies?: string
}

interface PractitionerNameSource {
  namaLengkap?: string
  fullName?: string
  display?: string
  name?: string
}

export interface AncillaryQueuePatientInfoSource {
  patientName?: string
  patientMrNo?: string
  patient?: {
    name?: string
    mrn?: string
    medicalRecordNumber?: string
    nik?: string
    heightCm?: number | string | null
    weightKg?: number | string | null
    pregnancyStatus?: 'Hamil' | 'Tidak Hamil' | '-' | string | null
    birthDate?: string
    address?: string
    gender?: string
    religion?: string
  }
  queueTicket?: {
    paymentMethod?: string
    serviceUnit?: {
      display?: string
    }
    poli?: {
      name?: string
    }
    practitioner?: PractitionerNameSource
  }
  practitioner?: PractitionerNameSource | null
  poli?: {
    name?: string
  }
  serviceUnitName?: string
  category?: string
  status?: string
  startTime?: string
  visitDate?: string
  createdAt?: string
  doctorName?: string
}

export interface ReferralInfoSource {
  referralDate?: string
  createdAt?: string
  referringPractitionerName?: string
  diagnosisText?: string
  conditionAtTransfer?: string
  keadaanKirim?: string
  reasonForReferral?: string
  referringPractitioner?: {
    namaLengkap?: string
    name?: string
  }
}

export interface ReferralSummaryInput {
  referrals?: ReferralInfoSource[]
  fallbackSourcePoliName?: string
}

export interface SummaryRow {
  label: string
  value: string
}

function toDisplayValue(value?: string | null): string {
  return String(value || '').trim()
}

function toPositiveNumber(value?: number | string | null): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

function toPregnancyStatus(value?: string | null): 'Hamil' | 'Tidak Hamil' | '-' {
  if (value === 'Hamil' || value === 'Tidak Hamil') return value
  return '-'
}

function resolvePractitionerName(practitioner?: PractitionerNameSource | null): string {
  return (
    toDisplayValue(practitioner?.namaLengkap) ||
    toDisplayValue(practitioner?.fullName) ||
    toDisplayValue(practitioner?.display) ||
    toDisplayValue(practitioner?.name)
  )
}

function getAncillaryUnitFallback(category?: string): string {
  const normalizedCategory = toDisplayValue(category).toUpperCase()

  if (normalizedCategory === 'LABORATORY') return 'Laboratory'
  if (normalizedCategory === 'RADIOLOGY') return 'Radiology'

  return '-'
}

function getLatestReferral(referrals?: ReferralInfoSource[]): ReferralInfoSource | null {
  if (!Array.isArray(referrals) || referrals.length === 0) return null

  return [...referrals].sort((left, right) => {
    const leftTime = dayjs(left.referralDate || left.createdAt || 0).valueOf()
    const rightTime = dayjs(right.referralDate || right.createdAt || 0).valueOf()
    return rightTime - leftTime
  })[0]
}

function getAgeLabel(birthDate?: string, referenceDate?: string): string {
  if (!birthDate) return '-'
  const birth = dayjs(birthDate)
  if (!birth.isValid()) return '-'

  const reference = dayjs(referenceDate)
  const now = reference.isValid() ? reference : dayjs()
  return `${Math.max(now.diff(birth, 'year'), 0)} th`
}

function getAgeValue(birthDate?: string, referenceDate?: string): number | null {
  if (!birthDate) return null
  const birth = dayjs(birthDate)
  if (!birth.isValid()) return null

  const reference = dayjs(referenceDate)
  const now = reference.isValid() ? reference : dayjs()
  return Math.max(now.diff(birth, 'year'), 0)
}

export function buildPatientSummary(
  patient?: PatientInfoSource | null,
  referenceDate?: string
): SummaryRow[] {
  return [
    { label: 'Nama', value: toDisplayValue(patient?.name) || '-' },
    {
      label: 'No. RM',
      value: toDisplayValue(patient?.medicalRecordNumber || patient?.mrn) || '-'
    },
    { label: 'NIK', value: toDisplayValue(patient?.nik) || '-' },
    { label: 'Umur', value: getAgeLabel(patient?.birthDate, referenceDate) },
    { label: 'Alamat', value: toDisplayValue(patient?.address) || '-' }
  ]
}

export function buildPatientInfoCardData(
  patient?: PatientInfoSource | null,
  referenceDate?: string
): PatientInfoCardData {
  return {
    patient: {
      medicalRecordNumber: toDisplayValue(patient?.medicalRecordNumber || patient?.mrn) || '-',
      name: toDisplayValue(patient?.name) || 'Unknown Patient',
      nik: toDisplayValue(patient?.nik) || '-',
      gender: toDisplayValue(patient?.gender) || null,
      age: getAgeValue(patient?.birthDate, referenceDate),
      identityNumber: toDisplayValue(patient?.nik) || '-',
      address: toDisplayValue(patient?.address) || '-',
      religion: toDisplayValue(patient?.religion) || '-',
      heightCm: toPositiveNumber(patient?.heightCm),
      weightKg: toPositiveNumber(patient?.weightKg),
      pregnancyStatus: toPregnancyStatus(patient?.pregnancyStatus)
    },
    poli: {
      name: toDisplayValue(patient?.poliName) || '-'
    },
    doctor: {
      name: toDisplayValue(patient?.doctorName) || '-'
    },
    visitDate: patient?.visitDate,
    paymentMethod: toDisplayValue(patient?.paymentMethod) || 'Umum',
    status: toDisplayValue(patient?.status) || undefined,
    allergies: toDisplayValue(patient?.allergies) || '-'
  }
}

export function buildAncillaryQueuePatientInfoCardData(
  encounter?: AncillaryQueuePatientInfoSource | null
): PatientInfoCardData {
  const visitDate = encounter?.visitDate || encounter?.startTime || encounter?.createdAt

  return buildPatientInfoCardData(
    {
      name: encounter?.patientName || encounter?.patient?.name,
      medicalRecordNumber:
        encounter?.patient?.medicalRecordNumber || encounter?.patientMrNo || encounter?.patient?.mrn,
      nik: encounter?.patient?.nik,
      heightCm: encounter?.patient?.heightCm,
      weightKg: encounter?.patient?.weightKg,
      pregnancyStatus: encounter?.patient?.pregnancyStatus,
      gender: encounter?.patient?.gender,
      birthDate: encounter?.patient?.birthDate,
      address: encounter?.patient?.address,
      religion: encounter?.patient?.religion,
      paymentMethod: encounter?.queueTicket?.paymentMethod,
      status: encounter?.status,
      visitDate,
      poliName:
        encounter?.queueTicket?.serviceUnit?.display ||
        encounter?.serviceUnitName ||
        encounter?.poli?.name ||
        encounter?.queueTicket?.poli?.name ||
        getAncillaryUnitFallback(encounter?.category),
      doctorName:
        toDisplayValue(encounter?.doctorName) ||
        resolvePractitionerName(encounter?.practitioner) ||
        resolvePractitionerName(encounter?.queueTicket?.practitioner)
    },
    visitDate
  )
}

export function buildReferralSummary(input: ReferralSummaryInput): SummaryRow[] {
  const referral = getLatestReferral(input.referrals)
  const sourcePoliName = toDisplayValue(input.fallbackSourcePoliName)
  if (!referral && !sourcePoliName) return []

  const referringPractitionerName =
    toDisplayValue(referral?.referringPractitionerName) ||
    toDisplayValue(referral?.referringPractitioner?.namaLengkap) ||
    toDisplayValue(referral?.referringPractitioner?.name)

  const rows: SummaryRow[] = []

  if (sourcePoliName) {
    rows.push({ label: 'Poli Asal', value: sourcePoliName })
  }
  if (referringPractitionerName) {
    rows.push({ label: 'Dokter Pengirim', value: referringPractitionerName })
  }
  if (toDisplayValue(referral?.diagnosisText)) {
    rows.push({ label: 'Diagnosis', value: toDisplayValue(referral?.diagnosisText) })
  }
  if (toDisplayValue(referral?.conditionAtTransfer || referral?.keadaanKirim)) {
    rows.push({
      label: 'Keadaan Saat Dikirim',
      value: toDisplayValue(referral?.conditionAtTransfer || referral?.keadaanKirim)
    })
  }
  if (toDisplayValue(referral?.reasonForReferral)) {
    rows.push({ label: 'Alasan Rujukan', value: toDisplayValue(referral?.reasonForReferral) })
  }

  return rows
}

export function hasReferralSummary(input: ReferralSummaryInput): boolean {
  return buildReferralSummary(input).length > 0
}
