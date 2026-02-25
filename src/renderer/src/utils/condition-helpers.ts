export interface ConditionData {
    id: number
    note?: string
    categories?: Array<{ code: string; display?: string }>
    codeCoding?: Array<{
        id?: number
        code: string
        display?: string
        system?: string
        diagnosisCodeId?: number
        diagnosisCode?: {
            id: number
            code: string
            display: string
            idDisplay?: string
        }
    }>
    recordedDate?: string | Date
    onsetDateTime?: string | Date
}

export interface FormattedAnamnesis {
    chiefComplaint?: string
    chiefComplaint_codeId?: string
    chiefComplaint_codeDisplay?: string
    historyOfIllness?: string
    historyOfPresentIllness?: string
    historyOfPresentIllness_codeId?: string
    historyOfPresentIllness_codeDisplay?: string
    historyOfPastIllness?: string
    allergyHistory?: string
    associatedSymptoms?: string
    associatedSymptoms_codeId?: string
    associatedSymptoms_codeDisplay?: string
    familyHistory?: string
    medicationHistory?: string
}

export const formatAnamnesisFromConditions = (conditions: ConditionData[]): FormattedAnamnesis => {
    const getNoteByCategory = (cats: string | string[]) => {
        const categories = Array.isArray(cats) ? cats : [cats]
        return conditions.find((c) => c.categories?.some((cc) => categories.includes(cc.code)))?.note
    }

    const presentIllnessCond = conditions.find((c) =>
        c.categories?.some((cc) => ['history-of-present-illness', 'previous-condition'].includes(cc.code))
    )
    const presentIllness = presentIllnessCond?.note
    const pastIllness = getNoteByCategory(['history-past-illness', 'history-of-past-illness'])

    const chiefCond = conditions.find((c) => c.categories?.some((cc) => cc.code === 'chief-complaint'))
    const associatedCond = conditions.find((c) => c.categories?.some((cc) => cc.code === 'associated-symptoms'))

    const chiefDx = chiefCond?.codeCoding?.[0]?.diagnosisCode
    const associatedDx = associatedCond?.codeCoding?.[0]?.diagnosisCode
    const historyDx = presentIllnessCond?.codeCoding?.[0]?.diagnosisCode

    return {
        chiefComplaint: chiefCond?.note,
        chiefComplaint_codeId: chiefDx?.id ? String(chiefDx.id) : undefined,
        chiefComplaint_codeDisplay: chiefDx ? `${chiefDx.code} - ${chiefDx.idDisplay || chiefDx.display}` : undefined,
        historyOfIllness: presentIllness,
        historyOfPresentIllness: presentIllness,
        historyOfPresentIllness_codeId: historyDx?.id ? String(historyDx.id) : undefined,
        historyOfPresentIllness_codeDisplay: historyDx ? `${historyDx.code} - ${historyDx.idDisplay || historyDx.display}` : undefined,
        historyOfPastIllness: pastIllness,
        allergyHistory: getNoteByCategory('allergy-history'),
        associatedSymptoms: associatedCond?.note,
        associatedSymptoms_codeId: associatedDx?.id ? String(associatedDx.id) : undefined,
        associatedSymptoms_codeDisplay: associatedDx ? `${associatedDx.code} - ${associatedDx.idDisplay || associatedDx.display}` : undefined,
        familyHistory: getNoteByCategory('family-history'),
        medicationHistory: getNoteByCategory('medication-history')
    }
}
