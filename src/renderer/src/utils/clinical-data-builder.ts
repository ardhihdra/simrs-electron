/**
 * Condition Builder Utility
 * Standardized helpers for creating FHIR Condition objects (diagnoses, symptoms, etc.)
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
    verificationStatus?: 'unconfirmed' | 'provisional' | 'differential' | 'confirmed' | 'refuted' | 'entered-in-error'
    recordedDate?: string | Date
}

/**
 * Creates a standardized condition object
 */
export const createCondition = (options: ConditionBuilderOptions): any => {
    const condition: any = {
        category: options.category
    }

    if (options.notes) {
        condition.notes = options.notes
    }
    if (options.diagnosisCodeId) {
        condition.diagnosisCodeId = options.diagnosisCodeId
    }
    if (options.clinicalStatus) {
        condition.clinicalStatus = options.clinicalStatus
    }
    if (options.verificationStatus) {
        condition.verificationStatus = options.verificationStatus
    }
    if (options.recordedDate) {
        condition.recordedDate = options.recordedDate
    }

    return condition
}

/**
 * Batch create conditions
 */
export const createConditionBatch = (
    conditions: ConditionBuilderOptions[]
): any[] => {
    return conditions.map((cond) => createCondition(cond))
}

/**
 * Allergy Builder Utility
 */
export interface AllergyBuilderOptions {
    patientId: string | number
    encounterId: string
    note?: string
    diagnosisCodeId?: number
    clinicalStatus?: 'active' | 'inactive' | 'resolved'
    verificationStatus?: 'unconfirmed' | 'confirmed' | 'refuted' | 'entered-in-error'
    criticality?: 'low' | 'high' | 'unable-to-assess'
    type?: 'allergy' | 'intolerance'
}

/**
 * Creates a standardized allergy object
 */
export const createAllergy = (options: AllergyBuilderOptions): any => {
    return {
        patientId: options.patientId,
        encounterId: options.encounterId,
        note: options.note,
        diagnosisCodeId: options.diagnosisCodeId,
        clinicalStatus: options.clinicalStatus || 'active',
        verificationStatus: options.verificationStatus || 'confirmed',
        criticality: options.criticality,
        type: options.type
    }
}

/**
 * Family History Builder Utility
 */
export interface FamilyHistoryCondition {
    diagnosisCodeId: number
    outcome?: string
    contributedToDeath?: boolean
    note?: string
    onsetAge?: number
}

export interface FamilyHistoryBuilderOptions {
    patientId: string | number
    status?: 'partial' | 'completed' | 'entered-in-error' | 'health-unknown'
    relationship?: string
    conditions: FamilyHistoryCondition[]
}

/**
 * Creates a standardized family history object
 */
export const createFamilyHistory = (options: FamilyHistoryBuilderOptions): any => {
    return {
        patientId: options.patientId,
        status: options.status || 'completed',
        relationship: options.relationship || 'other',
        conditions: options.conditions
    }
}
