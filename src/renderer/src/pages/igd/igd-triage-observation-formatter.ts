/**
 * purpose: Formatter hydration triase IGD dari Observation backend menjadi draft form per-section (termasuk metadata header, kesadaran, dan final level triase) untuk dipakai ulang saat pasien dipilih.
 * main callers: `IgdTriasePage` saat hydrate data Observation per encounter.
 * key dependencies: konstanta kode snapshot/transport dari mapper triase, `TRANSPORTATION_SNOMED_MAP`, dan type draft `IgdTriaseFormBySection`.
 * main/public functions: `formatIgdTriaseFormsFromObservations`.
 * side effects: Tidak ada; pure transform read-only dari list observation ke shape form triase.
 */
import {
  IGD_TRIAGE_TRANSPORTATION_CODE,
  IGD_TRIAGE_SNAPSHOT_CODE,
  IGD_TRIAGE_LEVEL_OBSERVATION_CODE,
  type IgdTriaseFormBySection
} from './igd-triage-observation'
import { CONSCIOUSNESS_SNOMED_MAP, TRANSPORTATION_SNOMED_MAP } from '../../config/maps/observation-maps'

export type IgdTriaseObservationLike = {
  code?: string
  codeCoding?: Array<{ code?: string | null }>
  effectiveDateTime?: string | null
  issued?: string | null
  performers?: Array<{
    practitionerId?: number | string | null
    display?: string | null
  }> | null
  valueString?: string | null
  valueCodeableConcept?: {
    coding?: Array<{
      code?: string | null
    }> | null
  } | null
  valueQuantity?: { value?: number | null } | null
  components?: Array<{
    code?: string | null
    valueQuantity?: { value?: number | null } | null
    valueString?: string | null
  }> | null
}

type SnapshotCandidate = {
  observation: IgdTriaseObservationLike
  timestamp: number
}

const TRIAGE_CODE_PREFIX = 'igd-triage-'
const TRIAGE_FIELD_CODE_PATTERN = /^igd-triage-(quick|umum|primer|sekunder)-(.+)$/
const TRIAGE_ASSESSMENT_CODE_PATTERN = /^igd-triage-(primer|sekunder)-assessment-(\d+)$/
const TRIAGE_VITAL_CODES = new Set([
  '8867-4',
  '9279-1',
  '8310-5',
  '59408-5',
  'pain-score',
  '85354-9',
  'consciousness',
  '9267-5',
  '9270-9',
  '9268-3',
  '9269-1',
  IGD_TRIAGE_LEVEL_OBSERVATION_CODE,
  IGD_TRIAGE_TRANSPORTATION_CODE
])
const TRIAGE_INTERNAL_KEYS = {
  assessmentDate: '__assessmentDate',
  performerId: '__performerId',
  performerName: '__performerName',
  finalLevel: '__finalLevel',
  finalLevelSource: '__finalLevelSource'
} as const

const toTimestamp = (value: string | null | undefined): number | null => {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

const getObservationTimestamp = (observation: IgdTriaseObservationLike): number | null =>
  toTimestamp(observation.effectiveDateTime) ?? toTimestamp(observation.issued)

const getObservationCode = (observation: IgdTriaseObservationLike): string => {
  const coded = observation.codeCoding?.find((item) => item?.code)?.code
  return (coded ?? observation.code ?? '').trim()
}

const isTriageCustomCode = (code: string): boolean =>
  code.startsWith(TRIAGE_CODE_PREFIX) && code !== IGD_TRIAGE_SNAPSHOT_CODE

const isRelevantTriageObservation = (observation: IgdTriaseObservationLike): boolean => {
  const code = getObservationCode(observation)
  return code === IGD_TRIAGE_SNAPSHOT_CODE || isTriageCustomCode(code) || TRIAGE_VITAL_CODES.has(code)
}

const parseNumericString = (value: number | null | undefined): string | null => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return String(value)
}

const parseNumericStringFromValueString = (value: string | null | undefined): string | null => {
  const raw = (value ?? '').trim()
  if (!raw) return null
  const match = raw.match(/(\d+)/)
  return match?.[1] ?? null
}

const readObservationStringValue = (observation: IgdTriaseObservationLike): string | null => {
  const rawString = observation.valueString?.trim()
  if (rawString) return rawString
  return parseNumericString(observation.valueQuantity?.value)
}

const toCamelCaseFromKebab = (value: string): string =>
  value.replace(/-([a-z])/g, (_full, next: string) => next.toUpperCase())

const ensureSection = (
  draft: IgdTriaseFormBySection,
  section: 'quick' | 'umum' | 'primer' | 'sekunder'
): Record<string, string> => {
  const existing = draft[section]
  if (existing) return existing
  const next: Record<string, string> = {}
  draft[section] = next
  return next
}

