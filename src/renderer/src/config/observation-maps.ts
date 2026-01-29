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


