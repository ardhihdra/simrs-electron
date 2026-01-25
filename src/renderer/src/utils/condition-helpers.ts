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
    const getNoteByCategory = (cat: string) => {
        return conditions.find((c) => c.categories?.some((cc) => cc.code === cat))?.note
    }

    return {
        chiefComplaint: getNoteByCategory('chief-complaint'),
        historyOfIllness: getNoteByCategory('history-of-illness'),
        historyOfPresentIllness: getNoteByCategory('history-present-illness'),
        historyOfPastIllness: getNoteByCategory('history-past-illness'),
        allergyHistory: getNoteByCategory('allergy-history'),
        associatedSymptoms: getNoteByCategory('associated-symptoms'),
        familyHistory: getNoteByCategory('family-history'),
        medicationHistory: getNoteByCategory('medication-history')
    }
}
