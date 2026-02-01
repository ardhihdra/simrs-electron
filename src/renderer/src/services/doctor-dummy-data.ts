import {
    DiagnosisCode,
    MedicalProcedure,
    Medicine,
    MedicineCategory,
    DosageForm,
    Supply,
    SupplyCategory,
    CompoundFormulation,
    DoctorEncounterRecord,
    PatientDiagnosis,
    PatientProcedure,
    Prescription
} from '../types/doctor.types'

// ============ Diagnosis Codes (ICD-10) ============

export const dummyDiagnosisCodes: DiagnosisCode[] = [
    // Infectious diseases
    { id: 'dx-001', code: 'A09', name: 'Diarrhoea and gastroenteritis', category: 'Infectious' },
    { id: 'dx-002', code: 'A09.9', name: 'Gastroenteritis akut', category: 'Infectious' },

    // Respiratory
    { id: 'dx-003', code: 'J00', name: 'Acute nasopharyngitis (common cold)', category: 'Respiratory' },
    { id: 'dx-004', code: 'J06.9', name: 'Acute upper respiratory infection', category: 'Respiratory' },
    { id: 'dx-005', code: 'J18.9', name: 'Pneumonia, unspecified', category: 'Respiratory' },
    { id: 'dx-006', code: 'J20.9', name: 'Acute bronchitis', category: 'Respiratory' },
    { id: 'dx-007', code: 'J45.9', name: 'Asthma, unspecified', category: 'Respiratory' },

    // Cardiovascular
    { id: 'dx-008', code: 'I10', name: 'Essential (primary) hypertension', category: 'Cardiovascular' },
    { id: 'dx-009', code: 'I25.10', name: 'Coronary artery disease', category: 'Cardiovascular' },
    { id: 'dx-010', code: 'I50.9', name: 'Heart failure', category: 'Cardiovascular' },

    // Endocrine
    { id: 'dx-011', code: 'E11', name: 'Type 2 diabetes mellitus', category: 'Endocrine' },
    { id: 'dx-012', code: 'E11.9', name: 'Type 2 diabetes without complications', category: 'Endocrine' },
    { id: 'dx-013', code: 'E78.5', name: 'Hyperlipidaemia', category: 'Endocrine' },

    // Musculoskeletal
    { id: 'dx-014', code: 'M25.50', name: 'Pain in joint', category: 'Musculoskeletal' },
    { id: 'dx-015', code: 'M54.5', name: 'Low back pain', category: 'Musculoskeletal' },
    { id: 'dx-016', code: 'M79.3', name: 'Myalgia', category: 'Musculoskeletal' },

    // Digestive
    { id: 'dx-017', code: 'K30', name: 'Dyspepsia', category: 'Digestive' },
    { id: 'dx-018', code: 'K29.7', name: 'Gastritis', category: 'Digestive' },

    // Skin
    { id: 'dx-019', code: 'L30.9', name: 'Dermatitis', category: 'Skin' },
    { id: 'dx-020', code: 'L50.9', name: 'Urticaria', category: 'Skin' },

    // General
    { id: 'dx-021', code: 'R50.9', name: 'Fever, unspecified', category: 'Symptoms' },
    { id: 'dx-022', code: 'R51', name: 'Headache', category: 'Symptoms' },
    { id: 'dx-023', code: 'R05', name: 'Cough', category: 'Symptoms' },
    { id: 'dx-024', code: 'R10.4', name: 'Abdominal pain', category: 'Symptoms' }
]

// ============ Medical Procedures ============

