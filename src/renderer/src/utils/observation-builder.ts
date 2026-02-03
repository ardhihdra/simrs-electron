export const OBSERVATION_SYSTEMS = {
    LOINC: 'http://loinc.org',
    SNOMED: 'http://snomed.info/sct',
    HL7_INTERPRETATION: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation'
} as const

export const OBSERVATION_CATEGORIES = {
    VITAL_SIGNS: 'vital-signs',
    EXAM: 'exam',
    FALL_RISK: 'fall-risk',
    NUTRITION: 'nutrition',
    IMAGING: 'imaging',
    LABORATORY: 'laboratory',
    PROCEDURE: 'procedure',
    SURVEY: 'survey'
} as const

export interface ObservationBuilderOptions {
    category: string
    code: string
    display: string
    system?: string
    codeCoding?: Array<{ code: string; display: string; system?: string }>
    effectiveDateTime?: string | Date
    issued?: string | Date
    valueQuantity?: { value: number; unit: string }
    valueString?: string
    valueBoolean?: boolean
    interpretations?: Array<{
        code: string
        display: string
        system?: string
    }>
    components?: Array<{
        code: string
        display: string
        system?: string
        valueQuantity?: { value: number; unit: string }
        valueString?: string
    }>
}

export const createObservation = (options: ObservationBuilderOptions): any => {
    const obs: any = {
        category: options.category,
        code: options.code,
        display: options.display,
        system: options.system || OBSERVATION_SYSTEMS.LOINC,
        effectiveDateTime: options.effectiveDateTime
            ? typeof options.effectiveDateTime === 'string'
                ? options.effectiveDateTime
                : options.effectiveDateTime.toISOString()
            : new Date().toISOString()
    }

    if (options.codeCoding) {
        obs.codeCoding = options.codeCoding
    }
    if (options.issued !== undefined) {
        obs.issued = typeof options.issued === 'string' ? options.issued : options.issued.toISOString()
    }
    if (options.valueQuantity !== undefined) {
        obs.valueQuantity = options.valueQuantity
    }
    if (options.valueString !== undefined) {
        obs.valueString = options.valueString
    }
    if (options.valueBoolean !== undefined) {
        obs.valueBoolean = options.valueBoolean
    }
    if (options.interpretations && options.interpretations.length > 0) {
        obs.interpretations = options.interpretations.map((interp) => ({
            ...interp,
            system: interp.system || OBSERVATION_SYSTEMS.HL7_INTERPRETATION
        }))
    }
    if (options.components && options.components.length > 0) {
        obs.components = options.components.map((comp) => ({
            ...comp,
            system: comp.system || OBSERVATION_SYSTEMS.LOINC
        }))
    }

    return obs
}

/**
 * Helper to create HL7 interpretation from risk level text
 */
export const mapRiskLevelToHL7Code = (
    riskLevel: string
): { code: string; display: string } => {
    if (riskLevel === 'Risiko Rendah' || riskLevel === 'Tidak Berisiko') {
        return { code: 'L', display: riskLevel }
    }
    if (riskLevel === 'Risiko Sedang') {
        return { code: 'M', display: riskLevel }
    }
    if (riskLevel === 'Risiko Tinggi') {
        return { code: 'H', display: riskLevel }
    }
    return { code: 'N', display: riskLevel }
}

/**
 * Batch create observations with common metadata
 */
export const createObservationBatch = (
    observations: Omit<ObservationBuilderOptions, 'effectiveDateTime'>[],
    commonDate?: string | Date
): any[] => {
    const effectiveDateTime = commonDate
        ? typeof commonDate === 'string'
            ? commonDate
            : commonDate.toISOString()
        : new Date().toISOString()

    return observations.map((obs) => createObservation({ ...obs, effectiveDateTime }))
}
