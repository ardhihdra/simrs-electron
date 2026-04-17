import type { AncillaryCategory } from './section-config'
import type { PatientInfoSource, ReferralInfoSource } from './table-info'

export interface ServiceRequestCodeItem {
  code?: string
  display?: string
  system?: string
}

export interface ServiceRequestCategoryItem {
  code?: string
  display?: string
  system?: string
}

interface ServiceRequestEncounterRelation {
  poli?: {
    name?: string
  }
  queueTicket?: {
    number?: string | number
    queueNumber?: string | number
    formattedQueueNumber?: string
    status?: string
    poli?: {
      name?: string
    }
  }
  referrals?: Array<{
    referralDate?: string
    createdAt?: string
    referringPractitionerName?: string
    diagnosisText?: string
    conditionAtTransfer?: string
    reasonForReferral?: string
    referringPractitioner?: {
      namaLengkap?: string
      name?: string
    }
  }>
  partOf?: ServiceRequestEncounterRelation
}

export interface ServiceRequestEntity {
  id: string | number
  subjectId?: string
  encounterId?: string
  status?: string
  priority?: string
  autheredOn?: string
  occurrenceDateTime?: string
  createdAt?: string
  patient?: PatientInfoSource & {
    id?: string
  }
  encounter?: {
    id?: string
    status?: string
  } & ServiceRequestEncounterRelation
  categories?: ServiceRequestCategoryItem[]
  codes?: ServiceRequestCodeItem[]
}

type RequestCategoryValue = AncillaryCategory | 'UNKNOWN'

export interface NormalizedRequest {
  id: string
  patientId: string
  encounterId: string
  patient: PatientInfoSource & {
    name: string
    mrn: string
  }
  queueTicket?: {
    number?: string
  }
  requestedAt?: string
  test: {
    code: string
    display: string
    name: string
    category: RequestCategoryValue
  }
  testDisplay: string
  testCodeId: string
  priority: string
  status: string
  statusRaw: string
  encounterStatus: string
  referrals?: ReferralInfoSource[]
  sourcePoliName?: string
}

export interface EncounterGroupRow {
  id: string
  patientId: string
  encounterId: string
  patient: NormalizedRequest['patient']
  queueNumber?: string
  requests: NormalizedRequest[]
  referrals?: ReferralInfoSource[]
  sourcePoliName?: string
  encounter: any
}

function normalizeCategory(item: ServiceRequestEntity): RequestCategoryValue {
  const categoryCodes = (item.categories || []).map((category) =>
    String(category.code || '').toUpperCase()
  )
  if (categoryCodes.some((code) => code === 'LABORATORY' || code === 'LAB')) {
    return 'LABORATORY'
  }
  if (categoryCodes.some((code) => code === 'RADIOLOGY' || code === 'RAD')) {
    return 'RADIOLOGY'
  }

  const displayText = (item.categories || [])
    .map((category) => String(category.display || '').toLowerCase())
    .join(' ')
  if (displayText.includes('laboratory') || displayText.includes('lab')) {
    return 'LABORATORY'
  }
  if (displayText.includes('radiology')) {
    return 'RADIOLOGY'
  }

  return 'UNKNOWN'
}

function normalizeStatus(status?: string): string {
  if (!status) return 'UNKNOWN'
  return String(status).toUpperCase()
}

function normalizePriority(priority?: string): string {
  if (!priority) return 'ROUTINE'
  return String(priority).toUpperCase()
}

function extractReferralSummaries(
  encounter?: ServiceRequestEntity['encounter']
): ReferralInfoSource[] | undefined {
  const directReferrals = Array.isArray(encounter?.referrals) ? encounter.referrals : []
  const parentReferrals = Array.isArray(encounter?.partOf?.referrals)
    ? encounter.partOf.referrals
    : []
  const selectedReferrals = parentReferrals.length > 0 ? parentReferrals : directReferrals

  if (selectedReferrals.length === 0) {
    return undefined
  }

  return selectedReferrals.map((referral) => ({
    referralDate: referral.referralDate,
    createdAt: referral.createdAt,
    referringPractitionerName:
      referral.referringPractitionerName ||
      referral.referringPractitioner?.namaLengkap ||
      referral.referringPractitioner?.name,
    diagnosisText: referral.diagnosisText,
    conditionAtTransfer: referral.conditionAtTransfer,
    reasonForReferral: referral.reasonForReferral
  }))
}

