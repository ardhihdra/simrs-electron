export const CLINICAL_IMPRESSION_CATEGORIES = {
    CLINICAL_COURSE: 'clinical-course',
    CLINICAL_RATIONALE: 'clinical-rationale',
} as const

export const CLINICAL_IMPRESSION_CODES = {
    HISTORY_OF_DISORDER: {
        system: "http://snomed.info/sct",
        code: "312850006",
        display: "History of disorder"
    },
    RASIONAL_KLINIS: {
        system: "http://terminology.kemkes.go.id",
        code: "TK000056",
        display: "Rasional Klinis"
    },
    REPORT: {
        system: "http://snomed.info/sct",
        code: "116154003",
        display: "Patient clinical record (record artifact)"
    }
} as const
