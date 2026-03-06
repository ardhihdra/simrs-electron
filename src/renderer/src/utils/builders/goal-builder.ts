/**
 * Builder untuk FHIR Goal resource — target dan addresses.
 * Digunakan oleh GoalForm untuk menyusun payload sebelum submit.
 */

import type { GoalTargetInput } from '@renderer/hooks/query/use-goal'
import {
    GOAL_DETAIL_SNOMED_MAP,
    GOAL_MEASURE_LOINC_MAP,
    type GoalCategoryEntry
} from '@renderer/config/maps/goal-maps'

// ─── GoalTarget Builder ───────────────────────────────────────────────────────

export interface GoalTargetBuilderOptions {
    /** Kode LOINC dari GOAL_MEASURE_LOINC_MAP (misal: '8480-6') */
    measureCode: string
    /** Detail pencapaian: pilih salah satu */
    detailSnomed?: string        // Kode SNOMED CT dari GOAL_DETAIL_SNOMED_MAP
    detailQuantityValue?: number
    detailQuantityUnit?: string
    detailQuantityCode?: string
    detailQuantitySystem?: string
    detailString?: string
    dueDate?: string
}

/**
 * Membuat satu GoalTargetInput dari nilai flat form.
 * Melakukan lookup ke GOAL_MEASURE_LOINC_MAP dan GOAL_DETAIL_SNOMED_MAP.
 */
export const createGoalTarget = (options: GoalTargetBuilderOptions): GoalTargetInput => {
    const measure = GOAL_MEASURE_LOINC_MAP[options.measureCode]

    const target: GoalTargetInput = {
        measureCode: measure?.code ?? options.measureCode,
        measureDisplay: measure?.display,
        measureSystem: measure?.system ?? 'http://loinc.org'
    }

    // Detail: CodeableConcept SNOMED
    if (options.detailSnomed) {
        const snomed = GOAL_DETAIL_SNOMED_MAP[options.detailSnomed]
        if (snomed) {
            target.detailQuantityCode = snomed.code
            target.detailQuantitySystem = snomed.system
            target.detailString = snomed.display
        }
    }

    // Detail: Quantity numerik
    if (options.detailQuantityValue !== undefined) {
        target.detailQuantityValue = options.detailQuantityValue
        target.detailQuantityUnit = options.detailQuantityUnit
        target.detailQuantityCode = options.detailQuantityCode
        target.detailQuantitySystem = options.detailQuantitySystem ?? 'http://unitsofmeasure.org'
    }

    // Detail: string bebas
    if (options.detailString) {
        target.detailString = options.detailString
    }

    if (options.dueDate) {
        target.dueDate = options.dueDate
    }

    return target
}

/**
 * Membuat array GoalTargetInput dari array flat form values.
 */
export const createGoalTargetBatch = (
    targets: GoalTargetBuilderOptions[]
): GoalTargetInput[] => targets.map(createGoalTarget)

// ─── Category Builder ─────────────────────────────────────────────────────────

/**
 * Menyusun objek category FHIR dari entry map.
 */
export const buildGoalCategoryPayload = (entry: GoalCategoryEntry) => ({
    coding: [
        {
            system: entry.system,
            code: entry.code,
            display: entry.display
        }
    ]
})
