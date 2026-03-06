/**
 * Observation code → form field name mappings.
 * Digunakan oleh formatters untuk parsing data dari API.
 */

export const VITAL_SIGNS_MAP: Record<string, string> = {
    '8480-6': 'systolicBloodPressure',
    '8462-4': 'diastolicBloodPressure',
    '8310-5': 'temperature',
    '8867-4': 'pulseRate',
    '9279-1': 'respiratoryRate',
    '8302-2': 'height',
    '29463-7': 'weight',
    '8277-6': 'bsa',
    '39156-5': 'bmi',
    '59408-5': 'oxygenSaturation'
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
    '10197-2': 'Mata (Eye)',
    '10195-6': 'Telinga (Ear)',
    '10203-8': 'Hidung (Nose)',
    '32436-8': 'Rambut (Hair)',
    '32446-7': 'Bibir (Lips)',
    '85910-8': 'Gigi Geligi (Teeth & Gums)',
    '32483-0': 'Lidah (Tongue)',
    '10201-2': 'Langit-Langit (Palate)',
    '10201-2_tonsil': 'Tonsil',
    '56867-5': 'Tenggorokan (Throat)',
    '11411-6': 'Leher (Neck)',
    '11391-0': 'Dada (Chest)',
    '10193-1': 'Payudara (Breasts)',
    '10192-3': 'Punggung (Back)',
    '10207-9': 'Paru / Jantung (Thorax)',
    '10191-5': 'Perut (Abdomen)',
    '11400-9': 'Genital (Genitalia)',
    '11388-6_anus': 'Anus / Dubur',
    '11386-0': 'Lengan Atas (Upper Arm)',
    '11398-5': 'Lengan Bawah (Forearm)',
    '11415-7': 'Persendian Tangan (Hand / Wrist Joints)',
    '11404-1_finger': 'Jari Tangan (Fingers)',
    '32456-6_hand': 'Kuku Tangan (Fingernails)',
    '11414-0': 'Tungkai Atas (Thigh)',
    '11389-4': 'Tungkai Bawah (Calf)',
    '11385-2_ankle': 'Persendian Kaki (Foot / Ankle Joints)',
    '11397-7_toe': 'Jari Kaki (Toes)',
    '32456-6_foot': 'Kuku Kaki (Toenails)',
    '10205-3': 'Neurologis',
    '10206-1': 'Kulit (Skin)'
}

export const FALL_RISK_MAP: Record<string, string> = {
    history_falling: 'history_falling',
    secondary_diagnosis: 'secondary_diagnosis',
    ambulatory_aid: 'ambulatory_aid',
    iv_therapy: 'iv_therapy',
    gait: 'gait',
    mental_status: 'mental_status',
    '59460-6': 'fall_risk_score',
    '713513002': 'fall_risk_level'
}

export const HUMPTY_DUMPTY_MAP: Record<string, string> = {
    hd_age: 'hd_age',
    hd_gender: 'hd_gender',
    hd_diagnosis: 'hd_diagnosis',
    hd_cognitive: 'hd_cognitive',
    hd_environmental: 'hd_environmental',
    hd_surgery: 'hd_surgery',
    hd_medication: 'hd_medication',
    hd_score: 'hd_score',
    hd_level: 'hd_level'
}

export const EDMONSON_MAP: Record<string, string> = {
    ed_age: 'ed_age',
    ed_mental: 'ed_mental',
    ed_elimination: 'ed_elimination',
    ed_medication: 'ed_medication',
    ed_diagnosis: 'ed_diagnosis',
    ed_ambulation: 'ed_ambulation',
    ed_nutrition: 'ed_nutrition',
    ed_sleep: 'ed_sleep',
    ed_score: 'ed_score',
    ed_level: 'ed_level'
}

export const NUTRITION_MAP: Record<string, string> = {
    '44876-8': 'mst_weight_loss',
    '44875-0': 'mst_eating_poorly',
    '56078-9': 'mst_total_score',
    'nutrition-risk': 'mst_risk_level'
}

