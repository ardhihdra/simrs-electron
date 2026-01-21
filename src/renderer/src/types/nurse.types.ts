// Type definitions for Nurse Flow Module

export enum PatientStatus {
    WAITING = 'WAITING',
    CALLED = 'CALLED',
    EXAMINING = 'EXAMINING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE'
}

export interface Patient {
    id: string
    medicalRecordNumber: string
    name: string
    gender: Gender
    birthDate: string
    age: number
    phone: string
    address: string
    identityNumber: string // NIK
}

export interface Poli {
    id: string
    code: string
    name: string
    description?: string
}

export interface Doctor {
    id: string
    name: string
    specialization: string
    sipNumber: string // Surat Izin Praktik
}

export interface PatientQueue {
    id: string
    queueNumber: number
    patient: Patient
    poli: Poli
    doctor: Doctor
    status: PatientStatus
    registrationDate: string
    calledAt?: string
    examinedAt?: string
    completedAt?: string
    encounterId?: string
}

export interface VitalSigns {
    // Tekanan Darah
    systolicBloodPressure: number // mmHg
    diastolicBloodPressure: number // mmHg

    // Suhu Tubuh
    temperature: number // Celsius

    // Nadi
    pulseRate: number // bpm (beats per minute)

    // Pernapasan
    respiratoryRate: number // breaths per minute

    // Antropometri
    height: number // cm
    weight: number // kg
    bmi?: number // calculated automatically

    // Saturasi Oksigen
    oxygenSaturation: number // SpO2 percentage
}

export interface Anamnesis {
    chiefComplaint: string // Keluhan Utama
    historyOfPresentIllness: string // Riwayat Penyakit Sekarang
    historyOfPastIllness?: string // Riwayat Penyakit Dahulu
    allergyHistory?: string // Riwayat Alergi
}

export interface PhysicalExamination {
    consciousness: string // Kesadaran (Composmentis, Apatis, Somnolen, dll)
    generalCondition: string // Keadaan Umum (Baik, Sedang, Buruk)
    additionalNotes?: string // Catatan tambahan
}

export interface MedicalRecord {
    id?: string
    encounterId: string
    patientId: string
    nurseId: string
    nurseName: string
    vitalSigns: VitalSigns
    anamnesis: Anamnesis
    physicalExamination: PhysicalExamination
    examinationDate: string
    notes?: string
}

export interface CallPatientRequest {
    queueId: string
    encounterId: string
}

export interface CallPatientResponse {
    success: boolean
    message: string
    encounter?: {
        id: string
        patient: Patient
        queueNumber: number
    }
}

export interface SubmitMedicalRecordRequest {
    medicalRecord: MedicalRecord
}

export interface SubmitMedicalRecordResponse {
    success: boolean
    message: string
    recordId?: string
}
