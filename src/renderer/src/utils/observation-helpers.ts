import dayjs from 'dayjs'
import {
    ConditionData,
    FormattedAnamnesis,
    formatAnamnesisFromConditions
} from './condition-helpers'
import { HEAD_TO_TOE_MAP } from '../config/observation-maps'

export interface ObservationData {
    id?: number
    status: string
    subjectId: string
    encounterId?: string
    effectiveDateTime?: string | Date
    issued?: string | Date
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
    components?: Array<{
        code?: string
        display?: string
        codeSystem?: string
        valueQuantity?: { value: number; unit: string }
        valueString?: string
        valueBoolean?: boolean
    }>
}

export interface FormattedVitalSigns {
    systolicBloodPressure?: number
    diastolicBloodPressure?: number
    bloodPressureBodySite?: string
    bloodPressurePosition?: string
    temperature?: number
    temperatureMethod?: string
    pulseRate?: number
    heartRate?: number
    pulseRateBodySite?: string
    respiratoryRate?: number
    height?: number
    weight?: number
    bmi?: number
    bmiCategory?: string
    oxygenSaturation?: number
    gcsEye?: number
    gcsVerbal?: number
    gcsMotor?: number
}

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

    const gcsEyeObs = getObservationByCode(observations, '9267-5')
    const gcsVerbalObs = getObservationByCode(observations, '9270-9')
    const gcsMotorObs = getObservationByCode(observations, '9268-3')

    return {
        systolicBloodPressure: extractQuantityValue(systolicObs),
        diastolicBloodPressure: extractQuantityValue(diastolicObs),
        bloodPressureBodySite: getBodySiteDisplay(systolicObs || diastolicObs),
        bloodPressurePosition: systolicObs?.bodySites?.[1]?.display || diastolicObs?.bodySites?.[1]?.display,
        temperature: extractQuantityValue(tempObs),
        temperatureMethod: getMethodDisplay(tempObs),
        pulseRate: extractQuantityValue(pulseObs),
        heartRate: extractQuantityValue(pulseObs),
        pulseRateBodySite: getBodySiteDisplay(pulseObs),
        respiratoryRate: extractQuantityValue(respObs),
        height: extractQuantityValue(heightObs),
        weight: extractQuantityValue(weightObs),
        bmi: extractQuantityValue(bmiObs),
        bmiCategory: getInterpretationDisplay(bmiObs),
        oxygenSaturation: extractQuantityValue(spo2Obs),
        gcsEye: extractQuantityValue(gcsEyeObs),
        gcsVerbal: extractQuantityValue(gcsVerbalObs),
        gcsMotor: extractQuantityValue(gcsMotorObs)
    }
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

export interface FormattedPainAssessment {
    painScore?: number
    chestPain?: string
    painNotes?: string
}

export interface FormattedFallRisk {
    gugA?: string
    gugB?: string
    // Morse Fall Scale
    history_falling?: number
    secondary_diagnosis?: number
    ambulatory_aid?: number
    iv_therapy?: number
    gait?: number
    mental_status?: number
    fall_risk_score?: number
    fall_risk_level?: string
    // Humpty Dumpty Scale
    hd_age?: number
    hd_gender?: number
    hd_diagnosis?: number
    hd_cognitive?: number
    hd_environmental?: number
    hd_surgery?: number
    hd_medication?: number
    hd_score?: number
    hd_level?: string
    // Edmonson Scale
    ed_age?: number
    ed_mental?: number
    ed_elimination?: number
    ed_medication?: number
    ed_diagnosis?: number
    ed_ambulation?: number
    ed_nutrition?: number
    ed_sleep?: number
    ed_score?: number
    ed_level?: string
}

export interface FormattedFunctionalStatus {
    aids_check?: string
    disability_check?: string
    adl_check?: string
}

export interface FormattedPsychosocialHistory {
    psychological_status?: string
    family_relation_note?: string
    living_with_note?: string
    religion?: string
    culture_values?: string
    daily_language?: string
}

export interface FormattedScreening {
    consciousness_level?: string
    breathing_status?: string
    cough_screening_status?: string
}

export interface FormattedNutritionScreening {
    mst_weight_loss?: number
    mst_eating_poorly?: number
    mst_total_score?: number
    mst_risk_level?: string
}