export const CONSCIOUSNESS_SNOMED_MAP: Record<string, { code: string; display: string }> = {
    'Compos Mentis': { code: '248234008', display: 'Mentally alert' },
    Apatis: { code: '417084000', display: 'Apathetic' },
    Somnolen: { code: '248250003', display: 'Somnolent' },
    Sopor: { code: '300508001', display: 'Soporose' },
    Coma: { code: '37160007', display: 'Coma' }
}

export const PSYCHOLOGICAL_STATUS_SNOMED_MAP: Record<string, { code: string; display: string }> = {
    Tenang: { code: '225028003', display: 'Feeling relaxed' },
    Cemas: { code: '48694002', display: 'Feeling anxious' },
    Takut: { code: '225492004', display: 'Feeling frightened' },
    Marah: { code: '112081005', display: 'Feeling angry' },
    Sedih: { code: '63447000', display: 'Feeling sad' },
    Menangis: { code: '271596009', display: 'Crying' }
}

/**
 * Mapping transportasi kedatangan ke SNOMED CT.
 */
export const TRANSPORTATION_SNOMED_MAP: Record<string, { code: string; display: string }> = {
    'Ambulans': { code: '73957001', display: 'Ambulance transport' },
    'Mobil / Kendaraan Pribadi': { code: '71783008', display: 'Car' },
    'Ojek / Motor': { code: '46961003', display: 'Motorcycle transport' },
    'Jalan Kaki': { code: '229070002', display: 'Walking' },
    'Helikopter': { code: '56394003', display: 'Helicopter transport' },
    'Lain-lain': { code: '74964007', display: 'Other transport mode' }
}

/**
 * Level triase IGD / Kondisi Pasien Saat Tiba — menggunakan CTAS (Canadian Triage and Acuity Scale).
 */
export const CTAS_LEVEL_MAP: Record<string, { code: string; display: string; label: string }> = {
    '1': { code: 'LA6111-4', display: '1', label: 'Level 1 - Resusitasi (Resuscitation)' },
    '2': { code: 'LA6112-2', display: '2', label: 'Level 2 - Sangat Mendesak (Emergent)' },
    '3': { code: 'LA6113-0', display: '3', label: 'Level 3 - Mendesak (Urgent)' },
    '4': { code: 'LA6114-8', display: '4', label: 'Level 4 - Kurang Mendesak (Less urgent)' },
    '5': { code: 'LA6115-5', display: '5', label: 'Level 5 - Tidak Mendesak (Non urgent)' }
}

/**
 * Mapping Asesmen Nyeri IGD (Metode dan Skor).
 */
export const PAIN_SCALE_TYPE_MAP: Record<string, { system: string; code: string; display: string }> = {
    'NRS': { system: 'http://snomed.info/sct', code: '1172399009', display: 'Numeric rating scale score' },
    'WONG_BAKER': { system: 'http://loinc.org', code: '38221-8', display: 'Pain severity Wong-Baker FACES pain rating scale' },
    'NIPS': { system: 'http://snomed.info/sct', code: '397858004', display: 'Neonatal infant pain scale' }
}

/**
 * Mapping Asesmen Nyeri IGD: Komponen tambahan (kemkes & loinc & snomed).
 */
export const PAIN_COMPONENTS_MAP = {
    PAIN_MAIN: { system: 'http://snomed.info/sct', code: '22253000', display: 'Pain' },
    CAUSE: { system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term', code: 'OC000023', display: 'Penyebab nyeri' },
    DURATION: { system: 'http://loinc.org', code: '38207-7', display: 'Pain duration' },
    FREQUENCY: { system: 'http://snomed.info/sct', code: '700469003', display: 'Frequency of pain symptom' },
    QUALITY: { system: 'http://snomed.info/sct', code: '273680006', display: 'Character of pain' }, // misal: tertusuk, terbakar
    RADIATION: { system: 'http://snomed.info/sct', code: '272990001', display: 'Radiation of pain' }, // menjalar kemana
    ALLEVIATING_FACTOR: { system: 'http://snomed.info/sct', code: '255653005', display: 'Alleviating factor' } // faktor yang memperingan
}
