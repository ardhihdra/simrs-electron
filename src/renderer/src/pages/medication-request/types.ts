import {
  MedicationRequestStatus,
  MedicationRequestIntent,
  MedicationRequestPriority
} from 'simrs-types'

export interface FormData {
  status: MedicationRequestStatus
  intent: MedicationRequestIntent
  priority?: MedicationRequestPriority
  patientId: string
  encounterId?: string | null
  requesterId?: number | null
  roomId?: string | null
  authoredOn?: any
  resepturId?: number | null
  // Single mode (Edit)
  medicationId?: number | null
  dosageInstruction?: string | null
  note?: string | null
  // Bulk mode (Create)
  items?: Array<{
    medicationId: number
    dosageInstruction?: string
    note?: string
    quantity?: number
    quantityUnit?: string
  }>
  // Compounds mode (Racikan)
  compounds?: Array<{
    name: string
    dosageInstruction?: string
    quantity?: number
    quantityUnit?: string
    items: Array<{
      sourceType?: 'medicine' | 'substance'
      medicationId?: number
      itemId?: number
      rawMaterialId?: number
      note?: string
      quantity?: number
      unit?: string
    }>
  }>
  otherItems?: Array<{
    itemCategoryId?: number | null
    itemId: number
    quantity?: number
    instruction?: string
    note?: string
  }>
  manualPatientName?: string
  manualMedicalRecordNumber?: string
}

export interface ItemOption {
  value: number
  label: string
  unitCode: string
  categoryType: string
  itemCategoryCode?: string | null
  itemGroupCode?: string | null
  itemCategoryName?: string | null
  itemGroupName?: string | null
  fpktl?: boolean | null
  prb?: boolean | null
  oen?: boolean | null
  sediaanId?: number | null
  peresepanMaksimal?: number | null
  restriksi?: string | null
  kekuatan?: string | number | null
  satuanId?: number | null
}

export type EncounterOptionSource = {
  id: string
  encounterCode?: string
  patient?: { id?: string | number; name?: string }
  visitDate?: string
  period?: { start?: string; end?: string }
  startTime?: string
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}

export type EncounterListPayload =
  | { result?: EncounterOptionSource[]; data?: EncounterOptionSource[] }
  | undefined
