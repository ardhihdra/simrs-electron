import {
    DiagnosisCode,
    MedicalProcedure,
    Medicine,
    MedicineCategory,
    Supply,
    SupplyCategory,
    CompoundFormulation,
    SaveDiagnosisAndProceduresRequest,
    SaveDiagnosisAndProceduresResponse,
    CreatePrescriptionRequest,
    CreatePrescriptionResponse,
    SaveCompoundFormulationRequest,
    SaveCompoundFormulationResponse,
    DoctorEncounterRecord,
    PatientWithMedicalRecord
} from '../types/doctor.types'
import { PatientStatus } from '../types/nurse.types'
import {
    dummyDiagnosisCodes,
    dummyMedicalProcedures,
    dummyMedicines,
    dummySupplies,
    dummyCompoundFormulations,
    dummyDoctorRecords,
    dummyPrescriptions
} from './doctor-dummy-data'
import { dummyPatientQueue, dummyMedicalRecords } from './dummy-data'

// Simulated API delay
const simulateDelay = (ms: number = 500): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get patients for doctor (status EXAMINING - already called by nurse)
 * @param doctorId - Optional filter by doctor
 * @param poliId - Optional filter by poli
 */
export const getPatientsForDoctor = async (
    doctorId?: string,
    poliId?: string
): Promise<PatientWithMedicalRecord[]> => {
    await simulateDelay(300)

    let patients = dummyPatientQueue.filter(
        (q) => q.status === PatientStatus.EXAMINING || q.status === PatientStatus.CALLED
    )

    if (doctorId) {
        patients = patients.filter((p) => p.doctor.id === doctorId)
    }

    if (poliId) {
        patients = patients.filter((p) => p.poli.id === poliId)
    }

    // Map to PatientWithMedicalRecord
    const patientsWithRecords: PatientWithMedicalRecord[] = patients.map((patient) => {
        // Find nurse record
        const nurseRecord = dummyMedicalRecords.find((r) => r.encounterId === patient.encounterId)

        // Find doctor record
        const doctorRecord = dummyDoctorRecords.find((r) => r.encounterId === patient.encounterId)

        return {
            ...patient,
            nurseRecord: nurseRecord
                ? {
                    vitalSigns: nurseRecord.vitalSigns,
                    anamnesis: nurseRecord.anamnesis,
                    physicalExamination: nurseRecord.physicalExamination,
                    examinationDate: nurseRecord.examinationDate,
                    nurseName: nurseRecord.nurseName
                }
                : undefined,
            doctorRecord
        }
    })

    return patientsWithRecords
}

/**
 * Get patient with complete medical record
 */
export const getPatientMedicalRecord = async (
    encounterId: string
): Promise<PatientWithMedicalRecord | null> => {
    await simulateDelay(300)

    const patient = dummyPatientQueue.find((q) => q.encounterId === encounterId)
    if (!patient) return null

    const nurseRecord = dummyMedicalRecords.find((r) => r.encounterId === encounterId)
    const doctorRecord = dummyDoctorRecords.find((r) => r.encounterId === encounterId)

    return {
        ...patient,
        nurseRecord: nurseRecord
            ? {
                vitalSigns: nurseRecord.vitalSigns,
                anamnesis: nurseRecord.anamnesis,
                physicalExamination: nurseRecord.physicalExamination,
                examinationDate: nurseRecord.examinationDate,
                nurseName: nurseRecord.nurseName
            }
            : undefined,
        doctorRecord
    }
}

/**
 * Search diagnosis codes (ICD-10)
 */
export const searchDiagnosisCodes = async (query: string): Promise<DiagnosisCode[]> => {
    await simulateDelay(200)

    if (!query || query.length < 2) {
        return dummyDiagnosisCodes.slice(0, 10) // Return first 10 by default
    }

    const lowerQuery = query.toLowerCase()
    return dummyDiagnosisCodes.filter(
        (dx) =>
            dx.code.toLowerCase().includes(lowerQuery) ||
            dx.name.toLowerCase().includes(lowerQuery) ||
            dx.category?.toLowerCase().includes(lowerQuery)
    )
}

/**
 * Get all diagnosis codes
 */
export const getAllDiagnosisCodes = async (): Promise<DiagnosisCode[]> => {
    await simulateDelay(200)
    return dummyDiagnosisCodes
}

/**
 * Get medical procedures
 */
export const getMedicalProcedures = async (): Promise<MedicalProcedure[]> => {
    await simulateDelay(200)
    return dummyMedicalProcedures
}

/**
 * Search medical procedures
 */
export const searchMedicalProcedures = async (query: string): Promise<MedicalProcedure[]> => {
    await simulateDelay(200)

    if (!query || query.length < 2) {
        return dummyMedicalProcedures
    }

    const lowerQuery = query.toLowerCase()
    return dummyMedicalProcedures.filter(
        (proc) =>
            proc.code.toLowerCase().includes(lowerQuery) ||
            proc.name.toLowerCase().includes(lowerQuery) ||
            proc.category?.toLowerCase().includes(lowerQuery)
    )
}

/**
 * Save diagnosis and procedures
 */
