import { PatientQueue, VitalSigns, Anamnesis, PhysicalExamination } from './nurse.types'

export interface DiagnosisCode {
    id: string
    code: string
    name: string
    description?: string
    category?: string
}

export interface PatientDiagnosis {
    id?: string
    diagnosisCode: DiagnosisCode
    isPrimary: boolean
    notes?: string
    diagnosedAt: string
}

export interface MedicalProcedure {
    id: string
    code: string
    icd9Code?: string
    name: string
    description?: string
    category?: string
    system?: string
}

export interface PatientProcedure {
    id?: string
    procedure: MedicalProcedure
    notes?: string
    performedAt: string
}

export enum MedicineCategory {
    ANTIBIOTIC = 'ANTIBIOTIC',
    ANALGESIC = 'ANALGESIC',
    ANTIPYRETIC = 'ANTIPYRETIC',
    ANTIHYPERTENSIVE = 'ANTIHYPERTENSIVE',
    ANTIDIABETIC = 'ANTIDIABETIC',
    VITAMIN = 'VITAMIN',
    ANTIHISTAMINE = 'ANTIHISTAMINE',
    ANTACID = 'ANTACID',
    OTHER = 'OTHER'
}

export enum DosageForm {
    TABLET = 'TABLET',
    CAPSULE = 'CAPSULE',
    SYRUP = 'SYRUP',
    INJECTION = 'INJECTION',
    CREAM = 'CREAM',
    OINTMENT = 'OINTMENT',
    DROP = 'DROP',
    INHALER = 'INHALER'
}

export interface Medicine {
    id: string
    code: string
    name: string
    category: MedicineCategory
    dosageForm: DosageForm
    strength?: string
    unit: string
    stock: number
    price: number
    manufacturer?: string
    description?: string
}

export enum SupplyCategory {
    MEDICAL_EQUIPMENT = 'MEDICAL_EQUIPMENT',
    CONSUMABLES = 'CONSUMABLES',
    WOUND_CARE = 'WOUND_CARE',
    LABORATORY = 'LABORATORY',
    OTHER = 'OTHER'
}

export interface Supply {
    id: string
    code: string
    name: string
    category: SupplyCategory
    unit: string
    stock: number
    price: number
    description?: string
}

export interface CompoundIngredient {
    id?: string
    item: Medicine | Supply
    quantity: number
    dosage: string
}

export interface CompoundFormulation {
    id?: string
    name: string
    ingredients: CompoundIngredient[]
    instructions: string
    createdBy?: string
    createdAt?: string
}

export enum PrescriptionItemType {
    MEDICINE = 'MEDICINE',
    SUPPLY = 'SUPPLY',
    COMPOUND = 'COMPOUND'
}

export interface PrescriptionItem {
    id?: string
    type: PrescriptionItemType
    item: Medicine | Supply | CompoundFormulation
    quantity: number
    dosageInstructions: string
    notes?: string
}

export interface Prescription {
    id?: string
    encounterId: string
    patientId: string
    doctorId: string
    doctorName: string
    items: PrescriptionItem[]
    additionalNotes?: string
    prescriptionDate: string
    status?: 'pending' | 'processed' | 'completed'
}

export interface DoctorEncounterRecord {
    id?: string
    encounterId: string
    patientId: string
    doctorId: string
    doctorName: string
    nurseRecordId?: string
    diagnoses: PatientDiagnosis[]
    procedures: PatientProcedure[]
    prescription?: Prescription
    clinicalNotes?: string
    followUpInstructions?: string
    referralNotes?: string
    examinationDate: string
    completedAt?: string
}

export interface SaveDiagnosisAndProceduresRequest {
    encounterId: string
    patientId?: string
    diagnoses: PatientDiagnosis[]
    procedures: PatientProcedure[]
    clinicalNotes?: string
    referralNotes?: string
}

export interface SaveDiagnosisAndProceduresResponse {
    success: boolean
    message: string
    recordId?: string
}

export interface CreatePrescriptionRequest {
    prescription: Prescription
}

export interface CreatePrescriptionResponse {
    success: boolean
    message: string
    prescriptionId?: string
}

export interface SaveCompoundFormulationRequest {
    compound: CompoundFormulation
}

export interface SaveCompoundFormulationResponse {
    success: boolean
    message: string
    compoundId?: string
}

export interface PatientWithMedicalRecord extends PatientQueue {
    paymentMethod?: string
    nurseRecord?: {
        vitalSigns: VitalSigns
        anamnesis: Anamnesis
        physicalExamination: PhysicalExamination
        examinationDate: string
        nurseName: string
    }
    doctorRecord?: DoctorEncounterRecord
}
