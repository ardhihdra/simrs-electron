// Type definitions for Doctor Flow Module

import { Patient, PatientQueue, VitalSigns, Anamnesis, PhysicalExamination } from './nurse.types'

// ============ Diagnosis Types ============

export interface DiagnosisCode {
    id: string
    code: string // ICD-10 code
    name: string
    description?: string
    category?: string
}

export interface PatientDiagnosis {
    id?: string
    diagnosisCode: DiagnosisCode
    isPrimary: boolean // Primary diagnosis flag
    notes?: string
    diagnosedAt: string
}

// ============ Medical Procedure Types ============

export interface MedicalProcedure {
    id: string
    code: string // Internal/custom code
    icd9Code?: string // ICD-9-CM procedure code (for billing & Satu Sehat)
    name: string
    description?: string
    category?: string
    price: number
}

export interface PatientProcedure {
    id?: string
    procedure: MedicalProcedure
    notes?: string
    performedAt: string
}

// ============ Medicine Types ============

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
    strength?: string // e.g., "500mg", "10mg/ml"
    unit: string // tablet, kapsul, ml, dll
    stock: number
    price: number
    manufacturer?: string
    description?: string
}

// ============ Supply Types ============

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

// ============ Compound/Racikan Types ============

export interface CompoundIngredient {
    id?: string
    item: Medicine | Supply // Bahan bisa dari obat atau barang
    itemType: 'medicine' | 'supply'
    quantity: number
    dosage: string // Takaran, e.g., "1 sendok teh", "5 ml"
}

export interface CompoundFormulation {
    id?: string
    name: string // Nama racikan
    ingredients: CompoundIngredient[]
    instructions: string // Keterangan cara pakai
    createdBy?: string
    createdAt?: string
}

// ============ Prescription Types ============

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
    dosageInstructions: string // e.g., "3x1 sehari sesudah makan"
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

// ============ Doctor Encounter Record ============

export interface DoctorEncounterRecord {
    id?: string
    encounterId: string
    patientId: string
    doctorId: string
    doctorName: string

    // Reference to nurse data
    nurseRecordId?: string

    // Doctor's additions
    diagnoses: PatientDiagnosis[]
    procedures: PatientProcedure[]
    prescription?: Prescription

    // Additional notes
    clinicalNotes?: string
    followUpInstructions?: string
    referralNotes?: string // Catatan rujukan

    examinationDate: string
    completedAt?: string
}

// ============ Request/Response Types ============

export interface SaveDiagnosisAndProceduresRequest {
    encounterId: string
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

// ============ View Models ============

export interface PatientWithMedicalRecord extends PatientQueue {
    nurseRecord?: {
        vitalSigns: VitalSigns
        anamnesis: Anamnesis
        physicalExamination: PhysicalExamination
        examinationDate: string
        nurseName: string
    }
    doctorRecord?: DoctorEncounterRecord
}
