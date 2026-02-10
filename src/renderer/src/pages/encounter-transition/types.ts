/**
 * Types for Encounter Transition
 */

export interface Helper {
  id: string
  name: string
}

export interface QueueTicket {
  id: string
  queueNumber: string
}

export interface Patient {
  id: string
  name: string
  medicalRecordNumber: string
  gender: string
  birthDate: string
}

export interface Room {
  id: string
  roomCodeId: string
  roomClassCodeId: string
}

export interface Bed {
  id: string
  bedCodeId: string
}

export interface Encounter {
  id: string
  encounterType: string
  status: string
  startTime: string | null
  endTime: string | null
  patientId: string
  patient: Patient
  queueTicketId: string | null
  queueTicket: QueueTicket | null
  helper: Helper | null
  room?: Room
  bed?: Bed
}

export const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'blue',
  IN_PROGRESS: 'green',
  FINISHED: 'gray',
  DISCHARGED: 'purple',
  CANCELLED: 'red'
}

export const ENCOUNTER_TYPE_LABELS: Record<string, string> = {
  AMBULATORY: 'Rawat Jalan',
  INPATIENT: 'Rawat Inap',
  EMERGENCY: 'IGD',
  LAB: 'Laboratorium'
}

export const DISCHARGE_OPTIONS = [
  { label: 'Sembuh (Cured)', value: 'CURED' },
  { label: 'Rujuk (Referred)', value: 'REFERRED' },
  { label: 'Pulang Paksa (Against Advice)', value: 'AGAINST_ADVICE' },
  { label: 'Meninggal (Deceased)', value: 'DECEASED' }
]
