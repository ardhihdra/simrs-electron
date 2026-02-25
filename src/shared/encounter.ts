export enum EncounterStatus {
  PLANNED = "PLANNED",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
}

export interface Coding {
  system?: string
  version?: string
  code?: string
  display?: string
  userSelected?: boolean
}

export interface CodeableConcept {
  coding?: Coding[]
  text?: string
}

export interface Period {
  start?: string
  end?: string
}

export interface Reference {
  reference?: string
  type?: string
  display?: string
}

export enum EncounterType {
  AMB = "AMB",
  EMER = "EMER",
  IMP = "IMP",
  LAB = "LAB",
}

export enum ArrivalType {
  WALK_IN = "WALK_IN",
  REFERRAL = "REFERRAL",
  TRANSFER = "TRANSFER",
}

export interface EncounterAttributes {
  id?: string

  // Backend Core Fields
  episodeOfCareId?: string
  patientId: string
  encounterType: EncounterType
  arrivalType: ArrivalType
  status: EncounterStatus
  serviceUnitId?: string
  serviceUnitCodeId?: string
  queueTicketId?: string | null

  // Legacy/Frontend Compatibility
  visitDate: Date | string
  serviceType: string // often mapped to serviceUnit if string

  startTime?: Date | string
  endTime?: Date | string | null
  partOfId?: string | null
  dischargeDisposition?: string | null
  reason?: string | null
  note?: string | null

  resourceType?: 'Encounter'
  class?: Coding
  classHistory?: { class: Coding; period?: Period }[]
  period?: Period
  serviceTypeCode?: CodeableConcept
  subject?: Reference
  participant?: Array<{ type?: CodeableConcept[]; period?: Period; individual?: Reference }>
  reasonCode?: CodeableConcept[]
  reasonReference?: Reference[]
  hospitalization?: Record<string, unknown>
  location?: Array<{ location: Reference; status?: 'planned' | 'active' | 'reserved' | 'completed'; physicalType?: CodeableConcept; period?: Period }>
  encounterCode?: string | null

  createdBy?: number | null
  updatedBy?: number | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
  deletedBy?: number | null
}


export type EncounterListResult = {
  success: boolean
  data?: EncounterRow[]
  error?: string
}
export type EncounterRow = Omit<EncounterAttributes, 'visitDate' | 'status'> & {
  visitDate: string | Date
  status: string
  patient?: { name?: string }
}

export type EncounterTableRow = EncounterRow & { no: number }