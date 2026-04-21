export type PatientLookupSearchParams = {
  name: string
  medicalRecordNumber: string
  address: string
  nik: string
  birthDate: string
  age: number | null
}

export const INITIAL_PATIENT_LOOKUP_SEARCH_PARAMS: PatientLookupSearchParams = {
  name: '',
  medicalRecordNumber: '',
  address: '',
  nik: '',
  birthDate: '',
  age: null
}

export function createPatientLookupQueryInput(searchParams: PatientLookupSearchParams) {
  const normalizeText = (value: string) => {
    const normalized = value.trim()
    return normalized.length > 0 ? normalized : undefined
  }

  const normalizedAge =
    typeof searchParams.age === 'number' &&
    Number.isInteger(searchParams.age) &&
    searchParams.age >= 0
      ? searchParams.age
      : undefined

  return {
    name: normalizeText(searchParams.name),
    medicalRecordNumber: normalizeText(searchParams.medicalRecordNumber),
    address: normalizeText(searchParams.address),
    nik: normalizeText(searchParams.nik),
    birthDate: normalizeText(searchParams.birthDate),
    age: normalizedAge
  }
}
