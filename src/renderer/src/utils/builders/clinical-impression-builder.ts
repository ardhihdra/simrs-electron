import { CLINICAL_IMPRESSION_CATEGORIES, CLINICAL_IMPRESSION_CODES } from "@renderer/config/maps/clinical-impression-maps"

export interface ClinicalImpressionBuilderOptions {
    patientId: string
    patientName?: string
    encounterId?: string
    practitionerId?: string
    status?: 'in-progress' | 'completed' | 'entered-in-error'
    summary?: string
    description?: string
    effectiveDateTime?: string
    category: typeof CLINICAL_IMPRESSION_CATEGORIES[keyof typeof CLINICAL_IMPRESSION_CATEGORIES]
    investigations?: Array<{ id: string, display?: string }>
}

export const createClinicalImpression = (
    options: ClinicalImpressionBuilderOptions
): Record<string, unknown> => {

    let coding: Array<{ system: string, code: string, display: string }> = [
        {
            system: CLINICAL_IMPRESSION_CODES.HISTORY_OF_DISORDER.system,
            code: CLINICAL_IMPRESSION_CODES.HISTORY_OF_DISORDER.code,
            display: CLINICAL_IMPRESSION_CODES.HISTORY_OF_DISORDER.display
        }
    ]

    if (options.category === CLINICAL_IMPRESSION_CATEGORIES.CLINICAL_RATIONALE) {
        coding = [
            {
                system: CLINICAL_IMPRESSION_CODES.RASIONAL_KLINIS.system,
                code: CLINICAL_IMPRESSION_CODES.RASIONAL_KLINIS.code,
                display: CLINICAL_IMPRESSION_CODES.RASIONAL_KLINIS.display
            }
        ]
    }

    const code = { coding }

    const now = options.effectiveDateTime || new Date().toISOString()

    const impression: Record<string, unknown> = {
        resourceType: "ClinicalImpression",
        status: options.status || 'completed',
        code,
        subject: {
            reference: `Patient/${options.patientId}`,
            display: options.patientName || `Patient ${options.patientId}`,
        },
        effectiveDateTime: now,
        date: now,
        // Optional flat field to ensure backend compatibility
        subjectId: options.patientId,
    }

    if (options.encounterId) {
        impression.encounterId = options.encounterId // flat field
        impression.encounter = {
            reference: `Encounter/${options.encounterId}`
        }
    }

    if (options.practitionerId) {
        impression.assessor = {
            reference: `Practitioner/${options.practitionerId}`
        }
    }

    if (options.investigations && options.investigations.length > 0) {
        impression.investigation = [{
            code: {
                coding: [
                    {
                        system: "http://snomed.info/sct",
                        code: "271336007",
                        display: "Examination / signs"
                    }
                ]
            },
            item: options.investigations.map(inv => {
                const itemRef: any = {
                    reference: `Observation/${inv.id}`
                }
                if (inv.display) itemRef.display = inv.display
                return itemRef
            })
        }]
    }

    if (options.summary) impression.summary = options.summary
    if (options.description) impression.description = options.description

    // Use description to persist category distinctiveness (e.g. clinical-course vs clinical-rationale) 
    // since both use the same SNOMED code "312850006" History of disorder
    if (options.category) impression.description = options.category;

    return impression
}
