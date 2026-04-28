/**
 * purpose: Util sinkronisasi data tab matrix triase (Pemeriksaan Cepat) berbasis checkbox per-criteria text dengan format assessment primer/sekunder lama.
 * main callers: `IgdTriasePage` untuk write-through sinkronisasi dua arah antar section.
 * key dependencies: Konstanta grup triase dari hook master `use-master-igd-triage-criteria`.
 * main/public functions: `buildMatrixCriteriaMetaById`, `readSelectedMatrixCriteriaIds`, `selectedCriteriaIdsToMatrixSectionValues`, `convertMatrixCriteriaSelectionToAssessmentUpdates`, `deriveSelectedMatrixCriteriaIdsFromAssessment`.
 * side effects: Tidak ada; seluruh fungsi pure transform untuk state form lokal.
 */
import {
  TRIAGE_CRITERIA_GROUPS,
  type TriageCriteriaGroup
} from '../../hooks/query/use-master-igd-triage-criteria'

export type MatrixGroup = TriageCriteriaGroup
export type MatrixLevelNo = number
export type MatrixCriteriaMeta = {
  id: number
  levelNo: MatrixLevelNo
  criteriaGroup: MatrixGroup
  criteriaText: string
  sortOrder: number
}

type AssessmentSection = 'primer' | 'sekunder'

interface MatrixToAssessmentParams {
  selectedCriteriaIds: number[]
  criteriaMetaById: Map<number, MatrixCriteriaMeta>
  primerValues?: Record<string, string>
  sekunderValues?: Record<string, string>
}

interface AssessmentToMatrixParams {
  criteriaMetaById: Map<number, MatrixCriteriaMeta>
  primerValues?: Record<string, string>
  sekunderValues?: Record<string, string>
}

export const MATRIX_GROUPS: readonly MatrixGroup[] = TRIAGE_CRITERIA_GROUPS
export const MATRIX_LEVELS: readonly MatrixLevelNo[] = [0, 1, 2, 3, 4]

export const MATRIX_GROUP_LABELS: Record<MatrixGroup, string> = {
  airway: 'Airway',
  breathing: 'Breathing',
  circulation: 'Circulation',
  disability_and_other_dysfunction: 'Disability/Disfungsi',
  nyeri: 'Nyeri'
}

const MATRIX_LABEL_TO_GROUP = new Map(
  (Object.keys(MATRIX_GROUP_LABELS) as MatrixGroup[]).map((group) => [
    MATRIX_GROUP_LABELS[group].toLowerCase(),
    group
  ])
)

const MATRIX_REVIEW_PATTERN = /^(.+)\s*-\s*Level\s*(\d+)\s*\(Kategori\s*(\d+)\)$/i

const toMatrixFieldKey = (criteriaId: number): string => `matrixCriteria_${criteriaId}`
const parseMatrixFieldKey = (fieldName: string): number | undefined => {
  if (!fieldName.startsWith('matrixCriteria_')) return undefined
  const raw = fieldName.slice('matrixCriteria_'.length)
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isInteger(parsed) || parsed < 1) return undefined
  return parsed
}

const parseAssessmentCount = (
  section: AssessmentSection,
  values: Record<string, string> | undefined
): number => {
  const raw = Number.parseInt(values?.[`__${section}AssessmentCount`] ?? '', 10)
  if (!Number.isInteger(raw) || raw < 1) return 1
  return raw
}

const buildAssessmentUpdatesForSection = (
  section: AssessmentSection,
  rows: Array<{ criteriaId: number; review: string }>,
  currentValues: Record<string, string> | undefined
): Record<string, string> => {
  const previousCount = parseAssessmentCount(section, currentValues)
  const nextCount = Math.max(rows.length, 1)
  const rowSpan = Math.max(previousCount, nextCount)
  const updates: Record<string, string> = {
    [`__${section}AssessmentCount`]: String(nextCount)
  }

  for (let index = 0; index < rowSpan; index += 1) {
    const row = rows[index]
    updates[`${section}AssessmentCriteria_${index}`] = row ? String(row.criteriaId) : ''
    updates[`${section}AssessmentReview_${index}`] = row?.review ?? ''
  }

  return updates
}