const pickLatestSnapshotTimestamp = (observations: IgdTriaseObservationLike[]): number | null => {
  const markerCandidates: SnapshotCandidate[] = observations
    .filter((item) => getObservationCode(item) === IGD_TRIAGE_SNAPSHOT_CODE)
    .map((observation) => {
      const timestamp = getObservationTimestamp(observation)
      return timestamp === null ? null : { observation, timestamp }
    })
    .filter((item): item is SnapshotCandidate => !!item)

  if (markerCandidates.length > 0) {
    markerCandidates.sort((a, b) => b.timestamp - a.timestamp)
    return markerCandidates[0].timestamp
  }

  const legacyCandidates: SnapshotCandidate[] = observations
    .filter((item) => isTriageCustomCode(getObservationCode(item)))
    .map((observation) => {
      const timestamp = getObservationTimestamp(observation)
      return timestamp === null ? null : { observation, timestamp }
    })
    .filter((item): item is SnapshotCandidate => !!item)

  if (legacyCandidates.length === 0) return null
  legacyCandidates.sort((a, b) => b.timestamp - a.timestamp)
  return legacyCandidates[0].timestamp
}

const parseBloodPressureFromComponents = (observation: IgdTriaseObservationLike): string | null => {
  const systolic = observation.components?.find((item) => item.code === '8480-6')
  const diastolic = observation.components?.find((item) => item.code === '8462-4')
  const systolicValue =
    parseNumericString(systolic?.valueQuantity?.value) ?? systolic?.valueString?.trim() ?? null
  const diastolicValue =
    parseNumericString(diastolic?.valueQuantity?.value) ?? diastolic?.valueString?.trim() ?? null
  if (!systolicValue || !diastolicValue) return null
  return `${systolicValue}/${diastolicValue}`
}

const parseAssessmentValue = (value: string): { criteria: string; review: string } | null => {
  const match = value.match(/^criteria=(.*?);\s*review=(.*)$/)
  if (!match) return null
  const criteria = match[1] === '-' ? '' : match[1]
  const review = match[2] === '-' ? '' : match[2]
  return { criteria, review }
}

const parseTransportationKey = (observation: IgdTriaseObservationLike): string | null => {
  const codingCode = observation.valueCodeableConcept?.coding?.find((item) => item?.code)?.code?.trim()
  if (!codingCode) return null
  const matchedKey = Object.entries(TRANSPORTATION_SNOMED_MAP).find(
    ([, snomed]) => snomed.code === codingCode
  )?.[0]
  return matchedKey ?? null
}

const parseConsciousnessLabel = (observation: IgdTriaseObservationLike): string | null => {
  const rawValue = observation.valueString?.trim()
  if (rawValue) return rawValue
  const codingCode = observation.valueCodeableConcept?.coding?.find((item) => item?.code)?.code?.trim()
  if (!codingCode) return null
  const matchedLabel = Object.entries(CONSCIOUSNESS_SNOMED_MAP).find(
    ([, snomed]) => snomed.code === codingCode
  )?.[0]
  return matchedLabel ?? null
}

const resolveConsciousnessFromGcsTotal = (total: number): string => {
  if (total >= 14) return 'Compos Mentis'
  if (total >= 12) return 'Apatis'
  if (total >= 7) return 'Somnolen'
  if (total >= 5) return 'Sopor'
  return 'Coma'
}

