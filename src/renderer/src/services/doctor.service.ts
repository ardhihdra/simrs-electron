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
    dummySupplies,
    dummyCompoundFormulations,
    dummyDoctorRecords,
    dummyPrescriptions
} from './doctor-dummy-data'
import { dummyPatientQueue, dummyMedicalRecords } from './dummy-data'

const simulateDelay = (ms: number = 500): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

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
    try {
        // 1. Fetch Encounter to get Patient details
        const encounterRes = await window.api.query.encounter.getById({ id: encounterId })

        // encounterRes.data IS the encounter object because parseBackendResponse returns the 'result' field
        if (!encounterRes.success || !encounterRes.data) {
            console.error('Encounter not found or error:', encounterRes.error)
            return null
        }

        const encounter = encounterRes.data
        const patient = encounter.patient

        if (!patient) {
            console.error('Encounter has no patient data')
            return null
        }

        // 2. Fetch Observations for Nurse Record
        const obsRes = await window.api.query.observation.getByEncounter({ encounterId })
        const observations = obsRes.success && obsRes.result?.grouped ? obsRes.result.grouped : null

        // Map observations to NurseRecord structure
        let nurseRecord: PatientWithMedicalRecord['nurseRecord'] | undefined

        if (observations) {
            // Helper to extract value from observation array
            const getVal = (arr: any[], codes: string | string[]) => {
                const codeList = Array.isArray(codes) ? codes : [codes]
                const obs = arr.find(o => o.codeCoding?.[0]?.code && codeList.includes(o.codeCoding[0].code))
                return obs?.valueString || obs?.valueQuantity?.value || obs?.valueBoolean || obs?.valueInteger || '-'
            }

            // Vital Signs
            const vitalSigns = {
                systolicBloodPressure: getVal(observations.vitalSigns || [], ['systolic-blood-pressure', '8480-6']),
                diastolicBloodPressure: getVal(observations.vitalSigns || [], ['diastolic-blood-pressure', '8462-4']),
                heartRate: getVal(observations.vitalSigns || [], ['heart-rate', '8867-4']),
                pulseRate: getVal(observations.vitalSigns || [], ['pulse-rate', 'heart-rate', '8867-4']),
                respiratoryRate: getVal(observations.vitalSigns || [], ['respiratory-rate', '9279-1']),
                temperature: getVal(observations.vitalSigns || [], ['body-temperature', '8310-5']),
                oxygenSaturation: getVal(observations.vitalSigns || [], ['oxygen-saturation', '2708-6', '59408-5']),
                height: getVal(observations.vitalSigns || [], ['body-height', '8302-2']),
                weight: getVal(observations.vitalSigns || [], ['body-weight', '29463-7']),
                bmi: getVal(observations.vitalSigns || [], ['bmi', 'body-mass-index', '39156-5']),
                consciousness: getVal(observations.vitalSigns || [], ['consciousness']) // Fallback (though mostly in physicalExam)
            }

            // Anamnesis
            const anamnesis = {
                chiefComplaint: getVal(observations.anamnesis || [], ['chief-complaint']),
                mainComplaint: getVal(observations.anamnesis || [], ['chief-complaint']),
                historyOfPresentIllness: getVal(observations.anamnesis || [], ['history-present-illness', 'history-of-present-illness']),
                historyOfPastIllness: getVal(observations.anamnesis || [], ['history-past-illness', 'history-of-past-illness']),
                allergyHistory: getVal(observations.anamnesis || [], ['allergy-history']),
                allergies: getVal(observations.anamnesis || [], ['allergy-history'])
            }

            // Physical Exam
            const physicalExamination = {
                consciousness: getVal(observations.physicalExam || [], ['consciousness']),
                generalCondition: getVal(observations.physicalExam || [], ['general-condition']),
                additionalNotes: getVal(observations.physicalExam || [], ['additional-notes', 'physical-notes'])
            }

            nurseRecord = {
                vitalSigns,
                anamnesis,
                physicalExamination,
                examinationDate: encounter.period?.start ? String(encounter.period.start) : new Date().toISOString(),
                nurseName: 'Perawat Jaga' // TODO: Get from creator ID
            }
        }

        // Calculate Age
        const birthDate = patient.birthDate ? new Date(patient.birthDate) : new Date()
        const age = new Date().getFullYear() - birthDate.getFullYear()

        const patientWithRecord: PatientWithMedicalRecord = {
            id: String(patient.id),
            encounterId: String(encounter.id),
            queueNumber: parseInt(encounter.encounterCode?.split('-')?.[1] || '0'),
            patient: {
                id: String(patient.id),
                name: patient.name || 'Unknown',
                medicalRecordNumber: patient.medicalRecordNumber || '',
                gender: (patient.gender as any) || 'male',
                birthDate: patient.birthDate ? String(patient.birthDate) : '',
                phone: patient.phone || '',
                address: patient.address || '',
                identityNumber: patient.nik || '', // Map NIK to identityNumber
                age: age,
                // Extra fields for Doctor flow (if needed by other types, but Patient interface is strict)
                // mrn: patient.medicalRecordNumber || '', // Patient interface is strict, only supports fields in nurse.types.ts
                // paymentMethod: 'Umum' 
            } as any, // Cast as any because PatientWithMedicalRecord expects Patient from nurse.types.ts but might also be used elsewhere expecting extra fields
            status: encounter.status as any,
            paymentMethod: 'Umum', // Default
            registrationDate: encounter.period?.start ? String(encounter.period.start) : new Date().toISOString(),
            poli: {
                id: '',
                code: String(encounter.serviceType || ''),
                name: 'Poli Umum'
            },
            doctor: {
                id: '',
                name: '',
                specialization: 'Umum',
                sipNumber: ''
            },
            nurseRecord,
            doctorRecord: undefined // TODO: Fetch conditions and procedures when API is ready
        }

        return patientWithRecord

    } catch (error) {
        console.error('Error in getPatientMedicalRecord:', error)
        return null
    }
}