const criteriaComparator = (left: MatrixCriteriaMeta, right: MatrixCriteriaMeta): number => {
  if (left.levelNo !== right.levelNo) return left.levelNo - right.levelNo
  const leftGroupIndex = MATRIX_GROUPS.indexOf(left.criteriaGroup)
  const rightGroupIndex = MATRIX_GROUPS.indexOf(right.criteriaGroup)
  if (leftGroupIndex !== rightGroupIndex) return leftGroupIndex - rightGroupIndex
  if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder
  return left.id - right.id
}

const parseMatrixReview = (
  rawValue: string | undefined
): { group: MatrixGroup; level: MatrixLevelNo } | undefined => {
  const value = (rawValue ?? '').trim()
  if (!value) return undefined

  const match = value.match(MATRIX_REVIEW_PATTERN)
  if (!match) return undefined

  const [, rawLabel, rawLevelLeft, rawLevelRight] = match
  if (rawLevelLeft !== rawLevelRight) return undefined

  const group = MATRIX_LABEL_TO_GROUP.get(rawLabel.trim().toLowerCase())
  if (!group) return undefined

  const parsedLevel = Number.parseInt(rawLevelLeft, 10)
  if (!Number.isInteger(parsedLevel) || parsedLevel < 0) return undefined

  return { group, level: parsedLevel }
}

const resolveFallbackByReviewText = (
  reviewText: string,
  section: AssessmentSection,
  criteriaMetaById: Map<number, MatrixCriteriaMeta>
): number | undefined => {
  const parsed = parseMatrixReview(reviewText)
  if (parsed) {
    const fromPattern = Array.from(criteriaMetaById.values())
      .filter((item) => item.criteriaGroup === parsed.group && item.levelNo === parsed.level)
      .sort(criteriaComparator)[0]
    if (fromPattern) return fromPattern.id
  }

  const allowedLevel = section === 'primer'
    ? (levelNo: number) => levelNo <= 2
    : (levelNo: number) => levelNo >= 3

  const fromExactText = Array.from(criteriaMetaById.values())
    .filter((item) => allowedLevel(item.levelNo) && item.criteriaText.trim() === reviewText)
    .sort(criteriaComparator)[0]

  return fromExactText?.id
}

const mergeCriteriaIdsFromSection = (
  section: AssessmentSection,
  sectionValues: Record<string, string> | undefined,
  criteriaMetaById: Map<number, MatrixCriteriaMeta>,
  output: Set<number>
): void => {
  const count = parseAssessmentCount(section, sectionValues)

  for (let index = 0; index < count; index += 1) {
    const criteriaRaw = sectionValues?.[`${section}AssessmentCriteria_${index}`]
    const criteriaId = Number.parseInt(criteriaRaw ?? '', 10)
    if (Number.isInteger(criteriaId) && criteriaMetaById.has(criteriaId)) {
      output.add(criteriaId)
      continue
    }

    const review = (sectionValues?.[`${section}AssessmentReview_${index}`] ?? '').trim()
    if (!review) continue
    const fallbackId = resolveFallbackByReviewText(review, section, criteriaMetaById)
    if (fallbackId) output.add(fallbackId)
  }
}