export const dummyMedicalProcedures: MedicalProcedure[] = [
    { id: 'proc-001', code: 'PE-001', icd9Code: '89.7', name: 'Pemeriksaan Fisik Lengkap', category: 'Examination', price: 50000 },
    { id: 'proc-002', code: 'INJ-001', icd9Code: '99.29', name: 'Injeksi Intramuskular', category: 'Injection', price: 25000 },
    { id: 'proc-003', code: 'INJ-002', icd9Code: '99.21', name: 'Injeksi Intravena', category: 'Injection', price: 30000 },
    { id: 'proc-004', code: 'INF-001', icd9Code: '38.93', name: 'Pemasangan Infus', category: 'Infusion', price: 75000 },
    { id: 'proc-005', code: 'WC-001', icd9Code: '93.57', name: 'Perawatan Luka Kecil', category: 'Wound Care', price: 40000 },
    { id: 'proc-006', code: 'WC-002', icd9Code: '93.57', name: 'Perawatan Luka Sedang', category: 'Wound Care', price: 75000 },
    { id: 'proc-007', code: 'WC-003', icd9Code: '86.59', name: 'Jahit Luka', category: 'Minor Surgery', price: 150000 },
    { id: 'proc-008', code: 'NEB-001', icd9Code: '93.96', name: 'Nebulisasi', category: 'Respiratory', price: 35000 },
    { id: 'proc-009', code: 'EKG-001', icd9Code: '89.52', name: 'Pemeriksaan EKG', category: 'Diagnostic', price: 100000 },
    { id: 'proc-010', code: 'LAB-001', icd9Code: '38.91', name: 'Pengambilan Darah', category: 'Laboratory', price: 20000 },
    { id: 'proc-011', code: 'CATH-001', icd9Code: '57.94', name: 'Pemasangan Kateter Urin', category: 'Procedure', price: 80000 },
    { id: 'proc-012', code: 'MINOR-001', icd9Code: '86.3', name: 'Tindakan Bedah Minor', category: 'Minor Surgery', price: 250000 },
    { id: 'proc-013', code: 'DRESS-001', icd9Code: '97.16', name: 'Ganti Balutan', category: 'Wound Care', price: 30000 },
    { id: 'proc-014', code: 'SPUT-001', icd9Code: '96.59', name: 'Suction (Pengisapan Lendir)', category: 'Respiratory', price: 40000 },
    { id: 'proc-015', code: 'CONS-001', icd9Code: '89.08', name: 'Konsultasi Spesialis', category: 'Consultation', price: 150000 }
]

// ============ Medicines ============

