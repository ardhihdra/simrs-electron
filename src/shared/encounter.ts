import type { EncounterAttributes } from "simrs-types"

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