/**
 * purpose: Util state form triase untuk tab UI `Triase` (view gabungan lintas section internal) serta auto level quick triase.
 * main callers: `IgdTriasePage` dan `IgdTriaseFormCard`.
 * key dependencies: `getQuickTriageMeta` dan util matrix-sync triase.
 * main/public functions: `resolveQuickLevelFromCondition`, `buildUtamaViewValues`, `applyUtamaViewValuesToForms`, konstanta field view triase.
 * side effects: Tidak ada; seluruh fungsi pure transform data in-memory.
 */
import { getQuickTriageMeta } from './igd.quick-triage'
import {
  convertMatrixCriteriaSelectionToAssessmentUpdates,
  isMatrixCriteriaField,
  readSelectedMatrixCriteriaIds,
  type MatrixCriteriaMeta
} from './igd-triage-matrix-sync'
import { type IgdTriaseFormBySection } from './igd-triage-observation'

const UTAMA_TO_SECTION_FIELD_MAP: Record<string, 'primer' | 'sekunder' | 'umum'> = {
  chiefComplaint: 'primer',
  shortAnamnesis: 'sekunder',
  temperature: 'umum',
  painScore: 'umum',
  oxygenSaturation: 'umum',
  respiratoryRate: 'umum',
  bloodPressure: 'umum',
  pulseRate: 'umum',
  consciousness: 'umum',
  specialNeeds: 'umum'
}

const QUICK_LEVEL_FIELD = 'quickLevel'
export const TRIAGE_VIEW_QUICK_COMPLAINT_FIELD = 'quickComplaint'
export const TRIAGE_VIEW_QUICK_CONDITION_FIELD = 'quickCondition'
export const TRIAGE_INTERNAL_SUGGESTED_LEVEL_FIELD = '__suggestedLevel'
export const TRIAGE_INTERNAL_FINAL_LEVEL_FIELD = '__finalLevel'
export const TRIAGE_INTERNAL_FINAL_LEVEL_SOURCE_FIELD = '__finalLevelSource'

export const QUICK_TRIAGE_FIELD_NAMES = {
  condition: TRIAGE_VIEW_QUICK_CONDITION_FIELD,
  level: QUICK_LEVEL_FIELD,
  complaint: 'chiefComplaint'
} as const

export const resolveQuickLevelFromCondition = (conditionKey: string | undefined): string =>
  String(getQuickTriageMeta(conditionKey).level)

export const buildUtamaViewValues = (
  forms: IgdTriaseFormBySection | undefined
): Record<string, string> => {
  const values: Record<string, string> = {}
  const scopedForms = forms ?? {}

  values[TRIAGE_VIEW_QUICK_CONDITION_FIELD] =
    scopedForms.quick?.[QUICK_TRIAGE_FIELD_NAMES.condition] ?? ''
  values[TRIAGE_VIEW_QUICK_COMPLAINT_FIELD] =
    scopedForms.quick?.[QUICK_TRIAGE_FIELD_NAMES.complaint] ?? ''
  values[TRIAGE_INTERNAL_SUGGESTED_LEVEL_FIELD] =
    scopedForms.umum?.[TRIAGE_INTERNAL_SUGGESTED_LEVEL_FIELD] ?? ''
  values[TRIAGE_INTERNAL_FINAL_LEVEL_FIELD] =
    scopedForms.umum?.[TRIAGE_INTERNAL_FINAL_LEVEL_FIELD] ?? ''
  values[TRIAGE_INTERNAL_FINAL_LEVEL_SOURCE_FIELD] =
    scopedForms.umum?.[TRIAGE_INTERNAL_FINAL_LEVEL_SOURCE_FIELD] ?? ''

  for (const [fieldName, section] of Object.entries(UTAMA_TO_SECTION_FIELD_MAP)) {
    values[fieldName] = scopedForms[section]?.[fieldName] ?? ''
  }

  for (const [fieldName, fieldValue] of Object.entries(scopedForms.matrix ?? {})) {
    values[fieldName] = fieldValue
  }

  return values
}

