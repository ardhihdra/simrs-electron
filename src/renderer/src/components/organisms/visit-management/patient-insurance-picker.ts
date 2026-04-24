import dayjs from 'dayjs'

export type PatientInsuranceRecord = {
  id: number
  patientId?: string
  mitraId?: number | null
  mitraCodeNumber?: string | null
  mitraCodeExpiredDate?: string | Date | null
  isActive?: boolean
}

type PatientInsuranceResponseShape =
  | {
      success?: boolean
      data?: unknown
      result?: unknown
    }
  | null
  | undefined

const toOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export const normalizePatientInsuranceRows = (
  response: PatientInsuranceResponseShape
): PatientInsuranceRecord[] => {
  const directData = Array.isArray(response?.data) ? response?.data : undefined
  const nestedData =
    response?.data && !Array.isArray(response.data)
      ? (response.data as { data?: unknown; result?: unknown })
      : undefined

  const maybeRows = directData ?? nestedData?.data ?? nestedData?.result ?? response?.result ?? []

  if (!Array.isArray(maybeRows)) {
    return []
  }

  return maybeRows
    .map((row) => {
      if (!row || typeof row !== 'object') {
        return null
      }

      const item = row as Record<string, unknown>
      const mitraCodeNumber = typeof item.mitraCodeNumber === 'string' ? item.mitraCodeNumber : null
      const insuranceRow: PatientInsuranceRecord = {
        id: Number(item.id),
        patientId: typeof item.patientId === 'string' ? item.patientId : undefined,
        mitraId: toOptionalNumber(item.mitraId) ?? null,
        mitraCodeNumber,
        mitraCodeExpiredDate:
          typeof item.mitraCodeExpiredDate === 'string' || item.mitraCodeExpiredDate instanceof Date
            ? item.mitraCodeExpiredDate
            : null,
        isActive: typeof item.isActive === 'boolean' ? item.isActive : undefined
      }

      return insuranceRow
    })
    .filter((item): item is PatientInsuranceRecord => item !== null && Number.isFinite(item.id))
}

export const filterPatientInsuranceRows = (
  rows: PatientInsuranceRecord[],
  allowedMitraIds: number[],
  selectedMitraId?: number
) => {
  if (selectedMitraId) {
    return rows.filter((row) => Number(row.mitraId) === Number(selectedMitraId))
  }

  if (allowedMitraIds.length === 0) {
    return rows
  }

  const allowedSet = new Set(allowedMitraIds.map((value) => Number(value)))
  return rows.filter((row) => row.mitraId != null && allowedSet.has(Number(row.mitraId)))
}

export const buildPatientInsuranceLabel = (
  row: PatientInsuranceRecord,
  mitraNameMap: Record<number, string>
) => {
  const mitraName =
    row.mitraId != null
      ? mitraNameMap[Number(row.mitraId)] || `Mitra ${row.mitraId}`
      : 'Tanpa mitra'
  const numberLabel = row.mitraCodeNumber?.trim() || 'Nomor belum diisi'
  const expiryLabel = row.mitraCodeExpiredDate
    ? dayjs(row.mitraCodeExpiredDate).isValid()
      ? dayjs(row.mitraCodeExpiredDate).format('DD MMM YYYY')
      : 'Expired tidak valid'
    : 'Tanpa expired'

  return `${mitraName} - Nomor: ${numberLabel} - Exp: ${expiryLabel}`
}
