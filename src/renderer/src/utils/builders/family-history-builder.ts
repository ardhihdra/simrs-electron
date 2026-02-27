/**
 * Builder untuk FHIR FamilyMemberHistory resource.
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

export const createFamilyHistory = (options: FamilyHistoryBuilderOptions): Record<string, unknown> => ({
    patientId: options.patientId,
    status: options.status || 'completed',
    relationship: options.relationship || 'other',
    conditions: options.conditions
})
