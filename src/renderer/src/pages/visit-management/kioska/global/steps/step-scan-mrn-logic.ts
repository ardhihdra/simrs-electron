import type { KioskaPatient } from '../../public-client'

function normalizeMedicalRecordNumber(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export function hasMatchedPatientForMrn(
  mrn: string,
  matchedPatient: Pick<KioskaPatient, 'medicalRecordNumber'> | null
) {
  const normalizedMrn = normalizeMedicalRecordNumber(mrn)

  if (!normalizedMrn) return false

  return normalizeMedicalRecordNumber(matchedPatient?.medicalRecordNumber || '') === normalizedMrn
}

export function getScanMrnSubmitDecision(input: {
  mrn: string
  matchedPatient: Pick<KioskaPatient, 'medicalRecordNumber'> | null
  isResolvingPatient: boolean
}) {
  const normalizedMrn = normalizeMedicalRecordNumber(input.mrn)

  if (!normalizedMrn) return 'error_empty' as const
  if (input.isResolvingPatient) return 'wait' as const
  if (hasMatchedPatientForMrn(input.mrn, input.matchedPatient)) return 'advance' as const

  return 'error_not_found' as const
}
