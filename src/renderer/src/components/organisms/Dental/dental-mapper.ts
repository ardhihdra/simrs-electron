import type { ToothDetail } from './type'
import {
    TOOTH_SNOMED_CODES,
    CONDITION_SNOMED_CODES,
    DEFAULT_DENTAL_CONDITION,
    SNOMED_SYSTEM
} from './dental-constants'

interface DentalFormData {
    date: any
    treatment: { code: string; name: string } | string // Support both object and string (legacy)
    condition: string
    dentist: string
    tooth: ToothDetail[]
    status: 'done' | 'pending'
    notes?: string
}

interface PerformerInfo {
    id: string
    name: string
    role?: string
}

export interface DentalObservationPayload {
    category: string
    code: string
    display: string
    system: string
    valueString?: string
    bodySites: Array<{
        code: string
        display: string
        system: string
    }>
    components?: Array<{
        code: string
        display: string
        system: string
        valueString?: string
    }>
    notes?: string[]
}

export function mapDentalDataToObservationPayload(
    dentalData: DentalFormData,
    encounterId: string,
    patientId: string,
    performer: PerformerInfo
) {
    const observations: DentalObservationPayload[] = []

    const conditionKey = dentalData.condition.toLowerCase().trim()
    const conditionCode =
        CONDITION_SNOMED_CODES[conditionKey] || DEFAULT_DENTAL_CONDITION
    const treatmentName = typeof dentalData.treatment === 'string'
        ? dentalData.treatment
        : dentalData.treatment.name

    const treatmentCode = typeof dentalData.treatment === 'object'
        ? dentalData.treatment.code
        : null

    dentalData.tooth.forEach((tooth) => {
        const toothCode = TOOTH_SNOMED_CODES[tooth.id]

        if (!toothCode) {
            console.warn(`Unknown tooth ID: ${tooth.id}`)
            return
        }

        const toothNumber = tooth.id.replace('teeth-', '')
        const noteText = `Tooth ${toothNumber}: ${dentalData.condition} - ${treatmentName}`

        const payload: DentalObservationPayload = {
            category: 'exam',
            code: conditionCode.code,
            display: conditionCode.display,
            system: SNOMED_SYSTEM,
            valueString: treatmentName,
            bodySites: [
                {
                    code: toothCode.code,
                    display: toothCode.display,
                    system: SNOMED_SYSTEM
                }
            ],
            notes: [noteText, dentalData.notes].filter(Boolean) as string[]
        }

        if (treatmentCode) {
            payload.components = [{
                code: treatmentCode,
                display: treatmentName,
                system: "http://hl7.org/fhir/sid/icd-9-cm",
                valueString: treatmentName
            }]
        }

        observations.push(payload)
    })

    return {
        encounterId,
        patientId,
        performerId: performer.id,
        performerName: performer.name,
        observations
    }
}

export function getToothNumber(toothId: string): string {
    return toothId.replace('teeth-', '')
}

/**
 * Validate if tooth ID exists in SNOMED codes
 */
export function isValidToothId(toothId: string): boolean {
    return toothId in TOOTH_SNOMED_CODES
}

/**
 * Get SNOMED code for a tooth
 */
export function getToothSNOMEDCode(toothId: string) {
    return TOOTH_SNOMED_CODES[toothId]
}

/**
 * Get SNOMED code for a condition
 */
export function getConditionSNOMEDCode(condition: string) {
    const key = condition.toLowerCase().trim()
    return CONDITION_SNOMED_CODES[key] || DEFAULT_DENTAL_CONDITION
}
