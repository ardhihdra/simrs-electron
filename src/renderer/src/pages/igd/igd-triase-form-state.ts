/**
 * purpose: Util state form triase untuk tab UI `Utama` (view gabungan lintas section internal) serta auto level quick triase.
 * main callers: `IgdTriasePage` dan `IgdTriaseFormCard`.
 * key dependencies: `getQuickTriageMeta` dan util matrix-sync triase.
 * main/public functions: `resolveQuickLevelFromCondition`, `buildUtamaViewValues`, `applyUtamaViewValuesToForms`.
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

export const QUICK_TRIAGE_FIELD_NAMES = {
  condition: 'quickCondition',
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
    primer: { ...(forms?.primer ?? {}) },
    sekunder: { ...(forms?.sekunder ?? {}) },
    umum: { ...(forms?.umum ?? {}) },
    matrix: {}
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
