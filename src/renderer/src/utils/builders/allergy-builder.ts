/**
 * Builder untuk FHIR AllergyIntolerance resource.
 */

import { AllergyInput } from "@renderer/hooks/query/use-allergy"

// FIX ME: move to simrs-types
export interface AllergyBuilderOptions {
    patientId: string
    encounterId: string
    note?: string
    diagnosisCodeId?: number
    kfaCodeId?: number
    clinicalStatus?: 'active' | 'inactive' | 'resolved'
    verificationStatus?: 'unconfirmed' | 'confirmed' | 'refuted' | 'entered-in-error'
    criticality?: 'low' | 'high' | 'unable-to-assess'
    type?: 'allergy' | 'intolerance'
    category?: AllergyInput['category']
}

export const createAllergy = (options: AllergyBuilderOptions): AllergyInput => ({
    patientId: options.patientId,
    encounterId: options.encounterId,
    note: options.note,
    diagnosisCodeId: options.diagnosisCodeId,
    // TODO: check if kfaCode should exist in AllergyInput
    // kfaCodeId: options.kfaCodeId,
    clinicalStatus: options.clinicalStatus || 'active',
    verificationStatus: options.verificationStatus || 'confirmed',
    criticality: options.criticality,
    type: options.type,
    category: options.category as AllergyInput['category']
})
