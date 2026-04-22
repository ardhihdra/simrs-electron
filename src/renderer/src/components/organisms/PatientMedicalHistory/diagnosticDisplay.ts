const OBSERVATION_NAME_BY_CODE: Record<string, string> = {
  '718-7': 'Hemoglobin',
  '4544-3': 'Hematokrit',
  '6690-2': 'White Blood Cell Count',
  '789-8': 'Red Blood Cell Count',
  '777-3': 'Platelet Count',
  '787-2': 'MCV',
  '785-6': 'MCH',
  '786-4': 'MCHC',
  '2345-7': 'Glucose (Blood)',
  '3094-0': 'Urea',
  '2160-0': 'Creatinine',
  '3084-1': 'Uric Acid',
  '2093-3': 'Total Cholesterol',
  '2571-8': 'Triglyceride',
  '2085-9': 'HDL Cholesterol',
  '13457-7': 'LDL Cholesterol',
  '1920-8': 'AST (SGOT)',
  '1742-6': 'ALT (SGPT)',
  '6768-6': 'Alkaline Phosphatase',
  '1975-2': 'Total Bilirubin',
  '1968-7': 'Direct Bilirubin',
  '1751-7': 'Albumin',
  '2951-2': 'Sodium',
  '2823-3': 'Potassium',
  '2075-0': 'Chloride',
  '17861-6': 'Calcium',
  '5195-3': 'HBsAg',
  '13955-0': 'Anti-HCV',
  '56888-1': 'HIV 1/2 Ab',
  '94500-6': 'COVID-19 PCR',
  '58410-2': 'Complete Blood Count',
  '1558-6': 'Fasting Blood Glucose',
  '2339-0': 'Random Blood Glucose',
  '57698-3': 'Lipid Panel',
  '24362-6': 'Renal Function Panel',
  '24357-6': 'Urinalysis',
  '4548-4': 'Hemoglobin A1c',
  '30341-2': 'Erythrocyte Sedimentation Rate',
  '24326-1': 'Electrolytes Panel',
  '30745-4': 'Chest X-ray',
  '30738-9': 'Abdominal X-ray',
  '24627-2': 'CT Scan Head',
  '24629-8': 'CT Scan Thorax',
  '30778-5': 'USG Abdomen',
  '30781-9': 'USG Obstetric',
  '30799-1': 'MRI Brain',
  '30749-6': 'Skull X-ray',
  '24635-5': 'CT Scan Abdomen',
  '59189-4': 'USG Pelvis',
  '18782-3': 'Interpretasi Klinis',
};

const LOINC_CODE_PATTERN = /^\d{1,5}-\d$/;

const toText = (value: unknown): string | null => {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
};

const isReadableDisplay = (value: unknown, code: string | null): value is string => {
  const text = toText(value);
  if (!text) return false;
  if (code && text.toLowerCase() === code.toLowerCase()) return false;
  if (LOINC_CODE_PATTERN.test(text)) return false;
  return true;
};

export const resolveObservationDisplay = (params: {
  observationCode?: unknown;
  preferredDisplay?: unknown;
  codingDisplay?: unknown;
  orderDisplay?: unknown;
  fallbackDisplay?: unknown;
}): string => {
  const code = toText(params.observationCode);

  if (isReadableDisplay(params.preferredDisplay, code)) return String(params.preferredDisplay).trim();
  if (isReadableDisplay(params.codingDisplay, code)) return String(params.codingDisplay).trim();
  if (isReadableDisplay(params.orderDisplay, code)) return String(params.orderDisplay).trim();
  if (isReadableDisplay(params.fallbackDisplay, code)) return String(params.fallbackDisplay).trim();

  if (code && OBSERVATION_NAME_BY_CODE[code]) return OBSERVATION_NAME_BY_CODE[code];
  return code || '-';
};
