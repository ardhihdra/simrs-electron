/**
 * purpose: Resolver level triase IGD terpusat untuk menghitung suggested/final level dinamis dari quick triase, evidence assessment, override manual, dan daftar level aktif RS.
 * main callers: `IgdRegistrasiPage` (quick triase), `buildIgdRegistrationCommand`, dan `IgdTriasePage` (triase lengkap + override final level).
 * key dependencies: Tidak ada dependency eksternal; pure utility lokal.
 * main/public functions: `normalizeIgdTriageActiveLevels`, `clampIgdTriageLevelToActive`, `resolveIgdTriageLevel`.
 * side effects: Tidak ada; seluruh fungsi pure transform tanpa IO.
 */
export type IgdTriageLevel = number
export type IgdTriageLevelSource = 'suggested' | 'quick' | 'manual' | 'fallback'

export type ResolveIgdTriageLevelInput = {
  quickLevel?: number
  assessmentEvidenceByLevel?: Partial<Record<number, number>>
  manualFinalLevel?: number
  activeLevels?: number[]
}

export type ResolvedIgdTriageLevel = {
  suggestedLevel: IgdTriageLevel
  finalLevel: IgdTriageLevel
  source: IgdTriageLevelSource
  isOverridden: boolean
  activeLevels: IgdTriageLevel[]
}

const DEFAULT_TRIAGE_LEVELS: IgdTriageLevel[] = [0, 1, 2, 3, 4]

const toIgdTriageLevel = (value: number | undefined): IgdTriageLevel | undefined => {
  if (!Number.isInteger(value)) return undefined
  if (value! < 0) return undefined
  return value
}

export const normalizeIgdTriageActiveLevels = (levels?: number[]): IgdTriageLevel[] => {
  const normalized = Array.from(
    new Set(
      (levels ?? [])
        .map((level) => toIgdTriageLevel(level))
        .filter((level): level is IgdTriageLevel => typeof level === 'number')
    )
  ).sort((left, right) => left - right)

  if (normalized.length === 0) return [...DEFAULT_TRIAGE_LEVELS]
  return normalized
}

export const clampIgdTriageLevelToActive = (
  level: number | undefined,
  activeLevelsInput?: number[]
): IgdTriageLevel => {
  const activeLevels = normalizeIgdTriageActiveLevels(activeLevelsInput)
  const baseline = toIgdTriageLevel(level) ?? 4

  let nearest = activeLevels[0]
  let bestDistance = Math.abs(nearest - baseline)
  for (const candidate of activeLevels) {
    const distance = Math.abs(candidate - baseline)
    if (distance < bestDistance) {
      nearest = candidate
      bestDistance = distance
      continue
    }
    if (distance === bestDistance && candidate < nearest) {
      nearest = candidate
    }
  }

  return nearest
}

const resolveSuggestedLevelFromEvidence = (
  evidenceByLevel?: Partial<Record<number, number>>
): IgdTriageLevel | undefined => {
  if (!evidenceByLevel) return undefined

  let selectedLevel: IgdTriageLevel | undefined
  let highestCount = -1
  for (const [rawLevel, rawCount] of Object.entries(evidenceByLevel)) {
    const level = toIgdTriageLevel(Number.parseInt(rawLevel, 10))
    const count = Number(rawCount)
    if (typeof level !== 'number' || !Number.isFinite(count) || count <= 0) continue

    const shouldPick =
      count > highestCount ||
      (count === highestCount && (typeof selectedLevel !== 'number' || level < selectedLevel))
    if (!shouldPick) continue

    selectedLevel = level
    highestCount = count
  }

  return selectedLevel
}

export const resolveIgdTriageLevel = (
  input: ResolveIgdTriageLevelInput
): ResolvedIgdTriageLevel => {
  const activeLevels = normalizeIgdTriageActiveLevels(input.activeLevels)
  const evidenceSuggested = resolveSuggestedLevelFromEvidence(input.assessmentEvidenceByLevel)
  const quickLevel = toIgdTriageLevel(input.quickLevel)
  const manualFinalLevel = toIgdTriageLevel(input.manualFinalLevel)

  const suggestedCandidate = evidenceSuggested ?? quickLevel ?? 4
  const suggestedLevel = clampIgdTriageLevelToActive(suggestedCandidate, activeLevels)
  const finalLevel =
    typeof manualFinalLevel === 'number'
      ? clampIgdTriageLevelToActive(manualFinalLevel, activeLevels)
      : suggestedLevel

  const source: IgdTriageLevelSource =
    typeof manualFinalLevel === 'number'
      ? 'manual'
      : typeof evidenceSuggested === 'number'
        ? 'suggested'
        : typeof quickLevel === 'number'
          ? 'quick'
          : 'fallback'

  return {
    suggestedLevel,
    finalLevel,
    source,
    isOverridden: typeof manualFinalLevel === 'number' && finalLevel !== suggestedLevel,
    activeLevels
  }
}
