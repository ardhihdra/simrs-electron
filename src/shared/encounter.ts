export enum EncounterStatus {
  Planned = 'planned',
  Arrived = 'arrived',
  Triaged = 'triaged',
  InProgress = 'in-progress',
  OnHold = 'onhold',
  Finished = 'finished',
  Cancelled = 'cancelled',
  EnteredInError = 'entered-in-error',
  Unknown = 'unknown'
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

export interface EncounterAttributes {
  id?: number
  patientId: number
  visitDate: Date
  serviceType: string
  reason?: string | null
  note?: string | null
  status: EncounterStatus
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
  createdBy?: number | null
  updatedBy?: number | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
  deletedBy?: number | null
}
