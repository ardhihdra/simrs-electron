/**
 * Builder untuk FHIR FamilyMemberHistory resource.
 */

import { FamilyHistoryInput } from "@renderer/hooks/query/use-family-history"

export interface FamilyHistoryCondition {
    diagnosisCodeId: number
    outcome?: string
    contributedToDeath?: boolean
    note?: string
    onsetAge?: number
}

export interface FamilyHistoryBuilderOptions {
    patientId: string
    status?: 'partial' | 'completed' | 'entered-in-error' | 'health-unknown'
    relationship?: string
    conditions: FamilyHistoryCondition[]
}

export const createFamilyHistory = (options: FamilyHistoryBuilderOptions): FamilyHistoryInput => ({
    patientId: options.patientId,
    status: options.status || 'completed',
    relationship: options.relationship || 'other',
    conditions: options.conditions
})
