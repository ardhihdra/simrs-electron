import {
  MedicationRequestStatus,
  MedicationRequestIntent,
  MedicationRequestPriority
} from '@main/models/enums/ResourceEnums'

export interface MedicationRequestAttributes {
  id: number
  status: MedicationRequestStatus
  intent: MedicationRequestIntent
  priority?: MedicationRequestPriority
  medicationId?: number | null
  patientId: string
  encounterId?: string | null
  requesterId?: number | null
  authoredOn?: string | Date
  dosageInstruction?: any | null
  note?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null
  patient?: any
  requester?: any
  encounter?: any
  medication?: any
}