export const applyUtamaViewValuesToForms = (
  forms: IgdTriaseFormBySection | undefined,
  utamaValues: Record<string, string>,
  criteriaMetaById: Map<number, MatrixCriteriaMeta>
): IgdTriaseFormBySection => {
  const nextForms: IgdTriaseFormBySection = {
    ...(forms ?? {}),
    quick: { ...(forms?.quick ?? {}) },
    primer: { ...(forms?.primer ?? {}) },
    sekunder: { ...(forms?.sekunder ?? {}) },
    umum: { ...(forms?.umum ?? {}) },
    matrix: {}
  }

  const nextQuickCondition = (utamaValues[TRIAGE_VIEW_QUICK_CONDITION_FIELD] ?? '').trim()
  if (nextQuickCondition) {
    nextForms.quick![QUICK_TRIAGE_FIELD_NAMES.condition] = nextQuickCondition
    nextForms.quick![QUICK_TRIAGE_FIELD_NAMES.level] = resolveQuickLevelFromCondition(
      nextQuickCondition
    )
  } else {
    delete nextForms.quick![QUICK_TRIAGE_FIELD_NAMES.condition]
    delete nextForms.quick![QUICK_TRIAGE_FIELD_NAMES.level]
  }

  const nextQuickComplaint = (utamaValues[TRIAGE_VIEW_QUICK_COMPLAINT_FIELD] ?? '').trim()
  if (nextQuickComplaint) {
    nextForms.quick![QUICK_TRIAGE_FIELD_NAMES.complaint] = nextQuickComplaint
  } else {
    delete nextForms.quick![QUICK_TRIAGE_FIELD_NAMES.complaint]
  }

  const nextSuggestedLevel = (utamaValues[TRIAGE_INTERNAL_SUGGESTED_LEVEL_FIELD] ?? '').trim()
  if (nextSuggestedLevel) {
    nextForms.umum![TRIAGE_INTERNAL_SUGGESTED_LEVEL_FIELD] = nextSuggestedLevel
  } else {
    delete nextForms.umum![TRIAGE_INTERNAL_SUGGESTED_LEVEL_FIELD]
  }

  const nextFinalLevel = (utamaValues[TRIAGE_INTERNAL_FINAL_LEVEL_FIELD] ?? '').trim()
  if (nextFinalLevel) {
    nextForms.umum![TRIAGE_INTERNAL_FINAL_LEVEL_FIELD] = nextFinalLevel
  } else {
    delete nextForms.umum![TRIAGE_INTERNAL_FINAL_LEVEL_FIELD]
  }

  const nextFinalLevelSource = (utamaValues[TRIAGE_INTERNAL_FINAL_LEVEL_SOURCE_FIELD] ?? '').trim()
  if (nextFinalLevelSource) {
    nextForms.umum![TRIAGE_INTERNAL_FINAL_LEVEL_SOURCE_FIELD] = nextFinalLevelSource
  } else {
    delete nextForms.umum![TRIAGE_INTERNAL_FINAL_LEVEL_SOURCE_FIELD]
  }

  for (const [fieldName, section] of Object.entries(UTAMA_TO_SECTION_FIELD_MAP)) {
    const nextValue = utamaValues[fieldName] ?? ''
    if (nextValue.trim().length > 0) {
      nextForms[section]![fieldName] = nextValue
      continue
    }
    delete nextForms[section]![fieldName]
  }

  for (const [fieldName, fieldValue] of Object.entries(utamaValues)) {
    if (!isMatrixCriteriaField(fieldName)) continue
    if ((fieldValue ?? '').trim() !== '1') continue
    nextForms.matrix![fieldName] = '1'
  }

  if (criteriaMetaById.size > 0) {
    const selectedCriteriaIds = readSelectedMatrixCriteriaIds(nextForms.matrix)
    const { primerUpdates, sekunderUpdates } = convertMatrixCriteriaSelectionToAssessmentUpdates({
      selectedCriteriaIds,
      criteriaMetaById,
      primerValues: nextForms.primer,
      sekunderValues: nextForms.sekunder
    })
    nextForms.primer = {
      ...(nextForms.primer ?? {}),
      ...primerUpdates
    }
    nextForms.sekunder = {
      ...(nextForms.sekunder ?? {}),
      ...sekunderUpdates
    }
  }

  return nextForms
}
