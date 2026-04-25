/**
 * Formatter untuk FHIR Condition resource.
 * Mengkonversi array Condition dari API menjadi object anamnesis yang siap dipakai form.
 */

export interface ConditionData {
    id?: string | number | null
    note?: string | null
    categories?: Array<{ code?: string | null; display?: string | null; system?: string | null }> | null
    codeCoding?: Array<{
        id?: string | number | null
        code?: string | null
        display?: string | null
        system?: string | null
        diagnosisCodeId?: string | number | null
        diagnosisCode?: {
            id?: string | number | null
            code?: string | null
            display?: string | null
            system?: string | null
            idDisplay?: string | null
        } | null
        isPrimary?: boolean | null
    }> | null
    recordedDate?: string | Date | null
    onsetDateTime?: string | Date | null
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

export const formatAnamnesisFromConditions = (
    conditions: ConditionData[]
): FormattedAnamnesis => {
    const getNoteByCategory = (cats: string | string[]) => {
        const categories = Array.isArray(cats) ? cats : [cats]
        return (
            conditions.find((c) =>
                c.categories?.some((cc) => cc.code && categories.includes(cc.code))
            )?.note ?? undefined
        )
    }

    const presentIllnessCond = conditions.find((c) =>
        c.categories?.some(
            (cc) =>
                cc.code &&
                ['history-of-present-illness', 'previous-condition'].includes(cc.code)
        )
    )
    const chiefCond = conditions.find((c) =>
        c.categories?.some((cc) => cc.code === 'chief-complaint')
    )
    const associatedCond = conditions.find((c) =>
        c.categories?.some((cc) => cc.code === 'problem-list-item')
    )

    const chiefCoding = chiefCond?.codeCoding?.[0]
    const associatedCoding = associatedCond?.codeCoding?.[0]
    const historyCoding = presentIllnessCond?.codeCoding?.[0]

    const chiefDx = chiefCoding?.diagnosisCode
    const associatedDx = associatedCoding?.diagnosisCode
    const historyDx = historyCoding?.diagnosisCode

    type CodingType = NonNullable<ConditionData['codeCoding']>[number]
    const getId = (coding?: CodingType, dx?: CodingType['diagnosisCode']) =>
        dx?.id
            ? String(dx.id)
            : coding?.diagnosisCodeId
                ? String(coding.diagnosisCodeId)
                : undefined

    return {
        chiefComplaint: chiefCond?.note ?? undefined,
        chiefComplaint_codeId: getId(chiefCoding, chiefDx),
        chiefComplaint_codeDisplay: chiefDx
            ? `${chiefDx.code || ''} - ${chiefDx.idDisplay || chiefDx.display || ''}`
            : undefined,
        historyOfIllness: presentIllnessCond?.note ?? undefined,
        historyOfPresentIllness: presentIllnessCond?.note ?? undefined,
        historyOfPresentIllness_codeId: getId(historyCoding, historyDx),
        historyOfPresentIllness_codeDisplay: historyDx
            ? `${historyDx.code || ''} - ${historyDx.idDisplay || historyDx.display || ''}`
            : undefined,
        historyOfPastIllness: getNoteByCategory(['history-past-illness', 'history-of-past-illness']),
        allergyHistory: getNoteByCategory('allergy-history'),
        associatedSymptoms: associatedCond?.note ?? undefined,
        associatedSymptoms_codeId: getId(associatedCoding, associatedDx),
        associatedSymptoms_codeDisplay: associatedDx
            ? `${associatedDx.code || ''} - ${associatedDx.idDisplay || associatedDx.display || ''}`
            : undefined,
        familyHistory: getNoteByCategory('family-history'),
        medicationHistory: getNoteByCategory('medication-history')
    }
}

const isEncounterDiagnosisCondition = (condition: ConditionData): boolean => {
    return (
        condition.categories?.some((category) => category.code === 'encounter-diagnosis') ?? false
    )
}

const buildDiagnosisLine = (condition: ConditionData) => {
    const coding = condition.codeCoding?.[0]
    const diagnosisCode = coding?.diagnosisCode

    const code = diagnosisCode?.code || coding?.code || ''
    const display = diagnosisCode?.idDisplay || diagnosisCode?.display || coding?.display || ''
    const text = [code, display].filter(Boolean).join(' - ').trim()

    return {
        isPrimary: Boolean(coding?.isPrimary),
        text
    }
}

export const formatEncounterDiagnosisSummary = (conditions: ConditionData[]): string => {
    const diagnosisEntries = conditions
        .filter(isEncounterDiagnosisCondition)
        .map(buildDiagnosisLine)
        .filter((entry) => entry.text.length > 0)
        .sort((a, b) => {
            if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
            return a.text.localeCompare(b.text)
        })

    if (diagnosisEntries.length === 0) return ''

    return diagnosisEntries.map((entry, index) => `${index + 1}. ${entry.text}`).join('\n')
}
