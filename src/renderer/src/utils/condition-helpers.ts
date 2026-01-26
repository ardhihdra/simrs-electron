export interface ConditionData {
    id: number
    note?: string
    categories?: Array<{ code: string; display?: string }>
}

export interface FormattedAnamnesis {
    chiefComplaint?: string
    historyOfIllness?: string
    historyOfPresentIllness?: string
    historyOfPastIllness?: string
    allergyHistory?: string
    associatedSymptoms?: string
    familyHistory?: string
    medicationHistory?: string
}

export const formatAnamnesisFromConditions = (conditions: ConditionData[]): FormattedAnamnesis => {
    const getNoteByCategory = (cats: string | string[]) => {
        const categories = Array.isArray(cats) ? cats : [cats]
        return conditions.find((c) => c.categories?.some((cc) => categories.includes(cc.code)))?.note
    }

    const presentIllness = getNoteByCategory('history-of-present-illness')
    const pastIllness = getNoteByCategory(['history-past-illness', 'history-of-past-illness'])

    return {
        chiefComplaint: getNoteByCategory('chief-complaint'),
        historyOfIllness: presentIllness, // Map present illness to historyOfIllness for summary view
        historyOfPresentIllness: presentIllness,
        historyOfPastIllness: pastIllness,
        allergyHistory: getNoteByCategory('allergy-history'),
        associatedSymptoms: getNoteByCategory('associated-symptoms'),
        familyHistory: getNoteByCategory('family-history'),
        medicationHistory: getNoteByCategory('medication-history')
    }
}
