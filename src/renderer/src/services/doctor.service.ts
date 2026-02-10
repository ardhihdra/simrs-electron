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
    PatientWithMedicalRecord,
    DosageForm,
    Prescription
} from '../types/doctor.types'
import { PatientStatus, Gender } from '../types/nurse.types'
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

    const patientsWithRecords: PatientWithMedicalRecord[] = patients.map((patient) => {
        const nurseRecord = dummyMedicalRecords.find((r) => r.encounterId === patient.encounterId)
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

interface BackendEncounterPatient {
    id: string
    name: string
    kode?: string
    medicalRecordNumber?: string
    gender?: string
    birthDate?: string | Date
    nik?: string
    phone?: string
    address?: string
}

interface BackendMedicine {
    id: string | number
    code?: string
    name: string
    medicineCategoryId?: string | number
    sellingPrice?: string | number
    description?: string
}

interface BackendConcept {
    id: string | number
    code: string
    display?: string
    name?: string
}

const mapEncounterStatus = (status: string): PatientStatus => {
    switch (status) {
        case 'arrived': return PatientStatus.WAITING
        case 'triaged': return PatientStatus.WAITING
        case 'in-progress': return PatientStatus.EXAMINING
        case 'finished': return PatientStatus.COMPLETED
        case 'cancelled': return PatientStatus.CANCELLED
        default: return PatientStatus.WAITING
    }
}

export const getPatientMedicalRecord = async (
    encounterId: string
): Promise<PatientWithMedicalRecord | null> => {
    try {
        const encounterRes = await window.api.query.encounter.read({ id: encounterId })

        if (!encounterRes.success || !encounterRes.result) {
            console.error('Encounter not found or error:', encounterRes.error)
            return null
        }

        const encounter = encounterRes.result
        const patient = encounter.patient as unknown as BackendEncounterPatient

        if (!patient) {
            console.error('Encounter has no patient data')
            return null
        }

        const obsRes = await window.api.query.observation.getByEncounter({ encounterId })
        const observations = obsRes.success && obsRes.result?.grouped ? obsRes.result.grouped : null

        const condRes = await window.api.query.condition?.getByEncounter({ encounterId })

        const conditions = condRes?.success && Array.isArray(condRes.result) ? condRes.result : []

        let nurseRecord: PatientWithMedicalRecord['nurseRecord'] | undefined

        if (observations || conditions.length > 0) {
            const getStringVal = (arr: any[], codes: string | string[]): string => {
                const codeList = Array.isArray(codes) ? codes : [codes]
                const obs = arr?.find(o => {
                    const code = o?.codeCoding?.[0]?.code
                    return code && codeList.includes(code)
                })
                return obs?.valueString || ''
            }

            const getNumberVal = (arr: any[], codes: string | string[]): number => {
                const codeList = Array.isArray(codes) ? codes : [codes]
                const obs = arr?.find(o => {
                    const code = o?.codeCoding?.[0]?.code
                    return code && codeList.includes(code)
                })
                if (obs?.valueQuantity?.value !== undefined) return obs.valueQuantity.value
                if (obs?.valueInteger !== undefined) return obs.valueInteger
                if (obs?.valueString) return parseFloat(obs.valueString) || 0
                return 0
            }

            const getCondVal = (arr: any[], cats: string[]): string => {
                const cond = arr.find(c => {
                    if (c.category && cats.includes(c.category)) return true
                    if (Array.isArray(c.categories)) {
                        return c.categories.some((cat: any) => {
                            if (Array.isArray(cat.coding)) {
                                return cat.coding.some((coding: any) => coding.code && cats.includes(coding.code))
                            }
                            if (cat.code && cats.includes(cat.code)) return true

                            return false
                        })
                    }
                    return false
                })

                return cond?.note || cond?.notes || ''
            }

            const vitalSigns = {
                systolicBloodPressure: getNumberVal(observations?.vitalSigns || [], ['systolic-blood-pressure', '8480-6']),
                diastolicBloodPressure: getNumberVal(observations?.vitalSigns || [], ['diastolic-blood-pressure', '8462-4']),
                heartRate: getNumberVal(observations?.vitalSigns || [], ['heart-rate', '8867-4']),
                pulseRate: getNumberVal(observations?.vitalSigns || [], ['pulse-rate', 'heart-rate', '8867-4']),
                respiratoryRate: getNumberVal(observations?.vitalSigns || [], ['respiratory-rate', '9279-1']),
                temperature: getNumberVal(observations?.vitalSigns || [], ['body-temperature', '8310-5']),
                oxygenSaturation: getNumberVal(observations?.vitalSigns || [], ['oxygen-saturation', '2708-6', '59408-5']),
                height: getNumberVal(observations?.vitalSigns || [], ['body-height', '8302-2']),
                weight: getNumberVal(observations?.vitalSigns || [], ['body-weight', '29463-7']),
                bmi: getNumberVal(observations?.vitalSigns || [], ['bmi', 'body-mass-index', '39156-5']),
                consciousness: getStringVal(observations?.vitalSigns || [], ['consciousness'])
            }

            const anamnesis = {
                chiefComplaint:
                    getCondVal(conditions, ['chief-complaint']) ||
                    getStringVal(observations?.anamnesis || [], ['chief-complaint']),
                mainComplaint:
                    getCondVal(conditions, ['chief-complaint']) ||
                    getStringVal(observations?.anamnesis || [], ['chief-complaint']),
                historyOfPresentIllness:
                    getCondVal(conditions, ['history-of-present-illness']) ||
                    getStringVal(observations?.anamnesis || [], ['history-present-illness', 'history-of-present-illness']),
                historyOfPastIllness:
                    getCondVal(conditions, ['history-past-illness', 'history-of-past-illness']) ||
                    getStringVal(observations?.anamnesis || [], ['history-past-illness', 'history-of-past-illness']),
                allergyHistory:
                    getCondVal(conditions, ['allergy-history']) ||
                    getStringVal(observations?.anamnesis || [], ['allergy-history']),
                allergies:
                    getCondVal(conditions, ['allergy-history']) ||
                    getStringVal(observations?.anamnesis || [], ['allergy-history']),
                associatedSymptoms:
                    getCondVal(conditions, ['associated-symptoms']) ||
                    getStringVal(observations?.anamnesis || [], ['associated-symptoms']),
                familyHistory:
                    getCondVal(conditions, ['family-history']) ||
                    getStringVal(observations?.anamnesis || [], ['family-history']),
                medicationHistory:
                    getCondVal(conditions, ['medication-history']) ||
                    getStringVal(observations?.anamnesis || [], ['medication-history'])
            }

            const physicalExamination = {
                consciousness: getStringVal(observations?.physicalExam || [], ['consciousness']),
                generalCondition: getStringVal(observations?.physicalExam || [], ['general-condition']),
                additionalNotes: getStringVal(observations?.physicalExam || [], ['additional-notes', 'physical-notes'])
            }

            nurseRecord = {
                vitalSigns,
                anamnesis,
                physicalExamination,
                examinationDate: encounter.period?.start ? String(encounter.period.start) : new Date().toISOString(),
                nurseName: 'Perawat Jaga' // TODO: Get from creator ID
            }
        }

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
                gender: patient.gender?.toLowerCase() === 'female' ? Gender.FEMALE : Gender.MALE,
                birthDate: patient.birthDate ? String(patient.birthDate) : '',
                phone: patient.phone || '',
                address: patient.address || '',
                identityNumber: patient.nik || '',
                age: age,
            },
            status: mapEncounterStatus(encounter.status),
            paymentMethod: 'Umum',
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

export const searchDiagnosisCodes = async (query: string): Promise<DiagnosisCode[]> => {
    try {
        if (!query || query.length < 2) {
            return []
        }

        const response = await window.api.query.diagnosisCode?.list({
            search: query
        })

        if (response?.success && Array.isArray(response.result)) {
            return (response.result as BackendConcept[]).map((item) => ({
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

export const getAllDiagnosisCodes = async (): Promise<DiagnosisCode[]> => {
    return searchDiagnosisCodes('a')
}

export const getMedicalProcedures = async (): Promise<MedicalProcedure[]> => {
    return searchMedicalProcedures('a')
}

export const searchMedicalProcedures = async (query: string): Promise<MedicalProcedure[]> => {
    try {
        if (!query || query.length < 2) {
            return []
        }

        const response = await window.api.query.masterProcedure?.list({
            search: query
        })

        if (response?.success && Array.isArray(response.result)) {
            return (response.result as BackendConcept[]).map((item) => ({
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

export const saveDiagnosisAndProcedures = async (
    request: SaveDiagnosisAndProceduresRequest & { assessmentDate?: string; doctorId?: number }
): Promise<SaveDiagnosisAndProceduresResponse> => {
    try {
        const { encounterId, patientId, diagnoses, procedures, assessmentDate, doctorId: requestDoctorId } = request

        if (!patientId) {
            throw new Error('Patient ID is required')
        }

        const doctorId = requestDoctorId || 1
        const effectiveDate = assessmentDate || new Date().toISOString()

        if (diagnoses.length > 0) {
            const conditionsPayload = diagnoses.map((d) => ({
                diagnosisCodeId: parseInt(d.diagnosisCode.id),
                isPrimary: d.isPrimary,
                category: d.diagnosisCode.category,
                notes: d.notes,
                recordedDate: effectiveDate
            }))

            const conditionRes = await window.api.query.condition.create({
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

        if (procedures.length > 0) {
            const proceduresPayload = procedures.map((p) => ({
                procedureCodeId: parseInt(p.procedure.id),
                notes: p.notes,
                performedAt: effectiveDate
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

        const notesToSave: { type: string; text: string }[] = []
        if (request.clinicalNotes) {
            notesToSave.push({
                type: 'progress',
                text: request.clinicalNotes
            })
        }
        if (request.referralNotes) {
            notesToSave.push({
                type: 'discharge',
                text: request.referralNotes
            })
        }

        if (notesToSave.length > 0) {
            const noteRes = await window.api.query.clinicalNote.create({
                encounterId,
                doctorId,
                notes: notesToSave
            })

            if (!noteRes.success) {
                const errorMsg = noteRes.message || (noteRes as any).error || 'Failed to save clinical/referral notes'
                console.error('Error saving clinical notes:', errorMsg)
                throw new Error(errorMsg)
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

export const getMedicines = async (category?: MedicineCategory): Promise<Medicine[]> => {
    try {
        const response = await window.api.query.medicine?.list({})

        if (response?.success && Array.isArray(response.result)) {
            let medicines = (response.result as BackendMedicine[]).map((m) => ({
                id: String(m.id),
                code: m.code || `MED-${m.id}`,
                name: m.name,
                category: MedicineCategory.OTHER, // TODO: Map from m.medicineCategoryId
                dosageForm: DosageForm.TABLET, // TODO: Map form
                unit: 'pcs',
                stock: 100,
                price: typeof m.sellingPrice === 'string' ? parseFloat(m.sellingPrice) : (m.sellingPrice || 0),
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

export const getSupplies = async (category?: SupplyCategory): Promise<Supply[]> => {
    await simulateDelay(300)

    if (!category) {
        return dummySupplies
    }

    return dummySupplies.filter((sup) => sup.category === category)
}

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

export const getCompoundFormulations = async (): Promise<CompoundFormulation[]> => {
    await simulateDelay(200)
    return dummyCompoundFormulations
}

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

export const getPrescriptionByEncounter = async (encounterId: string): Promise<Prescription | null> => {
    await simulateDelay(200)
    const prescription = dummyPrescriptions.find((p) => p.encounterId === encounterId)
    return prescription || null
}

export const getDoctorRecordByEncounter = async (
    encounterId: string
): Promise<DoctorEncounterRecord | null> => {
    await simulateDelay(200)
    const record = dummyDoctorRecords.find((r) => r.encounterId === encounterId)
    return record || null
}