export const formatIgdTriaseFormsFromObservations = (
  observations: IgdTriaseObservationLike[]
): IgdTriaseFormBySection => {
  if (!Array.isArray(observations) || observations.length === 0) return {}

  const snapshotTimestamp = pickLatestSnapshotTimestamp(observations)
  if (snapshotTimestamp === null) return {}

  const snapshotObservations = observations.filter((observation) => {
    const timestamp = getObservationTimestamp(observation)
    if (timestamp === null || timestamp !== snapshotTimestamp) return false
    return isRelevantTriageObservation(observation)
  })

  if (snapshotObservations.length === 0) return {}

  const nextForms: IgdTriaseFormBySection = {}
  const assessmentCounts: Partial<Record<'primer' | 'sekunder', number>> = {}
  let gcsTotalLegacy: number | null = null
  const metadataSource =
    snapshotObservations.find((observation) => (observation.performers?.length ?? 0) > 0) ??
    snapshotObservations[0]

  const metadataDate = metadataSource?.effectiveDateTime ?? metadataSource?.issued
  const metadataPerformer = metadataSource?.performers?.[0]
  if (metadataDate || metadataPerformer) {
    const umumValues = ensureSection(nextForms, 'umum')
    if (metadataDate) {
      umumValues[TRIAGE_INTERNAL_KEYS.assessmentDate] = metadataDate
    }
    if (metadataPerformer?.practitionerId !== undefined && metadataPerformer?.practitionerId !== null) {
      umumValues[TRIAGE_INTERNAL_KEYS.performerId] = String(metadataPerformer.practitionerId)
    }
    if (metadataPerformer?.display) {
      umumValues[TRIAGE_INTERNAL_KEYS.performerName] = metadataPerformer.display
    }
  }

  for (const observation of snapshotObservations) {
    const code = getObservationCode(observation)
    if (!code || code === IGD_TRIAGE_SNAPSHOT_CODE) continue

    if (code === '8867-4') {
      const value = parseNumericString(observation.valueQuantity?.value)
      if (value) ensureSection(nextForms, 'umum').pulseRate = value
      continue
    }
    if (code === '9279-1') {
      const value = parseNumericString(observation.valueQuantity?.value)
      if (value) ensureSection(nextForms, 'umum').respiratoryRate = value
      continue
    }
    if (code === '8310-5') {
      const value = parseNumericString(observation.valueQuantity?.value)
      if (value) ensureSection(nextForms, 'umum').temperature = value
      continue
    }
    if (code === '59408-5') {
      const value = parseNumericString(observation.valueQuantity?.value)
      if (value) ensureSection(nextForms, 'umum').oxygenSaturation = value
      continue
    }
    if (code === 'pain-score') {
      const value = parseNumericString(observation.valueQuantity?.value)
      if (value) ensureSection(nextForms, 'umum').painScore = value
      continue
    }
    if (code === '85354-9') {
      const value =
        observation.valueString?.trim() ||
        parseBloodPressureFromComponents(observation) ||
        readObservationStringValue(observation)
      if (value) ensureSection(nextForms, 'umum').bloodPressure = value
      continue
    }
    if (code === IGD_TRIAGE_TRANSPORTATION_CODE) {
      const value = parseTransportationKey(observation)
      if (value) ensureSection(nextForms, 'umum').transportation = value
      continue
    }
    if (code === IGD_TRIAGE_LEVEL_OBSERVATION_CODE) {
      const value = parseNumericStringFromValueString(observation.valueString)
      if (!value) continue
      const umumValues = ensureSection(nextForms, 'umum')
      umumValues[TRIAGE_INTERNAL_KEYS.finalLevel] = value
      umumValues[TRIAGE_INTERNAL_KEYS.finalLevelSource] = 'manual'
      continue
    }
    if (code === 'consciousness') {
      const value = parseConsciousnessLabel(observation)
      if (value) ensureSection(nextForms, 'umum').consciousness = value
      continue
    }
    if (code === '9269-1') {
      const value =
        parseNumericString(observation.valueQuantity?.value) ??
        parseNumericStringFromValueString(observation.valueString)
      const parsedTotal = value ? Number.parseInt(value, 10) : Number.NaN
      if (!Number.isNaN(parsedTotal)) gcsTotalLegacy = parsedTotal
      continue
    }

    const assessmentMatch = code.match(TRIAGE_ASSESSMENT_CODE_PATTERN)
    if (assessmentMatch) {
      const section = assessmentMatch[1] as 'primer' | 'sekunder'
      const index = Number(assessmentMatch[2]) - 1
      const parsed = parseAssessmentValue(observation.valueString?.trim() ?? '')
      if (!parsed || index < 0) continue
      const sectionValues = ensureSection(nextForms, section)
      sectionValues[`${section}AssessmentCriteria_${index}`] = parsed.criteria
      sectionValues[`${section}AssessmentReview_${index}`] = parsed.review
      const nextCount = index + 1
      assessmentCounts[section] = Math.max(assessmentCounts[section] ?? 0, nextCount)
      continue
    }

    const fieldMatch = code.match(TRIAGE_FIELD_CODE_PATTERN)
    if (fieldMatch) {
      const section = fieldMatch[1] as 'quick' | 'umum' | 'primer' | 'sekunder'
      const fieldName = toCamelCaseFromKebab(fieldMatch[2])
      const value = readObservationStringValue(observation)
      if (!value) continue
      ensureSection(nextForms, section)[fieldName] = value
    }
  }

  for (const section of ['primer', 'sekunder'] as const) {
    const count = assessmentCounts[section]
    if (!count) continue
    ensureSection(nextForms, section)[`__${section}AssessmentCount`] = String(count)
  }

  const umumValues = nextForms.umum
  if (umumValues && !umumValues.consciousness && gcsTotalLegacy !== null) {
    umumValues.consciousness = resolveConsciousnessFromGcsTotal(gcsTotalLegacy)
  }

  return nextForms
}
