export interface GoalCategoryEntry {
    code: string
    display: string
    system: string
    label: string
}

export const GOAL_CATEGORY_MAP: Record<string, GoalCategoryEntry> = {
    nursing: {
        code: 'nursing',
        display: 'Nursing',
        system: 'http://terminology.hl7.org/CodeSystem/goal-category',
        label: 'Keperawatan (Nursing)'
    },
    physiotherapy: {
        code: 'physiotherapy',
        display: 'Physiotherapy',
        system: 'http://terminology.hl7.org/CodeSystem/goal-category',
        label: 'Fisioterapi (Physiotherapy)'
    },
    dietary: {
        code: 'dietary',
        display: 'Dietary',
        system: 'http://terminology.hl7.org/CodeSystem/goal-category',
        label: 'Diet & Gizi (Dietary)'
    },
    behavioral: {
        code: 'behavioral',
        display: 'Behavioral',
        system: 'http://terminology.hl7.org/CodeSystem/goal-category',
        label: 'Perilaku (Behavioral)'
    },
    safety: {
        code: 'safety',
        display: 'Safety',
        system: 'http://terminology.hl7.org/CodeSystem/goal-category',
        label: 'Keselamatan Pasien (Safety)'
    },
    medical: {
        code: 'medical',
        display: 'Medical',
        system: 'http://terminology.hl7.org/CodeSystem/goal-category',
        label: 'Medis Umum (Medical)'
    },
    education: {
        code: 'education',
        display: 'Education',
        system: 'http://terminology.hl7.org/CodeSystem/goal-category',
        label: 'Edukasi Pasien (Education)'
    }
}

// ─── Measure (LOINC) ─────────────────────────────────────────────────────────

export interface GoalMeasureEntry {
    code: string
    display: string
    system: string
    label: string
    unit?: string
}

export const GOAL_MEASURE_LOINC_MAP: Record<string, GoalMeasureEntry> = {

    // ── Tanda Vital ──────────────────────────────────────────────────────────
    '8480-6': {
        code: '8480-6',
        display: 'Tekanan Darah Sistolik',
        system: 'http://loinc.org',
        label: '[Vital] Tekanan Darah Sistolik',
        unit: 'mm[Hg]'
    },
    '8462-4': {
        code: '8462-4',
        display: 'Tekanan Darah Diastolik',
        system: 'http://loinc.org',
        label: '[Vital] Tekanan Darah Diastolik',
        unit: 'mm[Hg]'
    },
    '8310-5': {
        code: '8310-5',
        display: 'Suhu Tubuh',
        system: 'http://loinc.org',
        label: '[Vital] Suhu Tubuh',
        unit: 'Cel'
    },
    '8867-4': {
        code: '8867-4',
        display: 'Denyut Nadi',
        system: 'http://loinc.org',
        label: '[Vital] Frekuensi Nadi',
        unit: '/min'
    },
    '9279-1': {
        code: '9279-1',
        display: 'Frekuensi Napas',
        system: 'http://loinc.org',
        label: '[Vital] Frekuensi Napas',
        unit: '/min'
    },
    '59408-5': {
        code: '59408-5',
        display: 'Saturasi Oksigen',
        system: 'http://loinc.org',
        label: '[Vital] Saturasi Oksigen (SpO2)',
        unit: '%'
    },
    '29463-7': {
        code: '29463-7',
        display: 'Berat Badan',
        system: 'http://loinc.org',
        label: '[Vital] Berat Badan',
        unit: 'kg'
    },
    '8302-2': {
        code: '8302-2',
        display: 'Tinggi Badan',
        system: 'http://loinc.org',
        label: '[Vital] Tinggi Badan',
        unit: 'cm'
    },
    '39156-5': {
        code: '39156-5',
        display: 'Body mass index',
        system: 'http://loinc.org',
        label: '[Vital] Indeks Massa Tubuh (BMI)',
        unit: 'kg/m2'
    },

    // ── Darah Rutin ──────────────────────────────────────────────────────────
    '26515-7': {
        code: '26515-7',
        display: 'Platelets [#/volume] in Blood',
        system: 'http://loinc.org',
        label: '[Lab] Trombosit',
        unit: '10*3/uL'
    },
    '718-7': {
        code: '718-7',
        display: 'Hemoglobin [Mass/volume] in Blood',
        system: 'http://loinc.org',
        label: '[Lab] Hemoglobin',
        unit: 'g/dL'
    },
    '4544-3': {
        code: '4544-3',
        display: 'Hematocrit [Volume Fraction] of Blood',
        system: 'http://loinc.org',
        label: '[Lab] Hematokrit',
        unit: '%'
    },
    '6690-2': {
        code: '6690-2',
        display: 'Leukocytes [#/volume] in Blood',
        system: 'http://loinc.org',
        label: '[Lab] Leukosit (WBC)',
        unit: '10*3/uL'
    },

    // ── Kimia Darah ──────────────────────────────────────────────────────────
    '2339-0': {
        code: '2339-0',
        display: 'Glucose [Mass/volume] in Blood',
        system: 'http://loinc.org',
        label: '[Lab] Glukosa Darah Sewaktu',
        unit: 'mg/dL'
    },
    '1558-6': {
        code: '1558-6',
        display: 'Fasting glucose [Mass/volume] in Serum or Plasma',
        system: 'http://loinc.org',
        label: '[Lab] Glukosa Darah Puasa (GDP)',
        unit: 'mg/dL'
    },
    '17856-6': {
        code: '17856-6',
        display: 'Hemoglobin A1c/Hemoglobin.total in Blood by HPLC',
        system: 'http://loinc.org',
        label: '[Lab] HbA1c',
        unit: '%'
    },
    '2160-0': {
        code: '2160-0',
        display: 'Creatinine [Mass/volume] in Serum or Plasma',
        system: 'http://loinc.org',
        label: '[Lab] Kreatinin Serum',
        unit: 'mg/dL'
    },
    '3094-0': {
        code: '3094-0',
        display: 'Urea nitrogen [Mass/volume] in Serum or Plasma',
        system: 'http://loinc.org',
        label: '[Lab] BUN (Blood Urea Nitrogen)',
        unit: 'mg/dL'
    },
    '2823-3': {
        code: '2823-3',
        display: 'Potassium [Moles/volume] in Serum or Plasma',
        system: 'http://loinc.org',
        label: '[Lab] Kalium (K)',
        unit: 'mmol/L'
    },
    '2951-2': {
        code: '2951-2',
        display: 'Sodium [Moles/volume] in Serum or Plasma',
        system: 'http://loinc.org',
        label: '[Lab] Natrium (Na)',
        unit: 'mmol/L'
    },

    // ── Fungsi Hati ──────────────────────────────────────────────────────────
    '1742-6': {
        code: '1742-6',
        display: 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma',
        system: 'http://loinc.org',
        label: '[Lab] SGPT / ALT',
        unit: 'U/L'
    },
    '1920-8': {
        code: '1920-8',
        display: 'Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma',
        system: 'http://loinc.org',
        label: '[Lab] SGOT / AST',
        unit: 'U/L'
    },
    '1975-2': {
        code: '1975-2',
        display: 'Bilirubin.total [Mass/volume] in Serum or Plasma',
        system: 'http://loinc.org',
        label: '[Lab] Bilirubin Total',
        unit: 'mg/dL'
    },

    // ── Lipid Profile ────────────────────────────────────────────────────────
    '2093-3': {
        code: '2093-3',
        display: 'Cholesterol [Mass/volume] in Serum or Plasma',
        system: 'http://loinc.org',
        label: '[Lab] Kolesterol Total',
        unit: 'mg/dL'
    },
    '2085-9': {
        code: '2085-9',
        display: 'Cholesterol in HDL [Mass/volume] in Serum or Plasma',
        system: 'http://loinc.org',
        label: '[Lab] Kolesterol HDL',
        unit: 'mg/dL'
    },
    '2089-1': {
        code: '2089-1',
        display: 'Cholesterol in LDL [Mass/volume] in Serum or Plasma',
        system: 'http://loinc.org',
        label: '[Lab] Kolesterol LDL',
        unit: 'mg/dL'
    },
    '2571-8': {
        code: '2571-8',
        display: 'Triglyceride [Mass/volume] in Serum or Plasma',
        system: 'http://loinc.org',
        label: '[Lab] Trigliserida',
        unit: 'mg/dL'
    },

    // ── Nyeri & Fungsional ───────────────────────────────────────────────────
    '72514-3': {
        code: '72514-3',
        display: 'Pain severity - 0-10 verbal numeric rating [Score]',
        system: 'http://loinc.org',
        label: '[Klinis] Skala Nyeri (NRS)',
        unit: '{score}'
    },
    '89243-0': {
        code: '89243-0',
        display: 'Glasgow coma scale total score',
        system: 'http://loinc.org',
        label: '[Klinis] GCS (Glasgow Coma Scale)',
        unit: '{score}'
    },
    '59460-6': {
        code: '59460-6',
        display: 'Fall risk assessment score',
        system: 'http://loinc.org',
        label: '[Klinis] Skor Risiko Jatuh',
        unit: '{score}'
    }
}

