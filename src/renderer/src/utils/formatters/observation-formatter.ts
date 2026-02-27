import dayjs from 'dayjs'
import type { ConditionData, FormattedAnamnesis } from './condition-formatter'
import { formatAnamnesisFromConditions } from './condition-formatter'
import { HEAD_TO_TOE_MAP } from '../../config/maps/observation-maps'

export interface ObservationData {
    id?: string | number
    status?: string
    subjectId?: string
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

// ─── Primitive extractors ────────────────────────────────────────────────────

export const getObservationByCode = (
    observations: ObservationData[],
    code: string
): ObservationData | undefined => {
    for (const obs of observations) {
        if (obs.codeCoding?.some((c) => c.code === code)) return obs
        if (obs.components) {
            const comp = obs.components.find((c) => c.code === code)
            if (comp) {
                return {
                    ...obs,
                    codeCoding: [{ code: comp.code ?? '', display: comp.display, system: comp.codeSystem }],
                    valueQuantity: comp.valueQuantity,
                    valueString: comp.valueString,
                    valueBoolean: comp.valueBoolean
                }
            }
        }
    }
    return undefined
}

export const extractQuantityValue = (obs?: ObservationData): number | undefined =>
    obs?.valueQuantity?.value

export const extractStringValue = (obs?: ObservationData): string | undefined => obs?.valueString

export const getBodySiteDisplay = (obs?: ObservationData): string | undefined =>
    obs?.bodySites?.[0]?.display

export const getMethodDisplay = (obs?: ObservationData): string | undefined =>
    obs?.methods?.[0]?.display

export const getInterpretationDisplay = (obs?: ObservationData): string | undefined =>
    obs?.interpretations?.[0]?.display

export const getPerformerDisplay = (obs?: ObservationData): string | undefined =>
    obs?.performers?.[0]?.display

// ─── Domain formatters ───────────────────────────────────────────────────────

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
    const g = (code: string) => getObservationByCode(observations, code)
    const systolicObs = g('8480-6')
    const diastolicObs = g('8462-4')
    return {
        systolicBloodPressure: extractQuantityValue(systolicObs),
        diastolicBloodPressure: extractQuantityValue(diastolicObs),
        bloodPressureBodySite: getBodySiteDisplay(systolicObs || diastolicObs),
        bloodPressurePosition:
            systolicObs?.bodySites?.[1]?.display || diastolicObs?.bodySites?.[1]?.display,
        temperature: extractQuantityValue(g('8310-5')),
        temperatureMethod: getMethodDisplay(g('8310-5')),
        pulseRate: extractQuantityValue(g('8867-4')),
        heartRate: extractQuantityValue(g('8867-4')),
        pulseRateBodySite: getBodySiteDisplay(g('8867-4')),
        respiratoryRate: extractQuantityValue(g('9279-1')),
        height: extractQuantityValue(g('8302-2')),
        weight: extractQuantityValue(g('29463-7')),
        bmi: extractQuantityValue(g('39156-5')),
        bmiCategory: getInterpretationDisplay(g('39156-5')),
        oxygenSaturation: extractQuantityValue(g('2708-6')),
        gcsEye: extractQuantityValue(g('9267-5')),
        gcsVerbal: extractQuantityValue(g('9270-9')),
        gcsMotor: extractQuantityValue(g('9268-3'))
    }
}

export interface FormattedPhysicalExamination {
    consciousness?: string
    generalCondition?: string
    additionalNotes?: string
}

export const formatPhysicalExamination = (
    observations: ObservationData[]
): FormattedPhysicalExamination => ({
    consciousness: extractStringValue(getObservationByCode(observations, 'consciousness')),
    generalCondition: extractStringValue(getObservationByCode(observations, 'general-condition')),
    additionalNotes: extractStringValue(getObservationByCode(observations, 'physical-exam-notes'))
})

export interface FormattedPainAssessment {
    painScore?: number
    chestPain?: string
    painNotes?: string
}

export const formatPainAssessment = (
    observations: ObservationData[]
): FormattedPainAssessment => ({
    painScore: extractQuantityValue(getObservationByCode(observations, 'pain-score')),
    chestPain: extractStringValue(getObservationByCode(observations, 'chest-pain-check')),
    painNotes: extractStringValue(getObservationByCode(observations, 'pain-notes'))
})