/**
 * Search diagnosis codes (ICD-10)
 */
/**
 * Search diagnosis codes (ICD-10)
 */
export const searchDiagnosisCodes = async (query: string): Promise<DiagnosisCode[]> => {
    try {
        if (!query || query.length < 2) {
            return []
        }

        const response = await window.api.query.diagnosisCode?.list({
            search: query,
            limit: 20
        })

        if (response?.success && Array.isArray(response.result)) {
            return response.result.map((item: any) => ({
                id: String(item.id),
                code: item.code,
                name: item.display || item.name || '',
                description: item.display,
                category: 'ICD-10'
            }))
        }
        return []
    } catch (error) {
        console.error('Error searching diagnosis codes:', error)
        return []
    }
}

/**
 * Get all diagnosis codes
 */
export const getAllDiagnosisCodes = async (): Promise<DiagnosisCode[]> => {
    // Ideally we shouldn't fetch ALL, but if needed, fetch a subset
    return searchDiagnosisCodes('a')
}

/**
 * Get medical procedures
 */
export const getMedicalProcedures = async (): Promise<MedicalProcedure[]> => {
    // Ideally we shouldn't fetch ALL, but if needed, fetch a subset
    return searchMedicalProcedures('a')
}

/**
 * Search medical procedures
 */
export const searchMedicalProcedures = async (query: string): Promise<MedicalProcedure[]> => {
    try {
        if (!query || query.length < 2) {
            return []
        }

        const response = await window.api.query.masterProcedure?.list({
            search: query,
            limit: 20
        })

        if (response?.success && Array.isArray(response.result)) {
            return response.result.map((item: any) => ({
                id: String(item.id),
                code: item.code,
                name: item.display || item.name || '',
                description: item.display,
                category: 'ICD-9-CM',
                icd9Code: item.code
            }))
        }
        return []
    } catch (error) {
        console.error('Error searching medical procedures:', error)
        return []
    }
}

/**
 * Save diagnosis and procedures
 */
