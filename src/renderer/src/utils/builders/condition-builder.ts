/**
 * Builder untuk FHIR Condition resource.
 * Digunakan untuk: Anamnesis, Keluhan Utama, Gejala, Diagnosis.
 */

export const CONDITION_CATEGORIES = {
    CHIEF_COMPLAINT: 'chief-complaint',
    ASSOCIATED_SYMPTOMS: 'problem-list-item',
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
    clinicalStatus?: 'ACTIVE' | 'RECURRENCE' | 'RELAPSE' | 'INACTIVE' | 'REMISSION' | 'RESOLVED' | 'active' | 'recurrence' | 'relapse' | 'inactive' | 'remission' | 'resolved'
    verificationStatus?:
    | 'unconfirmed'
    | 'provisional'
    | 'differential'
    | 'confirmed'
    | 'refuted'
    | 'entered-in-error'
    recordedDate?: string | Date
    onsetPeriod?: { start?: string; end?: string }
    onsetAge?: { value: number; unit: string; system: string; code: string }
}

export const createCondition = (options: ConditionBuilderOptions): Record<string, unknown> => {
    const isKemkes = ['chief-complaint', 'previous-condition'].includes(options.category);
    let display = options.category;
    if (options.category === 'chief-complaint') display = 'Chief Complaint';
    if (options.category === 'problem-list-item') display = 'Problem List Item';
    if (options.category === 'previous-condition') display = 'Previous Condition';

    const condition: Record<string, unknown> = {
        categories: [{
            code: options.category,
            display: display,
            system: isKemkes ? "http://terminology.kemkes.go.id" : "http://terminology.hl7.org/CodeSystem/condition-category"
        }]
    }
    if (options.notes) condition.notes = options.notes
    if (options.diagnosisCodeId) condition.diagnosisCodeId = options.diagnosisCodeId
    if (options.clinicalStatus) condition.clinicalStatus = options.clinicalStatus
    if (options.verificationStatus) condition.verificationStatus = options.verificationStatus
    if (options.recordedDate) condition.recordedDate = options.recordedDate
    if (options.onsetPeriod) condition.onsetPeriod = options.onsetPeriod
    if (options.onsetAge) condition.onsetAge = options.onsetAge
    return condition
}

export const createConditionBatch = (conditions: ConditionBuilderOptions[]): Record<string, unknown>[] =>
    conditions.map((cond) => createCondition(cond))