function resolveSourcePoliName(encounter?: ServiceRequestEntity['encounter']): string | undefined {
  return (
    encounter?.partOf?.poli?.name ||
    encounter?.partOf?.queueTicket?.poli?.name ||
    encounter?.poli?.name ||
    encounter?.queueTicket?.poli?.name ||
    undefined
  )
}

export function normalizeServiceRequests(
  rows: ServiceRequestEntity[],
  fixedCategory: AncillaryCategory
): NormalizedRequest[] {
  return rows
    .map((item) => {
      const firstCode = item.codes?.[0]
      const category = normalizeCategory(item)
      const status = normalizeStatus(item.status)
      const priority = normalizePriority(item.priority)
      const queueNumber =
        item.encounter?.queueTicket?.formattedQueueNumber ||
        item.encounter?.queueTicket?.number ||
        item.encounter?.queueTicket?.queueNumber

      const patientId = String(item.subjectId || item.patient?.id || '')
      const patientName = item.patient?.name || 'Unknown Patient'
      const patientMrn = item.patient?.mrn || item.patient?.medicalRecordNumber || '-'

      const code = firstCode?.code || '-'
      const display = firstCode?.display || code

      return {
        id: String(item.id),
        patientId,
        encounterId: String(item.encounterId || item.encounter?.id || ''),
        patient: {
          name: patientName,
          mrn: patientMrn,
          medicalRecordNumber: item.patient?.medicalRecordNumber || patientMrn,
          nik: item.patient?.nik,
          birthDate: item.patient?.birthDate,
          address: item.patient?.address
        },
        queueTicket: {
          number: queueNumber ? String(queueNumber) : undefined
        },
        requestedAt: item.autheredOn || item.occurrenceDateTime || item.createdAt,
        test: {
          code,
          display,
          name: display,
          category
        },
        testDisplay: display,
        testCodeId: code,
        priority,
        status,
        statusRaw: String(item.status || ''),
        encounterStatus: normalizeStatus(item.encounter?.status),
        referrals: extractReferralSummaries(item.encounter),
        sourcePoliName: resolveSourcePoliName(item.encounter),
        encounter: item.encounter
      }
    })
    .filter((item) => item.test.category === fixedCategory)
}

export function groupServiceRequestsByEncounter(
  normalizedRequests: NormalizedRequest[]
): EncounterGroupRow[] {
  const grouped = new Map<string, EncounterGroupRow>()

  normalizedRequests.forEach((item, index) => {
    const encounterKey = item.encounterId || `missing-encounter-${item.id || index}`
    const existingGroup = grouped.get(encounterKey)

    if (existingGroup) {
      existingGroup.requests.push(item)
      if (!existingGroup.queueNumber && item.queueTicket?.number) {
        existingGroup.queueNumber = item.queueTicket.number
      }
      if (!existingGroup.sourcePoliName && item.sourcePoliName) {
        existingGroup.sourcePoliName = item.sourcePoliName
      }
      if (
        (!existingGroup.referrals || existingGroup.referrals.length === 0) &&
        item.referrals?.length
      ) {
        existingGroup.referrals = item.referrals
      }
      return
    }

    grouped.set(encounterKey, {
      id: encounterKey,
      encounter: item,
      patientId: item.patientId,
      encounterId: item.encounterId,
      patient: item.patient,
      queueNumber: item.queueTicket?.number,
      requests: [item],
      referrals: item.referrals,
      sourcePoliName: item.sourcePoliName
    })
  })

  return Array.from(grouped.values())
}