export const dummyMedicines: Medicine[] = [
    // Analgesics & Antipyretics
    {
        id: 'med-001',
        code: 'MED-001',
        name: 'Paracetamol 500mg',
        category: MedicineCategory.ANTIPYRETIC,
        dosageForm: DosageForm.TABLET,
        strength: '500mg',
        unit: 'tablet',
        stock: 500,
        price: 500,
        manufacturer: 'Kimia Farma'
    },
    {
        id: 'med-002',
        code: 'MED-002',
        name: 'Ibuprofen 400mg',
        category: MedicineCategory.ANALGESIC,
        dosageForm: DosageForm.TABLET,
        strength: '400mg',
        unit: 'tablet',
        stock: 300,
        price: 1500,
        manufacturer: 'Kalbe Farma'
    },
    {
        id: 'med-003',
        code: 'MED-003',
        name: 'Asam Mefenamat 500mg',
        category: MedicineCategory.ANALGESIC,
        dosageForm: DosageForm.TABLET,
        strength: '500mg',
        unit: 'tablet',
        stock: 250,
        price: 1200
    },

    // Antibiotics
    {
        id: 'med-004',
        code: 'MED-004',
        name: 'Amoxicillin 500mg',
        category: MedicineCategory.ANTIBIOTIC,
        dosageForm: DosageForm.CAPSULE,
        strength: '500mg',
        unit: 'kapsul',
        stock: 400,
        price: 2000,
        manufacturer: 'Sanbe Farma'
    },
    {
        id: 'med-005',
        code: 'MED-005',
        name: 'Ciprofloxacin 500mg',
        category: MedicineCategory.ANTIBIOTIC,
        dosageForm: DosageForm.TABLET,
        strength: '500mg',
        unit: 'tablet',
        stock: 200,
        price: 3500
    },
    {
        id: 'med-006',
        code: 'MED-006',
        name: 'Cefadroxil 500mg',
        category: MedicineCategory.ANTIBIOTIC,
        dosageForm: DosageForm.CAPSULE,
        strength: '500mg',
        unit: 'kapsul',
        stock: 180,
        price: 3000
    },
    {
        id: 'med-007',
        code: 'MED-007',
        name: 'Azithromycin 500mg',
        category: MedicineCategory.ANTIBIOTIC,
        dosageForm: DosageForm.TABLET,
        strength: '500mg',
        unit: 'tablet',
        stock: 150,
        price: 5000
    },

    // Antihypertensives
    {
        id: 'med-008',
        code: 'MED-008',
        name: 'Amlodipine 10mg',
        category: MedicineCategory.ANTIHYPERTENSIVE,
        dosageForm: DosageForm.TABLET,
        strength: '10mg',
        unit: 'tablet',
        stock: 300,
        price: 2500
    },
    {
        id: 'med-009',
        code: 'MED-009',
        name: 'Captopril 25mg',
        category: MedicineCategory.ANTIHYPERTENSIVE,
        dosageForm: DosageForm.TABLET,
        strength: '25mg',
        unit: 'tablet',
        stock: 350,
        price: 1500
    },

    // Antidiabetics
    {
        id: 'med-010',
        code: 'MED-010',
        name: 'Metformin 500mg',
        category: MedicineCategory.ANTIDIABETIC,
        dosageForm: DosageForm.TABLET,
        strength: '500mg',
        unit: 'tablet',
        stock: 400,
        price: 2000
    },
    {
        id: 'med-011',
        code: 'MED-011',
        name: 'Glimepiride 2mg',
        category: MedicineCategory.ANTIDIABETIC,
        dosageForm: DosageForm.TABLET,
        strength: '2mg',
        unit: 'tablet',
        stock: 200,
        price: 3500
    },

    // Antihistamines
    {
        id: 'med-012',
        code: 'MED-012',
        name: 'Cetirizine 10mg',
        category: MedicineCategory.ANTIHISTAMINE,
        dosageForm: DosageForm.TABLET,
        strength: '10mg',
        unit: 'tablet',
        stock: 300,
        price: 1500
    },
    {
        id: 'med-013',
        code: 'MED-013',
        name: 'Loratadine 10mg',
        category: MedicineCategory.ANTIHISTAMINE,
        dosageForm: DosageForm.TABLET,
        strength: '10mg',
        unit: 'tablet',
        stock: 250,
        price: 2000
    },

    // Antacids & Gastric
    {
        id: 'med-014',
        code: 'MED-014',
        name: 'Omeprazole 20mg',
        category: MedicineCategory.ANTACID,
        dosageForm: DosageForm.CAPSULE,
        strength: '20mg',
        unit: 'kapsul',
        stock: 280,
        price: 3000
    },
    {
        id: 'med-015',
        code: 'MED-015',
        name: 'Ranitidine 150mg',
        category: MedicineCategory.ANTACID,
        dosageForm: DosageForm.TABLET,
        strength: '150mg',
        unit: 'tablet',
        stock: 300,
        price: 1500
    },
    {
        id: 'med-016',
        code: 'MED-016',
        name: 'Antasida DOEN',
        category: MedicineCategory.ANTACID,
        dosageForm: DosageForm.TABLET,
        unit: 'tablet',
        stock: 400,
        price: 500
    },

    // Vitamins
    {
        id: 'med-017',
        code: 'MED-017',
        name: 'Vitamin B Complex',
        category: MedicineCategory.VITAMIN,
        dosageForm: DosageForm.TABLET,
        unit: 'tablet',
        stock: 500,
        price: 1000
    },
    {
        id: 'med-018',
        code: 'MED-018',
        name: 'Vitamin C 500mg',
        category: MedicineCategory.VITAMIN,
        dosageForm: DosageForm.TABLET,
        strength: '500mg',
        unit: 'tablet',
        stock: 600,
        price: 800
    },
    {
        id: 'med-019',
        code: 'MED-019',
        name: 'Multivitamin',
        category: MedicineCategory.VITAMIN,
        dosageForm: DosageForm.CAPSULE,
        unit: 'kapsul',
        stock: 400,
        price: 2500
    },

    // Syrups
    {
        id: 'med-020',
        code: 'MED-020',
        name: 'Paracetamol Syrup 120mg/5ml',
        category: MedicineCategory.ANTIPYRETIC,
        dosageForm: DosageForm.SYRUP,
        strength: '120mg/5ml',
        unit: 'botol 60ml',
        stock: 100,
        price: 15000
    },
    {
        id: 'med-021',
        code: 'MED-021',
        name: 'Ambroxol Syrup 15mg/5ml',
        category: MedicineCategory.OTHER,
        dosageForm: DosageForm.SYRUP,
        strength: '15mg/5ml',
        unit: 'botol 60ml',
        stock: 80,
        price: 18000,
        description: 'Obat batuk ekspektoran'
    },
    {
        id: 'med-022',
        code: 'MED-022',
        name: 'OBH Sirup',
        category: MedicineCategory.OTHER,
        dosageForm: DosageForm.SYRUP,
        unit: 'botol 100ml',
        stock: 90,
        price: 12000,
        description: 'Obat batuk'
    },

    // Injections
    {
        id: 'med-023',
        code: 'MED-023',
        name: 'Dexamethasone 5mg/ml',
        category: MedicineCategory.OTHER,
        dosageForm: DosageForm.INJECTION,
        strength: '5mg/ml',
        unit: 'ampul',
        stock: 150,
        price: 8000,
        description: 'Anti-inflamasi'
    },
    {
        id: 'med-024',
        code: 'MED-024',
        name: 'Ketorolac 30mg/ml',
        category: MedicineCategory.ANALGESIC,
        dosageForm: DosageForm.INJECTION,
        strength: '30mg/ml',
        unit: 'ampul',
        stock: 120,
        price: 15000
    },
    {
        id: 'med-025',
        code: 'MED-025',
        name: 'Vitamin B12 Injeksi',
        category: MedicineCategory.VITAMIN,
        dosageForm: DosageForm.INJECTION,
        unit: 'ampul',
        stock: 100,
        price: 12000
    },

    // Topical
    {
        id: 'med-026',
        code: 'MED-026',
        name: 'Hydrocortisone Cream 1%',
        category: MedicineCategory.OTHER,
        dosageForm: DosageForm.CREAM,
        strength: '1%',
        unit: 'tube 5g',
        stock: 80,
        price: 15000,
        description: 'Krim anti-inflamasi'
    },
    {
        id: 'med-027',
        code: 'MED-027',
        name: 'Gentamicin Ointment',
        category: MedicineCategory.ANTIBIOTIC,
        dosageForm: DosageForm.OINTMENT,
        unit: 'tube 5g',
        stock: 70,
        price: 12000,
        description: 'Salep antibiotik'
    },

    // Eye/Ear Drops
    {
        id: 'med-028',
        code: 'MED-028',
        name: 'Chloramphenicol Eye Drops',
        category: MedicineCategory.ANTIBIOTIC,
        dosageForm: DosageForm.DROP,
        unit: 'botol 5ml',
        stock: 60,
        price: 18000
    },
    {
        id: 'med-029',
        code: 'MED-029',
        name: 'Ofloxacin Ear Drops',
        category: MedicineCategory.ANTIBIOTIC,
        dosageForm: DosageForm.DROP,
        unit: 'botol 5ml',
        stock: 50,
        price: 25000
    },

    // Inhalers
    {
        id: 'med-030',
        code: 'MED-030',
        name: 'Salbutamol Inhaler',
        category: MedicineCategory.OTHER,
        dosageForm: DosageForm.INHALER,
        unit: 'pcs',
        stock: 40,
        price: 75000,
        description: 'Bronkodilator untuk asma'
    }
]

