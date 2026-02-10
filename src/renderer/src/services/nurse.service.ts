import {
    PatientQueue,
    PatientStatus,
    CallPatientRequest,
    CallPatientResponse,
    SubmitMedicalRecordRequest,
    SubmitMedicalRecordResponse,
    MedicalRecord
} from '../types/nurse.types'
import { dummyPatientQueue, dummyPolis, dummyMedicalRecords } from './dummy-data'

// Simulated API delay
const simulateDelay = (ms: number = 500): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get patient queue list
 * @param poliId - Optional filter by poli ID
 */
export const getPatientQueue = async (poliId?: string): Promise<PatientQueue[]> => {
    await simulateDelay(300)

    let queue = [...dummyPatientQueue]

    // Filter by poli if provided
    if (poliId) {
        queue = queue.filter((q) => q.poli.id === poliId)
    }

    // Sort by queue number
    queue.sort((a, b) => a.queueNumber - b.queueNumber)

    return queue
}

/**
 * Get all available polis
 */
export const getPolis = async () => {
    await simulateDelay(200)
    return dummyPolis
}

/**
 * Call a patient (update status to CALLED)
 * @param request - Call patient request containing queueId and encounterId
 */
export const callPatient = async (
    request: CallPatientRequest
): Promise<CallPatientResponse> => {
    await simulateDelay(500)

    const queueItem = dummyPatientQueue.find((q) => q.id === request.queueId)

    if (!queueItem) {
        return {
            success: false,
            message: 'Pasien tidak ditemukan dalam antrian'
        }
    }

    // Update status to CALLED
    queueItem.status = PatientStatus.CALLED
    queueItem.calledAt = new Date().toISOString()

    return {
        success: true,
        message: 'Pasien berhasil dipanggil',
        encounter: {
            id: queueItem.encounterId!,
            patient: queueItem.patient,
            queueNumber: queueItem.queueNumber
        }
    }
}

/**
 * Update patient status
 * @param queueId - Queue ID
 * @param status - New status
 */
export const updatePatientStatus = async (
    queueId: string,
    status: PatientStatus
): Promise<{ success: boolean; message: string }> => {
    await simulateDelay(300)

    const queueItem = dummyPatientQueue.find((q) => q.id === queueId)

    if (!queueItem) {
        return {
            success: false,
            message: 'Pasien tidak ditemukan'
        }
    }

    queueItem.status = status

    switch (status) {
        case PatientStatus.EXAMINING:
            queueItem.examinedAt = new Date().toISOString()
            break
        case PatientStatus.COMPLETED:
            queueItem.completedAt = new Date().toISOString()
            break
    }

    return {
        success: true,
        message: 'Status pasien berhasil diperbarui'
    }
}

/**
 * Get patient queue by ID
 */
export const getPatientQueueById = async (queueId: string): Promise<PatientQueue | null> => {
    await simulateDelay(200)
    const queue = dummyPatientQueue.find((q) => q.id === queueId)
    return queue || null
}

/**
 * Get patient queue by encounter ID
 */
export const getPatientQueueByEncounterId = async (
    encounterId: string
): Promise<PatientQueue | null> => {
    await simulateDelay(200)
    const queue = dummyPatientQueue.find((q) => q.encounterId === encounterId)
    return queue || null
}

/**
 * Submit medical record (vital signs, anamnesis, physical examination)
 * @param request - Medical record data
 */
export const submitMedicalRecord = async (
    request: SubmitMedicalRecordRequest
): Promise<SubmitMedicalRecordResponse> => {
    await simulateDelay(700)

    try {
        // Generate record ID
        const recordId = `rec-${Date.now()}`

        // Add ID to the record
        const recordWithId: MedicalRecord = {
            ...request.medicalRecord,
            id: recordId
        }

        // Store in dummy storage
        dummyMedicalRecords.push(recordWithId)

        // Update queue status to EXAMINING
        const queueItem = dummyPatientQueue.find(
            (q) => q.encounterId === request.medicalRecord.encounterId
        )
        if (queueItem) {
            queueItem.status = PatientStatus.EXAMINING
            queueItem.examinedAt = new Date().toISOString()
        }

        console.log('Medical record saved:', recordWithId)
        console.log('Total records:', dummyMedicalRecords.length)

        return {
            success: true,
            message: 'Rekam medis berhasil disimpan',
            recordId
        }
    } catch (error) {
        console.error('Error submitting medical record:', error)
        return {
            success: false,
            message: 'Gagal menyimpan rekam medis'
        }
    }
}

/**
 * Get medical record by encounter ID
 */
export const getMedicalRecordByEncounterId = async (
    encounterId: string
): Promise<MedicalRecord | null> => {
    await simulateDelay(200)
    const record = dummyMedicalRecords.find((r) => r.encounterId === encounterId)
    return record || null
}
