export const VITAL_SIGNS_MAP: Record<string, string> = {
    '8480-6': 'systolicBloodPressure',
    '8462-4': 'diastolicBloodPressure',
    '8310-5': 'temperature',
    '8867-4': 'pulseRate',
    '9279-1': 'respiratoryRate',
    '8302-2': 'height',
    '29463-7': 'weight',
    '39156-5': 'bmi',
    '2708-6': 'oxygenSaturation'
}

export const PHYSICAL_EXAM_MAP: Record<string, string> = {
    'general-condition': 'generalCondition',
    'physical-exam-notes': 'additionalNotes',
    'functional-status-aids': 'aids_check',
    'functional-status-disability': 'disability_check',
    'functional-status-adl': 'adl_check',
    'psychological-status': 'psychological_status',
    'family-relation-note': 'family_relation_note',
    'living-with-note': 'living_with_note',
    'patient-religion': 'religion',
    'culture-values': 'culture_values',
    'daily-language': 'daily_language',
    'consciousness-level': 'consciousness_level',
    'breathing-status': 'breathing_status',
    'fall-risk-gug-a': 'get_up_go_a',
    'fall-risk-gug-b': 'get_up_go_b',
    'pain-score': 'pain_scale_score',
    'chest-pain-check': 'chest_pain_check',
    'pain-notes': 'pain_notes',
    'cough-screening': 'cough_screening_status',
    'tindak-lanjut-keputusan': 'decision'
}

export const HEAD_TO_TOE_MAP: Record<string, string> = {
    '10199-8': 'Kepala (Head)',
    '10197-2': 'Mata (Eyes)',
    '10196-4': 'Telinga (Ears)',
    '10198-0': 'Hidung (Nose)',
    '10201-2': 'Tenggorokan (Throat)',
    '10200-4': 'Leher (Neck)',
    '10207-9': 'Dada / Paru / Jantung (Thorax)',
    '10191-5': 'Perut (Abdomen)',
    '10192-3': 'Ekstremitas (Extremities)',
    '10193-1': 'Genitalia',
    '10205-3': 'Neurologis',
    '10206-1': 'Kulit (Skin)'
}

export const FALL_RISK_MAP: Record<string, string> = {
    'history_falling': 'history_falling',
    'secondary_diagnosis': 'secondary_diagnosis',
    'ambulatory_aid': 'ambulatory_aid',
    'iv_therapy': 'iv_therapy',
    'gait': 'gait',
    'mental_status': 'mental_status',
    '59460-6': 'fall_risk_score',
    '713513002': 'fall_risk_level'
}

export const HUMPTY_DUMPTY_MAP: Record<string, string> = {
    'hd_age': 'hd_age',
    'hd_gender': 'hd_gender',
    'hd_diagnosis': 'hd_diagnosis',
    'hd_cognitive': 'hd_cognitive',
    'hd_environmental': 'hd_environmental',
    'hd_surgery': 'hd_surgery',
    'hd_medication': 'hd_medication',
    'hd_score': 'hd_score',
    'hd_level': 'hd_level'
}

export const EDMONSON_MAP: Record<string, string> = {
    'ed_age': 'ed_age',
    'ed_mental': 'ed_mental',
    'ed_elimination': 'ed_elimination',
    'ed_medication': 'ed_medication',
    'ed_diagnosis': 'ed_diagnosis',
    'ed_ambulation': 'ed_ambulation',
    'ed_nutrition': 'ed_nutrition',
    'ed_sleep': 'ed_sleep',
    'ed_score': 'ed_score',
    'ed_level': 'ed_level'
}

export const NUTRITION_MAP: Record<string, string> = {
    '44876-8': 'mst_weight_loss',
    '44875-0': 'mst_eating_poorly',
    '56078-9': 'mst_total_score',
    'nutrition-risk': 'mst_risk_level'
}

import dayjs from 'dayjs'
import { TOOTH_SNOMED_CODES, CONDITION_SNOMED_CODES } from '@renderer/components/organisms/Dental/dental-constants'
import type { ToothDetail } from '@renderer/components/organisms/Dental/type'

interface ObservationFromDB {
    id: string
    effectiveDateTime: string
    valueString?: string
    status: string
    bodySites: Array<{
        code: string
        display: string
        system: string
    }>
    codeCoding: Array<{
        code: string
        display: string
        system: string
    }>
    notes: Array<{
        text: string
    }>
    performers: Array<{
        name: string
        display?: string
        role?: string
    }>
}

interface TimelineContentProps {
    date: string
    treatment: string
    condition: string
    dentist: string
    tooth: ToothDetail[]
    status: 'done' | 'pending'
    notes?: string
}


export function transformObservationsToTimeline(
    observations: ObservationFromDB[]
): TimelineContentProps[] {
    if (!observations || observations.length === 0) return []

    const groupedByDate = new Map<string, Map<string, ObservationFromDB[]>>()

    observations.forEach((obs) => {
        const date = dayjs(obs.effectiveDateTime).format('DD-MM-YYYY')
        const treatment = obs.valueString || 'Tindakan Tidak Diketahui'

        if (!groupedByDate.has(date)) {
            groupedByDate.set(date, new Map())
        }

        const dateGroup = groupedByDate.get(date)!
        if (!dateGroup.has(treatment)) {
            dateGroup.set(treatment, [])
        }

        dateGroup.get(treatment)!.push(obs)
    })

    const timeline: TimelineContentProps[] = []

    groupedByDate.forEach((treatmentMap, date) => {
        treatmentMap.forEach((observations, treatment) => {
            const firstObs = observations[0]
            const conditionCode = firstObs.codeCoding?.[0]?.code || ''
            const conditionDisplay = firstObs.codeCoding?.[0]?.display || 'Unknown Condition'
            let conditionName = conditionDisplay
            for (const [key, value] of Object.entries(CONDITION_SNOMED_CODES)) {
                if (value.code === conditionCode) {
                    conditionName = key
                    break
                }
            }
            const dentist = firstObs.performers?.[0]?.display || firstObs.performers?.[0]?.name || 'Dokter Tidak Diketahui'
            const teeth: ToothDetail[] = observations
                .map((obs) => {
                    const bodySite = obs.bodySites?.[0]
                    if (!bodySite) return null
                    for (const [toothId, toothData] of Object.entries(TOOTH_SNOMED_CODES)) {
                        if (toothData.code === bodySite.code) {
                            const fdi = toothId.replace('teeth-', '')
                            return {
                                id: toothId,
                                observationId: obs.id,
                                notations: {
                                    fdi,
                                    universal: fdi,
                                    palmer: fdi
                                },
                                type: 'permanent'
                            } as ToothDetail
                        }
                    }
                    return null
                })
                .filter((tooth): tooth is ToothDetail => tooth !== null)
            const notes = firstObs.notes?.[0]?.text || undefined
            const status: 'done' | 'pending' = firstObs.status === 'final' ? 'done' : 'pending'
            if (teeth.length === 0) return
            timeline.push({
                date,
                treatment,
                condition: conditionName,
                dentist,
                tooth: teeth,
                status,
                notes
            })
        })
    })

    // Sort by date (newest first)
    return timeline.sort((a, b) => {
        const dateA = dayjs(a.date, 'DD-MM-YYYY')
        const dateB = dayjs(b.date, 'DD-MM-YYYY')
        return dateB.diff(dateA)
    })
}

export function getToothIdFromSNOMED(snomedCode: string): string | null {
    for (const [toothId, toothData] of Object.entries(TOOTH_SNOMED_CODES)) {
        if (toothData.code === snomedCode) {
            return toothId
        }
    }
    return null
}