// ============ Supplies/Barang Medis ============

export const dummySupplies: Supply[] = [
    // Wound Care
    { id: 'sup-001', code: 'SUP-001', name: 'Perban Elastis 4"', category: SupplyCategory.WOUND_CARE, unit: 'roll', stock: 200, price: 15000 },
    { id: 'sup-002', code: 'SUP-002', name: 'Perban Kasa 5cm x 4.5m', category: SupplyCategory.WOUND_CARE, unit: 'roll', stock: 150, price: 8000 },
    { id: 'sup-003', code: 'SUP-003', name: 'Kasa Steril 10x10cm', category: SupplyCategory.WOUND_CARE, unit: 'pcs', stock: 500, price: 2000 },
    { id: 'sup-004', code: 'SUP-004', name: 'Plester Luka 5cm x 4.5m', category: SupplyCategory.WOUND_CARE, unit: 'roll', stock: 180, price: 10000 },
    { id: 'sup-005', code: 'SUP-005', name: 'Plester Transparan 10cm x 10m', category: SupplyCategory.WOUND_CARE, unit: 'roll', stock: 100, price: 25000 },
    { id: 'sup-006', code: 'SUP-006', name: 'Kapas 100g', category: SupplyCategory.WOUND_CARE, unit: 'pack', stock: 300, price: 15000 },
    { id: 'sup-007', code: 'SUP-007', name: 'Povidone Iodine 60ml', category: SupplyCategory.WOUND_CARE, unit: 'botol', stock: 120, price: 12000 },
    { id: 'sup-008', code: 'SUP-008', name: 'Alkohol 70% 100ml', category: SupplyCategory.CONSUMABLES, unit: 'botol', stock: 200, price: 8000 },

    // Medical Equipment
    { id: 'sup-009', code: 'SUP-009', name: 'Handscoon Steril Size M', category: SupplyCategory.MEDICAL_EQUIPMENT, unit: 'pasang', stock: 400, price: 5000 },
    { id: 'sup-010', code: 'SUP-010', name: 'Handscoon Non-Steril Size L', category: SupplyCategory.MEDICAL_EQUIPMENT, unit: 'pcs', stock: 1000, price: 1500 },
    { id: 'sup-011', code: 'SUP-011', name: 'Masker Medis 3 Ply', category: SupplyCategory.MEDICAL_EQUIPMENT, unit: 'pcs', stock: 2000, price: 1000 },
    { id: 'sup-012', code: 'SUP-012', name: 'Syringe 3ml + Needle', category: SupplyCategory.MEDICAL_EQUIPMENT, unit: 'pcs', stock: 800, price: 2500 },
    { id: 'sup-013', code: 'SUP-013', name: 'Syringe 5ml + Needle', category: SupplyCategory.MEDICAL_EQUIPMENT, unit: 'pcs', stock: 600, price: 3000 },
    { id: 'sup-014', code: 'SUP-014', name: 'Syringe 10ml + Needle', category: SupplyCategory.MEDICAL_EQUIPMENT, unit: 'pcs', stock: 400, price: 3500 },
    { id: 'sup-015', code: 'SUP-015', name: 'Infus Set', category: SupplyCategory.MEDICAL_EQUIPMENT, unit: 'set', stock: 300, price: 12000 },
    { id: 'sup-016', code: 'SUP-016', name: 'Kateter Urin No.16', category: SupplyCategory.MEDICAL_EQUIPMENT, unit: 'pcs', stock: 100, price: 15000 },

    // Consumables
    { id: 'sup-017', code: 'SUP-017', name: 'Alkohol Swab', category: SupplyCategory.CONSUMABLES, unit: 'pcs', stock: 2000, price: 500 },
    { id: 'sup-018', code: 'SUP-018', name: 'Cotton Bud Steril', category: SupplyCategory.CONSUMABLES, unit: 'pack', stock: 400, price: 3000 },
    { id: 'sup-019', code: 'SUP-019', name: 'Tissue Medis', category: SupplyCategory.CONSUMABLES, unit: 'box', stock: 250, price: 8000 },
    { id: 'sup-020', code: 'SUP-020', name: 'Underpad 60x90cm', category: SupplyCategory.CONSUMABLES, unit: 'pcs', stock: 500, price: 5000 },

    // Laboratory
    { id: 'sup-021', code: 'SUP-021', name: 'Blood Tube EDTA', category: SupplyCategory.LABORATORY, unit: 'pcs', stock: 600, price: 3000 },
    { id: 'sup-022', code: 'SUP-022', name: 'Urine Container Steril', category: SupplyCategory.LABORATORY, unit: 'pcs', stock: 400, price: 2000 }
]

// ============ Storage for Dynamic Data ============

export const dummyCompoundFormulations: CompoundFormulation[] = []
export const dummyDoctorRecords: DoctorEncounterRecord[] = []
export const dummyDiagnoses: PatientDiagnosis[] = []
export const dummyProcedures: PatientProcedure[] = []
export const dummyPrescriptions: Prescription[] = []