export const saveDiagnosisAndProcedures = async (
    request: SaveDiagnosisAndProceduresRequest
): Promise<SaveDiagnosisAndProceduresResponse> => {
    try {
        const { encounterId, patientId, diagnoses, procedures } = request

        // Validate required data
        if (!patientId) {
            throw new Error('Patient ID is required')
        }

        const doctorId = 1 // TODO: Get from logged in user session

        // 1. Save Diagnoses (Conditions)
        if (diagnoses.length > 0) {
            const conditionsPayload = diagnoses.map((d) => ({
                diagnosisCodeId: parseInt(d.diagnosisCode.id),
                isPrimary: d.isPrimary,
                category: d.diagnosisCode.category,
                notes: d.notes
            }))

            const conditionRes = await window.api.query.condition.bulkCreate({
                encounterId,
                patientId,
                doctorId,
                conditions: conditionsPayload
            })

            if (!conditionRes.success) {
                console.error('Error saving conditions:', conditionRes.error)
                throw new Error(conditionRes.error || 'Failed to save diagnoses')
            }
        }

        // 2. Save Procedures
        if (procedures.length > 0) {
            const proceduresPayload = procedures.map((p) => ({
                procedureCodeId: parseInt(p.procedure.id),
                notes: p.notes,
                performedAt: p.performedAt
            }))

            const procedureRes = await window.api.query.procedure.bulkCreate({
                encounterId,
                patientId,
                doctorId,
                procedures: proceduresPayload
            })

            if (!procedureRes.success) {
                console.error('Error saving procedures:', procedureRes.error)
                throw new Error(procedureRes.error || 'Failed to save procedures')
            }
        }

        // 3. Save Clinical Notes and Referral Notes
        const notesToSave = []
        if (request.clinicalNotes) {
            notesToSave.push({
                type: 'progress',
                text: request.clinicalNotes
            })
        }
        if (request.referralNotes) {
            notesToSave.push({
                type: 'discharge', // Using 'discharge' type for referral/resume notes
                text: request.referralNotes
            })
        }

        if (notesToSave.length > 0) {
            const noteRes = await window.api.query.clinicalNote.upsert({
                encounterId,
                doctorId,
                notes: notesToSave
            })

            if (!noteRes.success) {
                console.error('Error saving clinical notes:', noteRes.error)
                // We don't throw error here to avoid blocking success if diagnoses/procedures saved ok? 
                // But user wants them saved. Let's log warning strictly. 
                // Or maybe throw? Better throw to alert user.
                throw new Error(noteRes.error || 'Failed to save clinical/referral notes')
            }
        }

        return {
            success: true,
            message: 'Data diagnosis dan tindakan berhasil disimpan ke database'
        }
    } catch (error: any) {
        console.error('Error saving diagnosis and procedures:', error)
        return {
            success: false,
            message: error.message || 'Gagal menyimpan data diagnosis dan tindakan'
        }
    }
}

/**
 * Get medicines with optional category filter
 */
/**
 * Get medicines with optional category filter
 */
export const getMedicines = async (category?: MedicineCategory): Promise<Medicine[]> => {
    try {
        const response = await window.api.query.medicine?.list({})

        if (response?.success && Array.isArray(response.result)) {
            let medicines = response.result.map((m: any) => ({
                id: String(m.id),
                code: m.code || `MED-${m.id}`,
                name: m.name,
                category: MedicineCategory.OTHER, // TODO: Map from m.medicineCategoryId
                dosageForm: DosageForm.TABLET, // TODO: Map form
                unit: 'pcs',
                stock: 100,
                price: parseFloat(m.sellingPrice) || 0,
                description: m.description
            })) as Medicine[]

            if (category) {
                medicines = medicines.filter(m => m.category === category)
            }

            return medicines
        }
        return []
    } catch (error) {
        console.error('Error fetching medicines:', error)
        return []
    }
}

export const searchMedicines = async (query: string): Promise<Medicine[]> => {
    try {
        // Since backend search isn't ready, we fetch all (limit 100) and filter
        // Ideally backend should support search
        const allMedicines = await getMedicines()

        if (!query || query.length < 2) {
            return allMedicines.slice(0, 20)
        }

        const lowerQuery = query.toLowerCase()
        return allMedicines.filter(
            (med) =>
                med.name.toLowerCase().includes(lowerQuery) ||
                med.code.toLowerCase().includes(lowerQuery) ||
                med.category.toLowerCase().includes(lowerQuery)
        )
    } catch (error) {
        console.error('Error searching medicines:', error)
        return []
    }
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
