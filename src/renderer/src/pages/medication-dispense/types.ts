export type PatientNameEntry = {
    text?: string
    given?: string[]
    family?: string
}

export type PatientIdentifier = {
    system?: string
    value?: string
}

export interface PatientInfo {
    name?: string | PatientNameEntry[]
    identifier?: PatientIdentifier[]
    mrNo?: string
}

export interface QuantityInfo {
    value?: number
    unit?: string
}

export interface DosageInstructionEntry {
    text?: string
}

export interface MedicationInfo {
    name?: string
    stock?: number
    uom?: string
}

export interface PerformerInfo {
    name?: string
}

export interface CategoryEntryInfo {
    text?: string
    code?: string
}

export interface AuthorizingPrescriptionInfo {
    id?: number
    recorderId?: number | null
    patientId?: string
    patient?: PatientInfo
    note?: string | null
    category?: CategoryEntryInfo[] | null
    medication?: MedicationInfo
    item?: {
        nama?: string
        itemCategoryId?: number | null
    } | null
    dosageInstruction?: DosageInstructionEntry[] | null
    supportingInformation?: any[] | null
    groupIdentifier?: {
        system?: string
        value?: string
    } | null
    requester?: { name?: string }
}

export interface MedicationDispenseAttributes {
    id?: number
    status: string
    medicationId?: number | null
    itemId?: number | null
    patientId: string
    authorizingPrescriptionId?: number | null
    whenHandedOver?: string
    quantity?: QuantityInfo | null
    patient?: PatientInfo
    medication?: MedicationInfo
    performer?: PerformerInfo
    dosageInstruction?: DosageInstructionEntry[] | null
    authorizingPrescription?: AuthorizingPrescriptionInfo | null
    paymentStatus?: string
    encounter?: { encounterType?: string }
    identifier?: Array<{ system: string; value: string }> | null
    fhirId?: string | null
    servicedAt?: string | null
    note?: any[] | null
    telaah?: any | null
}

export interface MedicationDispenseListArgs {
    patientId?: string
    page?: number
    limit?: number
}

export interface MedicationDispenseListResult {
    success: boolean
    data?: MedicationDispenseAttributes[]
    pagination?: {
        page: number
        limit: number
        total: number
        pages: number
    }
    error?: string
}

export interface MedicationRequestQuantityInfo {
    value?: number
    unit?: string
}

export interface MedicationRequestDispenseRequestInfo {
    quantity?: MedicationRequestQuantityInfo
}

export interface MedicationRequestDetailForSummary {
    id?: number
    medication?: MedicationInfo
    dispenseRequest?: MedicationRequestDispenseRequestInfo | null
}

export interface MedicationRequestDetailResult {
    success: boolean
    data?: MedicationRequestDetailForSummary
    error?: string
}

export interface ItemAttributes {
    id?: number
    nama?: string
    kode?: string
    itemCategoryId?: number | null
    category?: {
        id?: number
        name?: string | null
    } | null
}

export interface ItemListResponse {
    success: boolean
    result?: ItemAttributes[]
    message?: string
}

export interface DispenseItemRow {
    key: string
    id?: number
    jenis: string
    medicineName?: string
    quantity?: number
    unit?: string
    status: string
    performerName?: string
    instruksi?: string
    availableStock?: number
    fhirId?: string
    batch?: string
    expiryDate?: string
    paymentStatus?: string
    kekuatan?: string | number
    caraPenyimpanan?: string
    note?: any[] | null
    telaah?: any | null
    children?: DispenseItemRow[]
}

export interface ParentRow {
    key: string
    patient?: PatientInfo
    status: string
    paymentStatus?: string
    handedOverAt?: string
    encounterType?: string
    dokterName?: string
    resepturName?: string
    servicedAt?: string | null
    rawHandedOverAt?: string | null
    items: DispenseItemRow[]
}

export type StatusFilter = 'all' | 'completed' | 'return'

export interface RowActionsProps {
    record: DispenseItemRow
    patient?: PatientInfo
    employees: Array<{ id: number; namaLengkap: string }>
    employeeNameById: Map<number, string>
    parentServicedAt?: string | null
}
