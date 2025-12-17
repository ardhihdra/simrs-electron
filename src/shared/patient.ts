export enum Gender {
  Male = 'male',
  Female = 'female'
}



export enum MaritalStatus {
  Single = 'single',
  Married = 'married',
  Divorced = 'divorced',
}



export interface PatientAttributes {
  id?: number
  active?: boolean
  identifier?: string | null
  kode: string
  name: string
  gender: Gender
  birthDate: Date
  placeOfBirth?: string | null
  phone?: string | null
  email?: string | null
  addressLine?: string | null
  province?: string | null
  city?: string | null
  district?: string | null
  village?: string | null
  postalCode?: string | null
  country?: string | null
  maritalStatus?: MaritalStatus | null
  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

