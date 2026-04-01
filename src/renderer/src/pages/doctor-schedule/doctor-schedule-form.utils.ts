import type {
  DoctorOption,
  DoctorScheduleFormSection,
  SelectOption
} from './doctor-schedule-form.types'
import {
  DOCTOR_SCHEDULE_DEFAULT_SECTION,
  DOCTOR_SCHEDULE_SECTION_OPTIONS,
  TIME_PATTERN
} from './doctor-schedule-form.constants'

export const normalizeTime = (value?: string | null) => {
  if (!value) return ''
  return value.length >= 5 ? value.slice(0, 5) : value
}

export const normalizeList = <T,>(data: unknown): T[] => {
  const raw = data as any
  return (raw?.result || raw?.data || raw || []) as T[]
}

export const normalizeItem = <T,>(data: unknown): T | null => {
  const raw = data as any
  const item = raw?.result ?? raw?.data ?? raw
  if (!item || Array.isArray(item)) return null
  return item as T
}

export const normalizeNumericId = (value: unknown): number | null => {
  const normalizedValue = Number(value)
  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    return null
  }

  return normalizedValue
}

export const mergeOptions = (...optionSets: Array<SelectOption[] | undefined>): SelectOption[] => {
  const seen = new Set<number>()
  const merged: SelectOption[] = []

  for (const options of optionSets) {
    for (const option of options ?? []) {
      if (seen.has(option.value)) continue
      seen.add(option.value)
      merged.push(option)
    }
  }

  return merged
}

export const isDoctorPegawai = (pegawai: DoctorOption): boolean => {
  const hakAkses =
    pegawai.hakAkses && typeof pegawai.hakAkses === 'object' ? pegawai.hakAkses : undefined

  const searchTokens = [
    typeof pegawai.hakAkses === 'string' ? pegawai.hakAkses : '',
    typeof pegawai.hakAksesId === 'string' ? pegawai.hakAksesId : '',
    String(hakAkses?.kode ?? ''),
    String(hakAkses?.nama ?? '')
  ]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  if (searchTokens.length === 0) return true

  return searchTokens.some((value) => value.includes('doctor') || value.includes('dokter'))
}

export const extractErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export const ensureTimeRange = (startTime: string, endTime: string, context: string) => {
  if (!TIME_PATTERN.test(startTime)) {
    throw new Error(`Format jam mulai ${context} harus HH:mm`)
  }
  if (!TIME_PATTERN.test(endTime)) {
    throw new Error(`Format jam selesai ${context} harus HH:mm`)
  }
  if (endTime <= startTime) {
    throw new Error(`Jam selesai ${context} harus lebih besar dari jam mulai`)
  }
}

export const ensureSuccess = (response: any, fallbackMessage: string) => {
  if (!response || response.success === false) {
    throw new Error(response?.message || response?.error || fallbackMessage)
  }
  return response
}

export const normalizeDoctorScheduleSection = (
  value?: string | null
): DoctorScheduleFormSection => {
  const allowedSections = new Set<DoctorScheduleFormSection>(
    DOCTOR_SCHEDULE_SECTION_OPTIONS.map((section) => section.value)
  )

  if (value && allowedSections.has(value as DoctorScheduleFormSection)) {
    return value as DoctorScheduleFormSection
  }

  return DOCTOR_SCHEDULE_DEFAULT_SECTION
}

export const buildDoctorScheduleEditorPath = (
  scheduleId: number | string,
  section: DoctorScheduleFormSection = DOCTOR_SCHEDULE_DEFAULT_SECTION
) => `/dashboard/registration/doctor-schedule/${scheduleId}/${section === 'quota' ? 'quotas' : section}`

export const normalizeDoctorScheduleRouteSection = (
  value?: string | null
): DoctorScheduleFormSection => {
  if (value === 'quotas') return 'quota'
  return normalizeDoctorScheduleSection(value)
}