export interface FormattedConclusion {
    decision?: string
}

export interface FormattedHeadToToe {
    [key: string]: {
        value?: string
        isNormal?: boolean
    }
}

export interface FormattedObservationSummary {
    vitalSigns: FormattedVitalSigns
    anamnesis: FormattedAnamnesis
    physicalExamination: FormattedPhysicalExamination
    painAssessment: FormattedPainAssessment
    fallRisk: FormattedFallRisk
    functionalStatus: FormattedFunctionalStatus
    psychosocialHistory: FormattedPsychosocialHistory
    screening: FormattedScreening
    nutrition: FormattedNutritionScreening
    conclusion: FormattedConclusion
    headToToe: FormattedHeadToToe
    clinicalNote?: string
    performerName?: string
    examinationDate?: string
}

export const getObservationByCode = (
    observations: ObservationData[],
    code: string
): ObservationData | any | undefined => {
    // Search for the FIRST match (assuming LATEST first if sorted DESC)
    for (const obs of observations) {
        // Check top level codeCoding
        if (obs.codeCoding?.some((coding) => coding.code === code)) {
            return obs
        }
        // Check components
        if (obs.components) {
            const comp = obs.components.find((c) => c.code === code)
            if (comp) {
                // Return a synthetic observation combining parent metadata and component value
                return {
                    ...obs,
                    codeCoding: [{ code: comp.code, display: comp.display, system: comp.codeSystem }],
                    valueQuantity: comp.valueQuantity,
                    valueString: comp.valueString,
                    valueBoolean: comp.valueBoolean
                }
            }
        }
    }
    return undefined
}

export const extractQuantityValue = (observation?: ObservationData): number | undefined => {
    return observation?.valueQuantity?.value
}

export const extractStringValue = (observation?: ObservationData): string | undefined => {
    return observation?.valueString
}

export const getBodySiteDisplay = (observation?: ObservationData): string | undefined => {
    return observation?.bodySites?.[0]?.display
}

export const getMethodDisplay = (observation?: ObservationData): string | undefined => {
    return observation?.methods?.[0]?.display
}

export const getInterpretationDisplay = (observation?: ObservationData): string | undefined => {
    return observation?.interpretations?.[0]?.display
}


export const getPerformerDisplay = (observation?: ObservationData): string | undefined => {
    return observation?.performers?.[0]?.display
}


export const formatAnamnesis = (observations: ObservationData[]): FormattedAnamnesis => {
    const chiefComplaintObs = getObservationByCode(observations, 'chief-complaint')
    const historyPresentObs = getObservationByCode(observations, 'history-present-illness')
    const historyPastObs = getObservationByCode(observations, 'history-past-illness')
    const allergyObs = getObservationByCode(observations, 'allergy-history')
    const symptomsObs = getObservationByCode(observations, 'associated-symptoms')
    const familyHistoryObs = getObservationByCode(observations, 'family-history')
    const medicationHistoryObs = getObservationByCode(observations, 'medication-history')

    return {
        chiefComplaint: extractStringValue(chiefComplaintObs),
        historyOfPresentIllness: extractStringValue(historyPresentObs),
        historyOfPastIllness: extractStringValue(historyPastObs),
        allergyHistory: extractStringValue(allergyObs),
        associatedSymptoms: extractStringValue(symptomsObs),
        familyHistory: extractStringValue(familyHistoryObs),
        medicationHistory: extractStringValue(medicationHistoryObs)
    }
}

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

export const formatPainAssessment = (observations: ObservationData[]): FormattedPainAssessment => {
    const painScoreObs = getObservationByCode(observations, 'pain-score')
    const chestPainObs = getObservationByCode(observations, 'chest-pain-check')
    const painNotesObs = getObservationByCode(observations, 'pain-notes')

    return {
        painScore: extractQuantityValue(painScoreObs),
        chestPain: extractStringValue(chestPainObs),
        painNotes: extractStringValue(painNotesObs)
    }
}

