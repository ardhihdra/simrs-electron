// Helper functions to transform observation API data for UI display

export interface ObservationData {
    id?: number
    status: string
    subjectId: string
    encounterId?: string
    effectiveDateTime?: string | Date
    valueQuantity?: { value: number; unit: string }
    valueString?: string
    valueBoolean?: boolean
    categories?: Array<{ code: string; display?: string; system?: string }>
    codeCoding?: Array<{ code: string; display?: string; system?: string }>
    performers?: Array<{ reference: string; display: string; type: string }>
    bodySites?: Array<{ code: string; display: string; system?: string }>
    methods?: Array<{ code: string; display: string; system?: string }>
    interpretations?: Array<{ code: string; display: string; system?: string }>
    notes?: Array<{ text: string; time?: Date | string }>
}

export interface FormattedVitalSigns {
    systolicBloodPressure?: number
    diastolicBloodPressure?: number
    bloodPressureBodySite?: string
    bloodPressurePosition?: string
    temperature?: number
    temperatureMethod?: string
    pulseRate?: number
    pulseRateBodySite?: string
    respiratoryRate?: number
    height?: number
    weight?: number
    bmi?: number
    bmiCategory?: string
    oxygenSaturation?: number
}

export interface FormattedAnamnesis {
    chiefComplaint?: string
    historyOfPresentIllness?: string
    historyOfPastIllness?: string
    allergyHistory?: string
}

export interface FormattedPhysicalExamination {
    consciousness?: string
    generalCondition?: string
    additionalNotes?: string
}

export interface FormattedObservationSummary {
    vitalSigns: FormattedVitalSigns
    anamnesis: FormattedAnamnesis
    physicalExamination: FormattedPhysicalExamination
    performerName?: string
    examinationDate?: string
}

/**
 * Find observation by LOINC code or custom code
 */
export const getObservationByCode = (
    observations: ObservationData[],
    code: string
): ObservationData | undefined => {
    return observations.find((obs) =>
        obs.codeCoding?.some((coding) => coding.code === code)
    )
}

/**
 * Extract quantity value from observation
 */
export const extractQuantityValue = (observation?: ObservationData): number | undefined => {
    return observation?.valueQuantity?.value
}

/**
 * Extract string value from observation
 */
export const extractStringValue = (observation?: ObservationData): string | undefined => {
    return observation?.valueString
}

/**
 * Get body site display text
 */
export const getBodySiteDisplay = (observation?: ObservationData): string | undefined => {
    return observation?.bodySites?.[0]?.display
}

/**
 * Get method display text
 */
export const getMethodDisplay = (observation?: ObservationData): string | undefined => {
    return observation?.methods?.[0]?.display
}

/**
 * Get interpretation display text
 */
export const getInterpretationDisplay = (observation?: ObservationData): string | undefined => {
    return observation?.interpretations?.[0]?.display
}

/**
 * Get performer display text
 */
export const getPerformerDisplay = (observation?: ObservationData): string | undefined => {
    return observation?.performers?.[0]?.display
}

/**
 * Format vital signs from observations
 */
export const formatVitalSigns = (observations: ObservationData[]): FormattedVitalSigns => {
    const systolicObs = getObservationByCode(observations, '8480-6')
    const diastolicObs = getObservationByCode(observations, '8462-4')
    const tempObs = getObservationByCode(observations, '8310-5')
    const pulseObs = getObservationByCode(observations, '8867-4')
    const respObs = getObservationByCode(observations, '9279-1')
    const heightObs = getObservationByCode(observations, '8302-2')
    const weightObs = getObservationByCode(observations, '29463-7')
    const bmiObs = getObservationByCode(observations, '39156-5')
    const spo2Obs = getObservationByCode(observations, '2708-6')

    return {
        systolicBloodPressure: extractQuantityValue(systolicObs),
        diastolicBloodPressure: extractQuantityValue(diastolicObs),
        bloodPressureBodySite: getBodySiteDisplay(systolicObs || diastolicObs),
        bloodPressurePosition: systolicObs?.bodySites?.[1]?.display || diastolicObs?.bodySites?.[1]?.display,
        temperature: extractQuantityValue(tempObs),
        temperatureMethod: getMethodDisplay(tempObs),
        pulseRate: extractQuantityValue(pulseObs),
        pulseRateBodySite: getBodySiteDisplay(pulseObs),
        respiratoryRate: extractQuantityValue(respObs),
        height: extractQuantityValue(heightObs),
        weight: extractQuantityValue(weightObs),
        bmi: extractQuantityValue(bmiObs),
        bmiCategory: getInterpretationDisplay(bmiObs),
        oxygenSaturation: extractQuantityValue(spo2Obs)
    }
}

/**
 * Format anamnesis from observations
 */
export const formatAnamnesis = (observations: ObservationData[]): FormattedAnamnesis => {
    const chiefComplaintObs = getObservationByCode(observations, 'chief-complaint')
    const historyPresentObs = getObservationByCode(observations, 'history-present-illness')
    const historyPastObs = getObservationByCode(observations, 'history-past-illness')
    const allergyObs = getObservationByCode(observations, 'allergy-history')

    return {
        chiefComplaint: extractStringValue(chiefComplaintObs),
        historyOfPresentIllness: extractStringValue(historyPresentObs),
        historyOfPastIllness: extractStringValue(historyPastObs),
        allergyHistory: extractStringValue(allergyObs)
    }
}

/**
 * Format physical examination from observations
 */
export const formatPhysicalExamination = (
    observations: ObservationData[]
): FormattedPhysicalExamination => {
    const consciousnessObs = getObservationByCode(observations, 'consciousness')
    const generalConditionObs = getObservationByCode(observations, 'general-condition')
    const notesObs = getObservationByCode(observations, 'physical-exam-notes')

    return {
        consciousness: extractStringValue(consciousnessObs),
        generalCondition: extractStringValue(generalConditionObs),
        additionalNotes: extractStringValue(notesObs)
    }
}

/**
 * Get performer and date information from first observation
 */
export const getObservationMetadata = (
    observations: ObservationData[]
): { performerName?: string; examinationDate?: string } => {
    const firstObs = observations[0]
    if (!firstObs) return {}

    return {
        performerName: getPerformerDisplay(firstObs),
        examinationDate: firstObs.effectiveDateTime
            ? new Date(firstObs.effectiveDateTime).toISOString()
            : undefined
    }
}

/**
 * Transform all observations into formatted summary
 */
export const formatObservationSummary = (
    allObservations: ObservationData[]
): FormattedObservationSummary => {
    const vitalSigns = formatVitalSigns(allObservations)
    const anamnesis = formatAnamnesis(allObservations)
    const physicalExamination = formatPhysicalExamination(allObservations)
    const metadata = getObservationMetadata(allObservations)

    return {
        vitalSigns,
        anamnesis,
        physicalExamination,
        ...metadata
    }
}
