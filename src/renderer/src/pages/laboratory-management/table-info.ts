import dayjs from 'dayjs'

export interface PatientInfoSource {
  name?: string
  mrn?: string
  medicalRecordNumber?: string
  nik?: string
  birthDate?: string
  address?: string
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

function getLatestReferral(referrals?: ReferralInfoSource[]): ReferralInfoSource | null {
  if (!Array.isArray(referrals) || referrals.length === 0) return null

  return [...referrals].sort((left, right) => {
    const leftTime = dayjs(left.referralDate || left.createdAt || 0).valueOf()
    const rightTime = dayjs(right.referralDate || right.createdAt || 0).valueOf()
    return rightTime - leftTime
  })[0]
}

function getAgeLabel(birthDate?: string, referenceDate?: string): string {
  const birth = dayjs(birthDate)
  if (!birth.isValid()) return '-'

  const reference = dayjs(referenceDate)
  const now = reference.isValid() ? reference : dayjs()
  return `${Math.max(now.diff(birth, 'year'), 0)} th`
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