export const formatFallRisk = (observations: ObservationData[]): FormattedFallRisk => {
    const gugAObs = getObservationByCode(observations, 'fall-risk-gug-a')
    const gugBObs = getObservationByCode(observations, 'fall-risk-gug-b')

    // Morse Scale
    const historyObs = getObservationByCode(observations, 'history_falling')
    const secondaryObs = getObservationByCode(observations, 'secondary_diagnosis')
    const aidObs = getObservationByCode(observations, 'ambulatory_aid')
    const ivObs = getObservationByCode(observations, 'iv_therapy')
    const gaitObs = getObservationByCode(observations, 'gait')
    const mentalObs = getObservationByCode(observations, 'mental_status')
    const scoreObs = getObservationByCode(observations, '59460-6')
    const levelObs = getObservationByCode(observations, '713513002')

    return {
        gugA: extractStringValue(gugAObs),
        gugB: extractStringValue(gugBObs),
        history_falling: extractQuantityValue(historyObs),
        secondary_diagnosis: extractQuantityValue(secondaryObs),
        ambulatory_aid: extractQuantityValue(aidObs),
        iv_therapy: extractQuantityValue(ivObs),
        gait: extractQuantityValue(gaitObs),
        mental_status: extractQuantityValue(mentalObs),
        fall_risk_score: extractQuantityValue(scoreObs),
        fall_risk_level: extractStringValue(levelObs),

        // Humpty Dumpty
        hd_age: extractQuantityValue(getObservationByCode(observations, 'hd_age')),
        hd_gender: extractQuantityValue(getObservationByCode(observations, 'hd_gender')),
        hd_diagnosis: extractQuantityValue(getObservationByCode(observations, 'hd_diagnosis')),
        hd_cognitive: extractQuantityValue(getObservationByCode(observations, 'hd_cognitive')),
        hd_environmental: extractQuantityValue(getObservationByCode(observations, 'hd_environmental')),
        hd_surgery: extractQuantityValue(getObservationByCode(observations, 'hd_surgery')),
        hd_medication: extractQuantityValue(getObservationByCode(observations, 'hd_medication')),
        hd_score: extractQuantityValue(getObservationByCode(observations, 'hd_score')),
        hd_level: extractStringValue(getObservationByCode(observations, 'hd_level')),

        // Edmonson
        ed_age: extractQuantityValue(getObservationByCode(observations, 'ed_age')),
        ed_mental: extractQuantityValue(getObservationByCode(observations, 'ed_mental')),
        ed_elimination: extractQuantityValue(getObservationByCode(observations, 'ed_elimination')),
        ed_medication: extractQuantityValue(getObservationByCode(observations, 'ed_medication')),
        ed_diagnosis: extractQuantityValue(getObservationByCode(observations, 'ed_diagnosis')),
        ed_ambulation: extractQuantityValue(getObservationByCode(observations, 'ed_ambulation')),
        ed_nutrition: extractQuantityValue(getObservationByCode(observations, 'ed_nutrition')),
        ed_sleep: extractQuantityValue(getObservationByCode(observations, 'ed_sleep')),
        ed_score: extractQuantityValue(getObservationByCode(observations, 'ed_score')),
        ed_level: extractStringValue(getObservationByCode(observations, 'ed_level'))
    }
}

export const formatFunctionalStatus = (observations: ObservationData[]): FormattedFunctionalStatus => {
    const aidsObs = getObservationByCode(observations, 'functional-status-aids')
    const disabilityObs = getObservationByCode(observations, 'functional-status-disability')
    const adlObs = getObservationByCode(observations, 'functional-status-adl')

    return {
        aids_check: extractStringValue(aidsObs),
        disability_check: extractStringValue(disabilityObs),
        adl_check: extractStringValue(adlObs)
    }
}

export const formatPsychosocialHistory = (
    observations: ObservationData[]
): FormattedPsychosocialHistory => {
    const psychObs = getObservationByCode(observations, 'psychological-status')
    const familyObs = getObservationByCode(observations, 'family-relation-note')
    const livingObs = getObservationByCode(observations, 'living-with-note')
    const religionObs = getObservationByCode(observations, 'patient-religion')
    const cultureObs = getObservationByCode(observations, 'culture-values')
    const languageObs = getObservationByCode(observations, 'daily-language')

    return {
        psychological_status: extractStringValue(psychObs),
        family_relation_note: extractStringValue(familyObs),
        living_with_note: extractStringValue(livingObs),
        religion: extractStringValue(religionObs),
        culture_values: extractStringValue(cultureObs),
        daily_language: extractStringValue(languageObs)
    }
}

