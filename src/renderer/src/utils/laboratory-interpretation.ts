// ── Nilai Rujukan helpers ──────────────────────────────────────────────────

export interface NilaiRujukanEntry {
  id: number
  gender: 'male' | 'female' | null
  ageMinDays: number | null
  ageMaxDays: number | null
  lowerBound: number | null
  lowerInclusive: boolean
  upperBound: number | null
  upperInclusive: boolean
  criticalLow: number | null
  criticalHigh: number | null
  expectedValue: string | null
  unit: string | null
  note: string | null
  machineBrand: string | null
}

export function getAgeInDays(birthDate?: string): number | undefined {
  if (!birthDate) return undefined
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return undefined
  return Math.floor((Date.now() - birth.getTime()) / 86_400_000)
}

export function matchesPatient(
  entry: NilaiRujukanEntry,
  gender?: string,
  ageInDays?: number
): boolean {
  if (entry.gender && entry.gender !== gender) return false
  if (entry.ageMinDays !== null && ageInDays !== undefined && ageInDays < entry.ageMinDays)
    return false
  if (entry.ageMaxDays !== null && ageInDays !== undefined && ageInDays > entry.ageMaxDays)
    return false
  return true
}

export function pickBestNilaiRujukan(
  entries: NilaiRujukanEntry[],
  gender?: string,
  ageInDays?: number
): NilaiRujukanEntry | undefined {
  const candidates = entries.filter((e) => matchesPatient(e, gender, ageInDays))
  if (!candidates.length) return undefined
  return (
    candidates.find((e) => e.gender !== null && e.ageMinDays !== null) ??
    candidates.find((e) => e.gender !== null) ??
    candidates.find((e) => e.ageMinDays !== null) ??
    candidates[0]
  )
}

export function buildReferenceRangeString(entry: NilaiRujukanEntry): string | undefined {
  if (entry.lowerBound !== null && entry.upperBound !== null) {
    return `${entry.lowerBound}-${entry.upperBound}`
  }
  if (entry.upperBound !== null) {
    return `${entry.upperInclusive ? '<=' : '<'}${entry.upperBound}`
  }
  if (entry.lowerBound !== null) {
    return `${entry.lowerInclusive ? '>=' : '>'}${entry.lowerBound}`
  }
  if (entry.expectedValue !== null) {
    return entry.expectedValue
  }
  return undefined
}

// ── Interpretation ─────────────────────────────────────────────────────────

export type LaboratoryInterpretationOption =
  | 'NORMAL'
  | 'HIGH'
  | 'LOW'
  | 'ABNORMAL'
  | 'CRITICAL_HIGH'
  | 'CRITICAL_LOW'

interface ParsedReferenceRange {
  low?: number
  high?: number
  target?: number
}

const CRITICAL_DEVIATION_PERCENT = 20
const NORMAL_SINGLE_TARGET_TOLERANCE_PERCENT = 5

function toNumber(value: string): number | undefined {
  const normalized = value.replace(',', '.').trim()
  if (!normalized) return undefined

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function parseObservationValue(value?: string): number | undefined {
  if (!value) return undefined

  const match = value
    .trim()
    .replace(',', '.')
    .match(/-?\d+(?:\.\d+)?/)
  if (!match) return undefined

  return toNumber(match[0])
}

export function parseReferenceRange(referenceRange?: string): ParsedReferenceRange | undefined {
  if (!referenceRange) return undefined

  const normalized = referenceRange.toLowerCase().replace(/,/g, '.').replace(/\s+/g, ' ').trim()

  if (!normalized) return undefined

  const comparatorMatch = normalized.match(/^(<=|=<|<|>=|=>|>)\s*(-?\d+(?:\.\d+)?)$/)
  if (comparatorMatch) {
    const comparator = comparatorMatch[1]
    const boundary = toNumber(comparatorMatch[2])

    if (boundary === undefined) return undefined

    if (comparator.startsWith('<')) {
      return { high: boundary }
    }

    return { low: boundary }
  }

  const rangeMatch = normalized.match(
    /^(-?\d+(?:\.\d+)?)\s*(?:-|–|—|to|s\/d|sd|sampai)\s*(-?\d+(?:\.\d+)?)$/
  )
  if (rangeMatch) {
    const first = toNumber(rangeMatch[1])
    const second = toNumber(rangeMatch[2])

    if (first === undefined || second === undefined) return undefined

    return first <= second ? { low: first, high: second } : { low: second, high: first }
  }

  const singleValue = toNumber(normalized)
  if (singleValue !== undefined) {
    return { target: singleValue }
  }

  const numberMatches = normalized.match(/-?\d+(?:\.\d+)?/g)
  if (!numberMatches?.length) {
    return undefined
  }

  if (numberMatches.length >= 2) {
    const first = toNumber(numberMatches[0])
    const second = toNumber(numberMatches[1])

    if (first === undefined || second === undefined) return undefined

    return first <= second ? { low: first, high: second } : { low: second, high: first }
  }

  const fallbackTarget = toNumber(numberMatches[0])
  return fallbackTarget === undefined ? undefined : { target: fallbackTarget }
}

function getDeviationPercent(actual: number, reference: number): number {
  if (reference === 0) {
    return actual === 0 ? 0 : Number.POSITIVE_INFINITY
  }

  return (Math.abs(actual - reference) / Math.abs(reference)) * 100
}

function getDirectionalInterpretation(
  direction: 'high' | 'low',
  deviationPercent: number
): LaboratoryInterpretationOption {
  if (deviationPercent >= CRITICAL_DEVIATION_PERCENT) {
    return direction === 'high' ? 'CRITICAL_HIGH' : 'CRITICAL_LOW'
  }

  return direction === 'high' ? 'HIGH' : 'LOW'
}

export function getInterpretationFromReferenceRange(
  value?: string,
  referenceRange?: string
): LaboratoryInterpretationOption | undefined {
  const numericValue = parseObservationValue(value)
  const parsedRange = parseReferenceRange(referenceRange)

  if (numericValue === undefined || !parsedRange) {
    return undefined
  }

  if (parsedRange.low !== undefined && parsedRange.high !== undefined) {
    if (numericValue < parsedRange.low) {
      return getDirectionalInterpretation('low', getDeviationPercent(numericValue, parsedRange.low))
    }

    if (numericValue > parsedRange.high) {
      return getDirectionalInterpretation(
        'high',
        getDeviationPercent(numericValue, parsedRange.high)
      )
    }

    return 'NORMAL'
  }

  if (parsedRange.low !== undefined) {
    if (numericValue < parsedRange.low) {
      return getDirectionalInterpretation('low', getDeviationPercent(numericValue, parsedRange.low))
    }

    return 'NORMAL'
  }

  if (parsedRange.high !== undefined) {
    if (numericValue > parsedRange.high) {
      return getDirectionalInterpretation(
        'high',
        getDeviationPercent(numericValue, parsedRange.high)
      )
    }

    return 'NORMAL'
  }

  if (parsedRange.target !== undefined) {
    const deviationPercent = getDeviationPercent(numericValue, parsedRange.target)

    if (deviationPercent <= NORMAL_SINGLE_TARGET_TOLERANCE_PERCENT) {
      return 'NORMAL'
    }

    return getDirectionalInterpretation(
      numericValue > parsedRange.target ? 'high' : 'low',
      deviationPercent
    )
  }

  return undefined
}
