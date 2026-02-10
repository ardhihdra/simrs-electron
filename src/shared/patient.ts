export enum Gender {
  Male = 'male',
  Female = 'female'
}

export enum MaritalStatus {
  Single = 'single',
  Married = 'married',
  Divorced = 'divorced'
}

export interface RelatedPerson {
  name: string
  phone: string
  email?: string
  relationship: string
}

export interface PatientAttributes {
  id: string
  medicalRecordNumber: string
  nik: string
  name: string
  gender: string // Schema says enum, but string is safer for interface unless enum is shared
  birthDate: string | Date
  maritalStatus: string
  phone: string
  email: string
  address: string
  city: string
  province: string
  postalCode: string
  country: string
  relatedPerson: RelatedPerson[]
  insuranceProvider?: string | null
  insuranceNumber?: string | null
  active?: boolean
  fhirId?: string | null
  fhirServer?: string | null
  fhirVersion?: string | null
  lastFhirUpdated?: Date | null
  lastSyncedAt?: Date | null
  // Deprecated/Removed fields but keeping optional just in case? No, clean break is better for "alignment".
}
