// SNOMED CT Codes for Teeth (FDI Notation)
export const TOOTH_SNOMED_CODES: Record<string, { code: string; display: string }> = {
    // Permanent Upper Right (Quadrant 1)
    'teeth-11': { code: '245652005', display: 'Permanent maxillary right central incisor tooth' },
    'teeth-12': { code: '245653000', display: 'Permanent maxillary right lateral incisor tooth' },
    'teeth-13': { code: '245654006', display: 'Permanent maxillary right canine tooth' },
    'teeth-14': { code: '245655007', display: 'Permanent maxillary right first premolar tooth' },
    'teeth-15': { code: '245656008', display: 'Permanent maxillary right second premolar tooth' },
    'teeth-16': { code: '245657004', display: 'Permanent maxillary right first molar tooth' },
    'teeth-17': { code: '245658009', display: 'Permanent maxillary right second molar tooth' },
    'teeth-18': { code: '245659001', display: 'Permanent maxillary right third molar tooth' },

    // Permanent Upper Left (Quadrant 2)
    'teeth-21': { code: '245660006', display: 'Permanent maxillary left central incisor tooth' },
    'teeth-22': { code: '245661005', display: 'Permanent maxillary left lateral incisor tooth' },
    'teeth-23': { code: '245662003', display: 'Permanent maxillary left canine tooth' },
    'teeth-24': { code: '245663008', display: 'Permanent maxillary left first premolar tooth' },
    'teeth-25': { code: '245664002', display: 'Permanent maxillary left second premolar tooth' },
    'teeth-26': { code: '245665001', display: 'Permanent maxillary left first molar tooth' },
    'teeth-27': { code: '245666000', display: 'Permanent maxillary left second molar tooth' },
    'teeth-28': { code: '245667009', display: 'Permanent maxillary left third molar tooth' },

    // Permanent Lower Left (Quadrant 3)
    'teeth-31': { code: '245668004', display: 'Permanent mandibular left central incisor tooth' },
    'teeth-32': { code: '245669007', display: 'Permanent mandibular left lateral incisor tooth' },
    'teeth-33': { code: '245670008', display: 'Permanent mandibular left canine tooth' },
    'teeth-34': { code: '245671007', display: 'Permanent mandibular left first premolar tooth' },
    'teeth-35': { code: '245672000', display: 'Permanent mandibular left second premolar tooth' },
    'teeth-36': { code: '245673005', display: 'Permanent mandibular left first molar tooth' },
    'teeth-37': { code: '245674004', display: 'Permanent mandibular left second molar tooth' },
    'teeth-38': { code: '245675003', display: 'Permanent mandibular left third molar tooth' },

    // Permanent Lower Right (Quadrant 4)
    'teeth-41': { code: '245676002', display: 'Permanent mandibular right central incisor tooth' },
    'teeth-42': { code: '245677006', display: 'Permanent mandibular right lateral incisor tooth' },
    'teeth-43': { code: '245678001', display: 'Permanent mandibular right canine tooth' },
    'teeth-44': { code: '245679009', display: 'Permanent mandibular right first premolar tooth' },
    'teeth-45': { code: '245680007', display: 'Permanent mandibular right second premolar tooth' },
    'teeth-46': { code: '245681006', display: 'Permanent mandibular right first molar tooth' },
    'teeth-47': { code: '245682004', display: 'Permanent mandibular right second molar tooth' },
    'teeth-48': { code: '245683009', display: 'Permanent mandibular right third molar tooth' }
}

// SNOMED CT Codes for Dental Conditions
export const CONDITION_SNOMED_CODES: Record<string, { code: string; display: string }> = {
    'caries': { code: '80967001', display: 'Dental caries' },
    'karies': { code: '80967001', display: 'Dental caries' },
    'filling': { code: '234947008', display: 'Dental restoration present' },
    'tumpatan': { code: '234947008', display: 'Dental restoration present' },
    'root_canal': { code: '234953003', display: 'Root canal therapy' },
    'psa': { code: '234953003', display: 'Root canal therapy' },
    'bridge': { code: '257277003', display: 'Fixed bridge' },
    'missing': { code: '870161005', display: 'Absence of tooth' },
    'hilang': { code: '870161005', display: 'Absence of tooth' },
    'impacted': { code: '422593000', display: 'Impacted tooth' },
    'impaksi': { code: '422593000', display: 'Impacted tooth' },
    'veneer': { code: '257278008', display: 'Dental veneer' },
    'crown': { code: '257276007', display: 'Crown' },
    'mahkota': { code: '257276007', display: 'Crown' },
    'extraction': { code: '128477000', display: 'Tooth extraction' },
    'cabut': { code: '128477000', display: 'Tooth extraction' }
}

// Default condition if not found in mapping
export const DEFAULT_DENTAL_CONDITION = {
    code: '363116006',
    display: 'Dental finding'
}

export const SNOMED_SYSTEM = 'http://snomed.info/sct'