export interface FormattedFallRisk {
    gugA?: string
    gugB?: string
    history_falling?: number
    secondary_diagnosis?: number
    ambulatory_aid?: number
    iv_therapy?: number
    gait?: number
    mental_status?: number
    fall_risk_score?: number
    fall_risk_level?: string
    hd_age?: number
    hd_gender?: number
    hd_diagnosis?: number
    hd_cognitive?: number
    hd_environmental?: number
    hd_surgery?: number
    hd_medication?: number
    hd_score?: number
    hd_level?: string
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

export const formatFallRisk = (observations: ObservationData[]): FormattedFallRisk => {
    const g = (code: string) => getObservationByCode(observations, code)
    const qv = (code: string) => extractQuantityValue(g(code))
    const sv = (code: string) => extractStringValue(g(code))
    return {
        gugA: sv('fall-risk-gug-a'),
        gugB: sv('fall-risk-gug-b'),
        history_falling: qv('history_falling'),
        secondary_diagnosis: qv('secondary_diagnosis'),
        ambulatory_aid: qv('ambulatory_aid'),
        iv_therapy: qv('iv_therapy'),
        gait: qv('gait'),
        mental_status: qv('mental_status'),
        fall_risk_score: qv('59460-6'),
        fall_risk_level: sv('713513002'),
        hd_age: qv('hd_age'), hd_gender: qv('hd_gender'), hd_diagnosis: qv('hd_diagnosis'),
        hd_cognitive: qv('hd_cognitive'), hd_environmental: qv('hd_environmental'),
        hd_surgery: qv('hd_surgery'), hd_medication: qv('hd_medication'),
        hd_score: qv('hd_score'), hd_level: sv('hd_level'),
        ed_age: qv('ed_age'), ed_mental: qv('ed_mental'), ed_elimination: qv('ed_elimination'),
        ed_medication: qv('ed_medication'), ed_diagnosis: qv('ed_diagnosis'),
        ed_ambulation: qv('ed_ambulation'), ed_nutrition: qv('ed_nutrition'),
        ed_sleep: qv('ed_sleep'), ed_score: qv('ed_score'), ed_level: sv('ed_level')
    }
}

export interface FormattedFunctionalStatus {
    aids_check?: string
    disability_check?: string
    adl_check?: string
}

export const formatFunctionalStatus = (
    observations: ObservationData[]
): FormattedFunctionalStatus => ({
    aids_check: extractStringValue(getObservationByCode(observations, 'functional-status-aids')),
    disability_check: extractStringValue(
        getObservationByCode(observations, 'functional-status-disability')
    ),
    adl_check: extractStringValue(getObservationByCode(observations, 'functional-status-adl'))
})

export interface FormattedPsychosocialHistory {
    psychological_status?: string
    family_relation_note?: string
    living_with_note?: string
    religion?: string
    culture_values?: string
    daily_language?: string
}

export const formatPsychosocialHistory = (
    observations: ObservationData[]
): FormattedPsychosocialHistory => {
    const sv = (code: string) => extractStringValue(getObservationByCode(observations, code))
    return {
        psychological_status: sv('psychological-status'),
        family_relation_note: sv('family-relation-note'),
        living_with_note: sv('living-with-note'),
        religion: sv('patient-religion'),
        culture_values: sv('culture-values'),
        daily_language: sv('daily-language')
    }
}

export interface FormattedScreening {
    consciousness_level?: string
    breathing_status?: string
    cough_screening_status?: string
}

export const formatScreening = (observations: ObservationData[]): FormattedScreening => {
    const sv = (code: string) => extractStringValue(getObservationByCode(observations, code))
    return {
        consciousness_level: sv('consciousness-level'),
        breathing_status: sv('breathing-status'),
        cough_screening_status: sv('cough-screening')
    }
}

export interface FormattedNutritionScreening {
    mst_weight_loss?: number
    mst_eating_poorly?: number
    mst_total_score?: number
    mst_risk_level?: string
}

export const formatNutritionScreening = (
    observations: ObservationData[]
): FormattedNutritionScreening => ({
    mst_weight_loss: extractQuantityValue(getObservationByCode(observations, '44876-8')),
    mst_eating_poorly: extractQuantityValue(getObservationByCode(observations, '44875-0')),
    mst_total_score: extractQuantityValue(getObservationByCode(observations, '56078-9')),
    mst_risk_level: extractStringValue(getObservationByCode(observations, 'nutrition-risk'))
})

export interface FormattedConclusion {
    decision?: string
}

export const formatConclusion = (observations: ObservationData[]): FormattedConclusion => ({
    decision: extractStringValue(getObservationByCode(observations, 'tindak-lanjut-keputusan'))
})

export interface FormattedHeadToToe {
    [key: string]: { value?: string; isNormal?: boolean }
}

export const formatHeadToToe = (observations: ObservationData[]): FormattedHeadToToe => {
    const result: FormattedHeadToToe = {}
    Object.keys(HEAD_TO_TOE_MAP).forEach((code) => {
        const obs = getObservationByCode(observations, code)
        if (obs) {
            result[code] = {
                value: obs.valueString,
                isNormal:
                    !(obs.interpretations?.some((i) => i.code === 'A') || obs.valueBoolean === false)
            }
        }
    })
    return result
}

export const getObservationMetadata = (
    observations: ObservationData[]
): { performerName?: string; examinationDate?: string } => {
    const first = observations[0]
    if (!first) return {}
    return {
        performerName: getPerformerDisplay(first),
        examinationDate: first.effectiveDateTime
            ? new Date(first.effectiveDateTime).toISOString()
            : undefined
    }
}

// ─── Aggregated formatter (untuk ClinicalNote / SOAP summary) ────────────────

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

export const formatObservationSummary = (
    allObservations: ObservationData[],
    allConditions: ConditionData[] = []
): FormattedObservationSummary => {
    const sortedObs = [...allObservations].sort(
        (a, b) =>
            dayjs(b.effectiveDateTime || b.issued || 0).valueOf() -
            dayjs(a.effectiveDateTime || a.issued || 0).valueOf()
    )
    const sortedCond = [...allConditions].sort(
        (a, b) =>
            dayjs(b.recordedDate || b.onsetDateTime || 0).valueOf() -
            dayjs(a.recordedDate || a.onsetDateTime || 0).valueOf()
    )

    const anamnesisFromCond = formatAnamnesisFromConditions(sortedCond)

    return {
        vitalSigns: formatVitalSigns(sortedObs),
        anamnesis: { ...anamnesisFromCond },
        physicalExamination: formatPhysicalExamination(sortedObs),
        painAssessment: formatPainAssessment(sortedObs),
        fallRisk: formatFallRisk(sortedObs),
        functionalStatus: formatFunctionalStatus(sortedObs),
        psychosocialHistory: formatPsychosocialHistory(sortedObs),
        screening: formatScreening(sortedObs),
        nutrition: formatNutritionScreening(sortedObs),
        conclusion: formatConclusion(sortedObs),
        headToToe: formatHeadToToe(sortedObs),
        clinicalNote: getObservationByCode(sortedObs, '8410-0')?.valueString,
        ...getObservationMetadata(sortedObs)
    }
}
