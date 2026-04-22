import { parseAncObservations } from '../utils/formatters/anc-formatter'

export type PregnancyStatusLabel = 'Hamil' | 'Tidak Hamil' | '-'

const MALE_GENDER_VALUES = new Set(['male', 'm', 'l'])

const ANC_SPECIFIC_OBSTETRIC_CODES = new Set([
  '11996-6', // gravida
  '11977-6', // paritas
  '69043-8', // abortus / pregnancy outcomes
  '8665-2', // HPHT
  '11778-8', // HPL
  '18185-9', // usia kehamilan
  '32418-6', // trimester
  'OC000001', // jarak kehamilan
  '56077-1', // BB sebelum hamil
  'OC000010', // IMT sebelum hamil
  'OC000011' // target kenaikan BB
])

const ANC_OBSTETRIC_INDICATOR_KEYS = [
  'gravida',
  'paritas',
  'abortus',
  'hpht',
  'hpl',
  'usia_kehamilan',
  'trimester',
  'jarak_kehamilan',
  'berat_badan_sebelum_hamil',
  'imt_sebelum_hamil',
  'target_kenaikan_bb'
] as const

const hasMeaningfulValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

const hasAnyAncSpecificObstetricCode = (observations: Record<string, unknown>[]): boolean => {
  return observations.some((obs) => {
    const directCode = String((obs.code as string) || '').trim()
    if (ANC_SPECIFIC_OBSTETRIC_CODES.has(directCode)) return true

    const codings = Array.isArray(obs.codeCoding)
      ? (obs.codeCoding as Array<{ code?: string }>)
      : []
    return codings.some((coding) => ANC_SPECIFIC_OBSTETRIC_CODES.has(String(coding.code || '').trim()))
  })
}

export const hasAncPregnancyIndicators = (observations: Record<string, unknown>[]): boolean => {
  if (!Array.isArray(observations) || observations.length === 0) return false
  if (!hasAnyAncSpecificObstetricCode(observations)) return false

  const parsedData = parseAncObservations(observations)
  const obstetricHistory = parsedData.obstetricHistory as Record<string, unknown>

  return ANC_OBSTETRIC_INDICATOR_KEYS.some((key) => hasMeaningfulValue(obstetricHistory?.[key]))
}

export const derivePregnancyStatus = (input: {
  observations?: Record<string, unknown>[]
  gender?: string | null
}): PregnancyStatusLabel => {
  const observations = input.observations || []
  if (hasAncPregnancyIndicators(observations)) return 'Hamil'

  const normalizedGender = String(input.gender || '').trim().toLowerCase()
  return MALE_GENDER_VALUES.has(normalizedGender) ? 'Tidak Hamil' : '-'
}