export interface GoalDetailSnomedEntry {
    code: string
    display: string
    system: string
    label: string
}

export const GOAL_DETAIL_SNOMED_MAP: Record<string, GoalDetailSnomedEntry> = {
    '17621005': {
        code: '17621005',
        display: 'Normal',
        system: 'http://snomed.info/sct',
        label: 'Normal / Sembuh'
    },
    '260411009': {
        code: '260411009',
        display: 'Unchanged',
        system: 'http://snomed.info/sct',
        label: 'Stabil / Tidak Berubah'
    },
    '385633008': {
        code: '385633008',
        display: 'Improving',
        system: 'http://snomed.info/sct',
        label: 'Membaik / Meningkat'
    },
    '230993007': {
        code: '230993007',
        display: 'Worsening',
        system: 'http://snomed.info/sct',
        label: 'Memburuk / Menurun'
    },
    '413313008': {
        code: '413313008',
        display: 'Well controlled',
        system: 'http://snomed.info/sct',
        label: 'Terkontrol Baik'
    },
    '182992009': {
        code: '182992009',
        display: 'Treatment completed',
        system: 'http://snomed.info/sct',
        label: 'Pengobatan Selesai'
    }
}


export const GOAL_ADDRESS_REFERENCE_TYPES = [
    { value: 'Condition', label: 'Kondisi / Diagnosa (Condition)' },
    { value: 'Observation', label: 'Observasi Klinis (Observation)' },
    { value: 'MedicationStatement', label: 'Riwayat Pengobatan (MedicationStatement)' },
    { value: 'NutritionOrder', label: 'Arahan Gizi / Diet (NutritionOrder)' },
    { value: 'ServiceRequest', label: 'Permintaan Tindakan (ServiceRequest)' }
] as const

export type GoalAddressReferenceType = (typeof GOAL_ADDRESS_REFERENCE_TYPES)[number]['value']