export const formatScreening = (observations: ObservationData[]): FormattedScreening => {
    const consciousnessObs = getObservationByCode(observations, 'consciousness-level')
    const breathingObs = getObservationByCode(observations, 'breathing-status')
    const coughObs = getObservationByCode(observations, 'cough-screening')

    return {
        consciousness_level: extractStringValue(consciousnessObs),
        breathing_status: extractStringValue(breathingObs),
        cough_screening_status: extractStringValue(coughObs)
    }
}

export const formatConclusion = (observations: ObservationData[]): FormattedConclusion => {
    const decisionObs = getObservationByCode(observations, 'tindak-lanjut-keputusan')

    return {
        decision: extractStringValue(decisionObs)
    }
}

export const formatNutritionScreening = (observations: ObservationData[]): FormattedNutritionScreening => {
    const weightLossObs = getObservationByCode(observations, '44876-8')
    const eatingObs = getObservationByCode(observations, '44875-0')
    const scoreObs = getObservationByCode(observations, '56078-9')
    const riskObs = getObservationByCode(observations, 'nutrition-risk')

    return {
        mst_weight_loss: extractQuantityValue(weightLossObs),
        mst_eating_poorly: extractQuantityValue(eatingObs),
        mst_total_score: extractQuantityValue(scoreObs),
        mst_risk_level: extractStringValue(riskObs)
    }
}

export const formatHeadToToe = (observations: ObservationData[]): FormattedHeadToToe => {
    const headToToe: FormattedHeadToToe = {}

    Object.keys(HEAD_TO_TOE_MAP).forEach((code) => {
        const obs = getObservationByCode(observations, code)
        if (obs) {
            const isAbnormal = obs.interpretations?.some((i) => i.code === 'A') || obs.valueBoolean === false
            headToToe[code] = {
                value: obs.valueString,
                isNormal: !isAbnormal
            }
        }
    })

    return headToToe
}

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

export const formatObservationSummary = (
    allObservations: ObservationData[],
    allConditions: ConditionData[] = []
): FormattedObservationSummary => {
    // SORT DESC: Latest records first for clinical templates
    const sortedObs = [...allObservations].sort((a, b) => {
        const dateA = dayjs(a.effectiveDateTime || a.issued || 0).valueOf()
        const dateB = dayjs(b.effectiveDateTime || b.issued || 0).valueOf()
        return dateB - dateA
    })

    const sortedCond = [...allConditions].sort((a, b) => {
        const dateA = dayjs(a.recordedDate || a.onsetDateTime || 0).valueOf()
        const dateB = dayjs(b.recordedDate || b.onsetDateTime || 0).valueOf()
        return dateB - dateA
    })

    const vitalSigns = formatVitalSigns(sortedObs)
    const anamnesisFromObs = formatAnamnesis(sortedObs)
    const anamnesisFromCond = formatAnamnesisFromConditions(sortedCond)
    const physicalExamination = formatPhysicalExamination(sortedObs)
    const painAssessment = formatPainAssessment(sortedObs)
    const fallRisk = formatFallRisk(sortedObs)
    const functionalStatus = formatFunctionalStatus(sortedObs)
    const psychosocialHistory = formatPsychosocialHistory(sortedObs)
    const screening = formatScreening(sortedObs)
    const nutrition = formatNutritionScreening(sortedObs)
    const conclusion = formatConclusion(sortedObs)
    const headToToe = formatHeadToToe(sortedObs)
    const clinicalNoteObs = getObservationByCode(sortedObs, '8410-0')
    const metadata = getObservationMetadata(sortedObs)

    const anamnesis = {
        ...anamnesisFromObs,
        ...Object.fromEntries(Object.entries(anamnesisFromCond).filter(([key, v]) => v && key))
    }

    return {
        vitalSigns,
        anamnesis,
        physicalExamination,
        painAssessment,
        fallRisk,
        functionalStatus,
        psychosocialHistory,
        screening,
        nutrition,
        conclusion,
        headToToe,
        clinicalNote: clinicalNoteObs?.valueString,
        ...metadata
    }
}
