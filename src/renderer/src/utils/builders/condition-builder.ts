/**
 * Builder untuk FHIR Condition resource.
 * Digunakan untuk: Anamnesis, Keluhan Utama, Gejala, Diagnosis.
 */

export const CONDITION_CATEGORIES = {
    CHIEF_COMPLAINT: 'chief-complaint',
    ASSOCIATED_SYMPTOMS: 'associated-symptoms',
    HISTORY_OF_PRESENT_ILLNESS: 'history-of-present-illness',
    PREVIOUS_CONDITION: 'previous-condition',
    MEDICATION_HISTORY: 'medication-history',
    ENCOUNTER_DIAGNOSIS: 'encounter-diagnosis',
    PROBLEM_LIST: 'problem-list-item'
} as const

export interface ConditionBuilderOptions {
    category: string
    notes?: string
    diagnosisCodeId?: string | number
    clinicalStatus?: 'active' | 'recurrence' | 'relapse' | 'inactive' | 'remission' | 'resolved'
    verificationStatus?:
    | 'unconfirmed'
    | 'provisional'
    | 'differential'
    | 'confirmed'
    | 'refuted'
    | 'entered-in-error'
    recordedDate?: string | Date
}

export const createCondition = (options: ConditionBuilderOptions): Record<string, unknown> => {
    const condition: Record<string, unknown> = {
        category: options.category
    }
    if (options.notes) condition.notes = options.notes
    if (options.diagnosisCodeId) condition.diagnosisCodeId = options.diagnosisCodeId
    if (options.clinicalStatus) condition.clinicalStatus = options.clinicalStatus
    if (options.verificationStatus) condition.verificationStatus = options.verificationStatus
    if (options.recordedDate) condition.recordedDate = options.recordedDate
    return condition
}

export const createConditionBatch = (conditions: ConditionBuilderOptions[]): Record<string, unknown>[] =>
    conditions.map((cond) => createCondition(cond))