export const saveDiagnosisAndProcedures = async (
    request: SaveDiagnosisAndProceduresRequest
): Promise<SaveDiagnosisAndProceduresResponse> => {
    await simulateDelay(700)

    try {
        const recordId = `doc-rec-${Date.now()}`

        const doctorRecord: DoctorEncounterRecord = {
            id: recordId,
            encounterId: request.encounterId,
            patientId: '', // Will be filled from encounter
            doctorId: 'doctor-001', // TODO: Get from logged in user
            doctorName: 'dr. Ahmad Fauzi, Sp.PD', // TODO: Get from logged in user
            diagnoses: request.diagnoses,
            procedures: request.procedures,
            clinicalNotes: request.clinicalNotes,
            referralNotes: request.referralNotes,
            examinationDate: new Date().toISOString()
        }

        // Find patient for patientId
        const patient = dummyPatientQueue.find((q) => q.encounterId === request.encounterId)
        if (patient) {
            doctorRecord.patientId = patient.patient.id
        }

        dummyDoctorRecords.push(doctorRecord)

        console.log('Doctor record saved:', doctorRecord)
        console.log('Total doctor records:', dummyDoctorRecords.length)

        return {
            success: true,
            message: 'Data diagnosis dan tindakan berhasil disimpan',
            recordId
        }
    } catch (error) {
        console.error('Error saving diagnosis and procedures:', error)
        return {
            success: false,
            message: 'Gagal menyimpan data diagnosis dan tindakan'
        }
    }
}

/**
 * Get medicines with optional category filter
 */
export const getMedicines = async (category?: MedicineCategory): Promise<Medicine[]> => {
    await simulateDelay(300)

    if (!category) {
        return dummyMedicines
    }

    return dummyMedicines.filter((med) => med.category === category)
}

/**
 * Search medicines by name
 */
export const searchMedicines = async (query: string): Promise<Medicine[]> => {
    await simulateDelay(200)

    if (!query || query.length < 2) {
        return dummyMedicines.slice(0, 20) // Return first 20 by default
    }

    const lowerQuery = query.toLowerCase()
    return dummyMedicines.filter(
        (med) =>
            med.name.toLowerCase().includes(lowerQuery) ||
            med.code.toLowerCase().includes(lowerQuery) ||
            med.category.toLowerCase().includes(lowerQuery)
    )
}

/**
 * Get supplies with optional category filter
 */
export const getSupplies = async (category?: SupplyCategory): Promise<Supply[]> => {
    await simulateDelay(300)

    if (!category) {
        return dummySupplies
    }

    return dummySupplies.filter((sup) => sup.category === category)
}

/**
 * Search supplies by name
 */
export const searchSupplies = async (query: string): Promise<Supply[]> => {
    await simulateDelay(200)

    if (!query || query.length < 2) {
        return dummySupplies
    }

    const lowerQuery = query.toLowerCase()
    return dummySupplies.filter(
        (sup) =>
            sup.name.toLowerCase().includes(lowerQuery) ||
            sup.code.toLowerCase().includes(lowerQuery) ||
            sup.category.toLowerCase().includes(lowerQuery)
    )
}

/**
 * Save compound formulation (racikan)
 */
export const saveCompoundFormulation = async (
    request: SaveCompoundFormulationRequest
): Promise<SaveCompoundFormulationResponse> => {
    await simulateDelay(500)

    try {
        const compoundId = `comp-${Date.now()}`

        const compound: CompoundFormulation = {
            ...request.compound,
            id: compoundId,
            createdBy: 'doctor-001', // TODO: Get from logged in user
            createdAt: new Date().toISOString()
        }

        dummyCompoundFormulations.push(compound)

        console.log('Compound formulation saved:', compound)
        console.log('Total compounds:', dummyCompoundFormulations.length)

        return {
            success: true,
            message: 'Racikan berhasil disimpan',
            compoundId
        }
    } catch (error) {
        console.error('Error saving compound:', error)
        return {
            success: false,
            message: 'Gagal menyimpan racikan'
        }
    }
}

/**
 * Get all compound formulations
 */
export const getCompoundFormulations = async (): Promise<CompoundFormulation[]> => {
    await simulateDelay(200)
    return dummyCompoundFormulations
}

/**
 * Create prescription
 */
export const createPrescription = async (
    request: CreatePrescriptionRequest
): Promise<CreatePrescriptionResponse> => {
    await simulateDelay(800)

    try {
        const prescriptionId = `presc-${Date.now()}`

        const prescription = {
            ...request.prescription,
            id: prescriptionId,
            prescriptionDate: new Date().toISOString(),
            status: 'pending' as const
        }

        dummyPrescriptions.push(prescription)

        // Update encounter status to COMPLETED
        const queue = dummyPatientQueue.find((q) => q.encounterId === request.prescription.encounterId)
        if (queue) {
            queue.status = PatientStatus.COMPLETED
            queue.completedAt = new Date().toISOString()
        }

        // Update doctor record with prescription
        const doctorRecord = dummyDoctorRecords.find(
            (r) => r.encounterId === request.prescription.encounterId
        )
        if (doctorRecord) {
            doctorRecord.prescription = prescription
            doctorRecord.completedAt = new Date().toISOString()
        }

        console.log('Prescription created:', prescription)
        console.log('Total prescriptions:', dummyPrescriptions.length)

        return {
            success: true,
            message: 'Resep berhasil dibuat',
            prescriptionId
        }
    } catch (error) {
        console.error('Error creating prescription:', error)
        return {
            success: false,
            message: 'Gagal membuat resep'
        }
    }
}

/**
 * Get prescription by encounter ID
 */
export const getPrescriptionByEncounter = async (encounterId: string): Promise<any | null> => {
    await simulateDelay(200)
    const prescription = dummyPrescriptions.find((p) => p.encounterId === encounterId)
    return prescription || null
}

/**
 * Get doctor record by encounter ID
 */
export const getDoctorRecordByEncounter = async (
    encounterId: string
): Promise<DoctorEncounterRecord | null> => {
    await simulateDelay(200)
    const record = dummyDoctorRecords.find((r) => r.encounterId === encounterId)
    return record || null
}