export const buildMatrixCriteriaMetaById = (
  items: Array<{
    id: number
    triageLevelId: number
    criteriaGroup: string
    criteriaText: string
    sortOrder?: number | null
  }>,
  levels: Array<{
    id: number
    levelNo: number
  }>
): Map<number, MatrixCriteriaMeta> => {
  const levelNoByLevelId = new Map(levels.map((level) => [level.id, level.levelNo]))
  const result = new Map<number, MatrixCriteriaMeta>()

  for (const item of items) {
    if (!MATRIX_GROUPS.includes(item.criteriaGroup as MatrixGroup)) continue
    const levelNo = levelNoByLevelId.get(item.triageLevelId)
    if (typeof levelNo !== 'number' || !Number.isInteger(levelNo) || levelNo < 0) continue

    result.set(item.id, {
      id: item.id,
      levelNo,
      criteriaGroup: item.criteriaGroup as MatrixGroup,
      criteriaText: item.criteriaText,
      sortOrder: item.sortOrder ?? 0
    })
  }

  return result
}

export const isAssessmentSectionField = (
  section: AssessmentSection,
  fieldName: string
): boolean => {
  if (fieldName === `__${section}AssessmentCount`) return true
  if (fieldName.startsWith(`${section}AssessmentCriteria_`)) return true
  if (fieldName.startsWith(`${section}AssessmentReview_`)) return true
  return false
}

export const isMatrixCriteriaField = (fieldName: string): boolean =>
  fieldName.startsWith('matrixCriteria_')

export const getMatrixFieldKey = toMatrixFieldKey

export const readSelectedMatrixCriteriaIds = (
  matrixValues: Record<string, string> | undefined
): number[] => {
  if (!matrixValues) return []
  const selectedIds: number[] = []

  for (const [fieldName, rawValue] of Object.entries(matrixValues)) {
    const criteriaId = parseMatrixFieldKey(fieldName)
    if (!criteriaId) continue
    if ((rawValue ?? '').trim() !== '1') continue
    selectedIds.push(criteriaId)
  }

  selectedIds.sort((left, right) => left - right)
  return selectedIds
}

export const selectedCriteriaIdsToMatrixSectionValues = (
  selectedCriteriaIds: number[]
): Record<string, string> => {
  const values: Record<string, string> = {}

  for (const criteriaId of selectedCriteriaIds) {
    values[toMatrixFieldKey(criteriaId)] = '1'
  }

  return values
}

export const convertMatrixCriteriaSelectionToAssessmentUpdates = ({
  selectedCriteriaIds,
  criteriaMetaById,
  primerValues,
  sekunderValues
}: MatrixToAssessmentParams): {
  primerUpdates: Record<string, string>
  sekunderUpdates: Record<string, string>
} => {
  const selectedRows = selectedCriteriaIds
    .map((criteriaId) => criteriaMetaById.get(criteriaId))
    .filter((row): row is MatrixCriteriaMeta => !!row)
    .sort(criteriaComparator)

  const primerRows = selectedRows
    .filter((row) => row.levelNo <= 2)
    .map((row) => ({ criteriaId: row.id, review: row.criteriaText }))

  const sekunderRows = selectedRows
    .filter((row) => row.levelNo >= 3)
    .map((row) => ({ criteriaId: row.id, review: row.criteriaText }))

  return {
    primerUpdates: buildAssessmentUpdatesForSection('primer', primerRows, primerValues),
    sekunderUpdates: buildAssessmentUpdatesForSection('sekunder', sekunderRows, sekunderValues)
  }
}

export const deriveSelectedMatrixCriteriaIdsFromAssessment = ({
  criteriaMetaById,
  primerValues,
  sekunderValues
}: AssessmentToMatrixParams): number[] => {
  const selectedIds = new Set<number>()

  mergeCriteriaIdsFromSection('primer', primerValues, criteriaMetaById, selectedIds)
  mergeCriteriaIdsFromSection('sekunder', sekunderValues, criteriaMetaById, selectedIds)

  return Array.from(selectedIds).sort((left, right) => {
    const leftMeta = criteriaMetaById.get(left)
    const rightMeta = criteriaMetaById.get(right)
    if (!leftMeta || !rightMeta) return left - right
    return criteriaComparator(leftMeta, rightMeta)
  })
}
