import dayjs from 'dayjs'
import type {
  DoctorScheduleFormSection,
  DoctorScheduleExceptionFormValue,
  DoctorScheduleExceptionMode,
  DoctorScheduleExceptionSessionFormValue,
  DoctorScheduleExceptionType,
  DoctorScheduleSessionFormValue,
  RegistrationQuotaPaymentMethod,
  RegistrationQuotaSource
} from './doctor-schedule-form.types'

export const DAY_OPTIONS = [
  { value: 0, label: 'Minggu' },
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' }
]

export const DOCTOR_SCHEDULE_DEFAULT_SECTION: DoctorScheduleFormSection = 'info'

export const DOCTOR_SCHEDULE_EDITOR_SECTIONS: DoctorScheduleFormSection[] = [
  'info',
  'sessions',
  'quota',
  'exceptions'
]

export const DOCTOR_SCHEDULE_SECTION_OPTIONS: Array<{
  value: DoctorScheduleFormSection
  label: string
  description: string
  shortLabel: string
}> = [
  {
    value: 'info',
    label: 'Informasi Jadwal',
    shortLabel: 'Info',
    description: 'Kelola data dokter, poli, kontrak, periode berlaku, dan status jadwal.'
  },
  {
    value: 'quota',
    label: 'Quota Registrasi',
    shortLabel: 'Quota',
    description: 'Atur quota harian per online/offline dan metode pembayaran.'
  },
  {
    value: 'sessions',
    label: 'Sesi Praktik',
    shortLabel: 'Sesi',
    description: 'Susun sesi praktik reguler mingguan beserta jam dan quota dasarnya.'
  },
  {
    value: 'exceptions',
    label: 'Libur & Exception',
    shortLabel: 'Libur',
    description: 'Atur libur, cuti, sakit, izin, atau override sesi pada tanggal tertentu.'
  }
]

export const EXCEPTION_TYPE_OPTIONS: Array<{ value: DoctorScheduleExceptionType; label: string }> =
  [
    { value: 'libur', label: 'Libur' },
    { value: 'sakit', label: 'Sakit' },
    { value: 'izin', label: 'Izin' },
    { value: 'cuti', label: 'Cuti' },
    { value: 'ubah_jam', label: 'Ubah Jam' }
  ]

export const EXCEPTION_MODE_OPTIONS: Array<{ value: DoctorScheduleExceptionMode; label: string }> =
  [
    { value: 'full_day', label: 'Full Day' },
    { value: 'partial_session', label: 'Partial Session' }
  ]

export const REGISTRATION_QUOTA_FIELDS: Array<{
  key: string
  source: RegistrationQuotaSource
  paymentMethod: RegistrationQuotaPaymentMethod
  label: string
}> = [
  { key: 'online_cash', source: 'online', paymentMethod: 'cash', label: 'Online - Cash' },
  {
    key: 'online_asuransi',
    source: 'online',
    paymentMethod: 'asuransi',
    label: 'Online - Asuransi'
  },
  { key: 'online_company', source: 'online', paymentMethod: 'company', label: 'Online - Company' },
  { key: 'online_bpjs', source: 'online', paymentMethod: 'bpjs', label: 'Online - BPJS' },
  { key: 'offline_cash', source: 'offline', paymentMethod: 'cash', label: 'Offline - Cash' },
  {
    key: 'offline_asuransi',
    source: 'offline',
    paymentMethod: 'asuransi',
    label: 'Offline - Asuransi'
  },
  {
    key: 'offline_company',
    source: 'offline',
    paymentMethod: 'company',
    label: 'Offline - Company'
  },
  { key: 'offline_bpjs', source: 'offline', paymentMethod: 'bpjs', label: 'Offline - BPJS' }
]

export const buildRegistrationQuotaKey = (
  dayOfWeek: number,
  source: RegistrationQuotaSource,
  paymentMethod: RegistrationQuotaPaymentMethod
) => `${dayOfWeek}_${source}_${paymentMethod}`

export const EMPTY_REGISTRATION_QUOTA = Object.fromEntries(
  DAY_OPTIONS.flatMap((day) =>
    REGISTRATION_QUOTA_FIELDS.map((field) => [
      buildRegistrationQuotaKey(day.value, field.source, field.paymentMethod),
      undefined
    ])
  )
) as Record<string, undefined>

export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export const defaultRegularSession = (): DoctorScheduleSessionFormValue => ({
  dayOfWeek: 1,
  sessionNumber: 1,
  startTime: '08:00',
  endTime: '12:00',
  quota: 30,
  isActive: true
})

export const defaultException = (): DoctorScheduleExceptionFormValue => ({
  date: dayjs(),
  type: 'libur',
  mode: 'full_day',
  isActive: true,
  sessions: []
})

export const defaultExceptionSession = (): DoctorScheduleExceptionSessionFormValue => ({
  sessionNumber: 1,
  startTime: '08:00',
  endTime: '12:00',
  quota: 30,
  isActive: true
})
