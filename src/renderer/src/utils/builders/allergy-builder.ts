/**
 * Builder untuk FHIR AllergyIntolerance resource.
 */

export interface AllergyBuilderOptions {
    patientId: string | number
    encounterId: string
    note?: string
    diagnosisCodeId?: number
    kfaCodeId?: number
    clinicalStatus?: 'active' | 'inactive' | 'resolved'
    verificationStatus?: 'unconfirmed' | 'confirmed' | 'refuted' | 'entered-in-error'
    criticality?: 'low' | 'high' | 'unable-to-assess'
    type?: 'allergy' | 'intolerance'
    category?: string
}

export const createAllergy = (options: AllergyBuilderOptions): Record<string, unknown> => ({
    patientId: options.patientId,
    encounterId: options.encounterId,
    note: options.note,
    diagnosisCodeId: options.diagnosisCodeId,
    kfaCodeId: options.kfaCodeId,
    clinicalStatus: options.clinicalStatus || 'active',
    verificationStatus: options.verificationStatus || 'confirmed',
    criticality: options.criticality,
    type: options.type,
    category: options.category
})
