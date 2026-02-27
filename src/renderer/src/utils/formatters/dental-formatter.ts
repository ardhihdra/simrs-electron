import dayjs from 'dayjs'
import {
    TOOTH_SNOMED_CODES,
    CONDITION_SNOMED_CODES
} from '@renderer/components/organisms/Dental/dental-constants'
import type { ToothDetail } from '@renderer/components/organisms/Dental/type'

interface ObservationFromDB {
    id?: string
    effectiveDateTime: string
    valueString?: string
    status: string
    bodySites: Array<{ code: string; display: string; system: string }>
    codeCoding: Array<{ code: string; display: string; system: string }>
    notes: Array<{ text: string }>
    performers: Array<{ name: string; display?: string; role?: string }>
}

export interface DentalTimelineEntry {
    date: string
    treatment: string
    condition: string
    dentist: string
    tooth: ToothDetail[]
    status: 'done' | 'pending'
    notes?: string
}

/**
 * Transforms raw Observation records (Dental) into a grouped timeline.
 */
export const transformObservationsToTimeline = (
    observations: ObservationFromDB[]
): DentalTimelineEntry[] => {
    if (!observations || observations.length === 0) return []

    const groupedByDate = new Map<string, Map<string, ObservationFromDB[]>>()

    observations.forEach((obs) => {
        const date = dayjs(obs.effectiveDateTime).format('DD-MM-YYYY')
        const treatment = obs.valueString || 'Tindakan Tidak Diketahui'
        if (!groupedByDate.has(date)) groupedByDate.set(date, new Map())
        const dateGroup = groupedByDate.get(date)!
        if (!dateGroup.has(treatment)) dateGroup.set(treatment, [])
        dateGroup.get(treatment)!.push(obs)
    })

    const timeline: DentalTimelineEntry[] = []

    groupedByDate.forEach((treatmentMap, date) => {
        treatmentMap.forEach((obsGroup, treatment) => {
            const firstObs = obsGroup[0]
            const conditionCode = firstObs.codeCoding?.[0]?.code || ''
            let conditionName = firstObs.codeCoding?.[0]?.display || 'Unknown Condition'

            for (const [key, value] of Object.entries(CONDITION_SNOMED_CODES)) {
                if (value.code === conditionCode) {
                    conditionName = key
                    break
                }
            }

            const dentist =
                firstObs.performers?.[0]?.display ||
                firstObs.performers?.[0]?.name ||
                'Dokter Tidak Diketahui'

            const teeth: ToothDetail[] = obsGroup
                .map((obs) => {
                    const bodySite = obs.bodySites?.[0]
                    if (!bodySite) return null
                    for (const [toothId, toothData] of Object.entries(TOOTH_SNOMED_CODES)) {
                        if (toothData.code === bodySite.code) {
                            const fdi = toothId.replace('teeth-', '')
                            return {
                                id: toothId,
                                observationId: obs.id,
                                notations: { fdi, universal: fdi, palmer: fdi },
                                type: 'permanent'
                            } as ToothDetail
                        }
                    }
                    return null
                })
                .filter((t): t is ToothDetail => t !== null)

            if (teeth.length === 0) return

            timeline.push({
                date,
                treatment,
                condition: conditionName,
                dentist,
                tooth: teeth,
                status: firstObs.status === 'final' ? 'done' : 'pending',
                notes: firstObs.notes?.[0]?.text || undefined
            })
        })
    })

    return timeline.sort((a, b) =>
        dayjs(b.date, 'DD-MM-YYYY').diff(dayjs(a.date, 'DD-MM-YYYY'))
    )
}

/**
 * Resolves a tooth ID from its SNOMED code.
 */
export const getToothIdFromSNOMED = (snomedCode: string): string | null => {
    for (const [toothId, toothData] of Object.entries(TOOTH_SNOMED_CODES)) {
        if (toothData.code === snomedCode) return toothId
    }
    return null
}
