import { type Dayjs } from 'dayjs'

export type DoctorScheduleStatus = 'active' | 'inactive'
export type DoctorScheduleExceptionType = 'libur' | 'sakit' | 'izin' | 'cuti' | 'ubah_jam'
export type DoctorScheduleExceptionMode = 'full_day' | 'partial_session'
export type RegistrationQuotaSource = 'online' | 'offline'
export type RegistrationQuotaPaymentMethod = 'cash' | 'asuransi' | 'company' | 'bpjs'
export type DoctorScheduleFormSection = 'info' | 'quota' | 'sessions' | 'exceptions'

export interface DoctorContract {
  idKontrakPegawai?: number
  nomorKontrak?: string
  kodeJabatan?: string | null
  statusKontrak?: string | null
  tanggalMulaiKontrak?: string | Date | null
  tanggalBerakhirKontrak?: string | Date | null
}

export interface DoctorOption {
  id: number
  namaLengkap: string
  email?: string | null
  nik?: string | null
  hakAkses?:
    | string
    | {
        id?: string | number | null
        kode?: string | null
        nama?: string | null
      }
    | null
  hakAksesId?: string | number | null
  kontrakPegawai?: DoctorContract[]
}

export interface PoliOption {
  id: number
  name: string
}

export interface DoctorScheduleSessionDetail {
  id: number
  dayOfWeek: number
  sessionNumber: number
  startTime: string
  endTime: string
  quota?: number | null
  isActive: boolean
}

export interface DoctorScheduleExceptionSessionDetail {
  id: number
  sessionNumber: number
  startTime: string
  endTime: string
  quota?: number | null
  isActive: boolean
}

export interface DoctorScheduleExceptionDetail {
  id: number
  date: string
  type: DoctorScheduleExceptionType
  mode: DoctorScheduleExceptionMode
  description?: string | null
  isActive: boolean
  sessions?: DoctorScheduleExceptionSessionDetail[]
}

export interface DoctorScheduleDetail {
  id: number
  idPegawai: number
  idPoli: number
  idLokasiKerja: number
  idKontrakKerja: number
  kategori: string
  namaJadwal?: string | null
  berlakuDari: string
  berlakuSampai?: string | null
  status: DoctorScheduleStatus
  keterangan?: string | null
  sesi?: DoctorScheduleSessionDetail[]
  exceptions?: DoctorScheduleExceptionDetail[]
  pegawai?: {
    id: number
    namaLengkap: string
    email?: string | null
    nik?: string | null
  } | null
  poli?: {
    id: number
    name: string
  } | null
}

export interface RegistrationQuotaValueDetail {
  id: string
  quotaId: string
  hari: number
  source: RegistrationQuotaSource
  paymentMethod: RegistrationQuotaPaymentMethod
  quotaValue: number
  mitraId?: number | null
}

export interface RegistrationQuotaDetail {
  id: string
  pegawaiId: number
  scheduleId: number
  status: 'active' | 'inactive'
  values?: RegistrationQuotaValueDetail[]
}

export interface DoctorScheduleSummaryDto {
  id: number
  doctorId: number
  doctorName?: string | null
  poliId: number
  poliName?: string | null
  locationId: number
  contractId: number
  category: string
  scheduleName?: string | null
  validFrom: string
  validTo?: string | null
  status: DoctorScheduleStatus
  remark?: string | null
}

export interface DoctorScheduleEditorOutletContext {
  scheduleId: number
  summary: DoctorScheduleSummaryDto
}

export interface DoctorScheduleInfoDto {
  id: number
  doctorId: number
  poliId: number
  locationId: number
  contractId: number
  category: string
  scheduleName?: string | null
  validFrom: string
  validTo?: string | null
  status: DoctorScheduleStatus
  remark?: string | null
}

export interface DoctorScheduleEditorReferenceDataDto {
  doctors: Array<{ id: number; name: string }>
  polis: Array<{ id: number; name: string }>
}

export interface DoctorScheduleQuotaValueDto {
  id: string
  hari: number
  source: RegistrationQuotaSource
  paymentMethod: RegistrationQuotaPaymentMethod
  quotaValue: number
}

export interface DoctorScheduleQuotasDto {
  quotaHeaderId: string | null
  status: 'active' | 'inactive'
  values: DoctorScheduleQuotaValueDto[]
}

export interface DoctorScheduleExceptionsDto {
  exceptions: DoctorScheduleExceptionDetail[]
}

export interface DoctorScheduleSessionsDto {
  sessions: DoctorScheduleSessionDetail[]
}

export interface DoctorContractOptionDto {
  id: number
  nomorKontrak?: string | null
  kodeJabatan?: string | null
  statusKontrak?: string | null
  tanggalMulaiKontrak?: string | null
  tanggalBerakhirKontrak?: string | null
}

export interface DoctorScheduleInfoFormValues {
  idPegawai: number
  idPoli: number
  idLokasiKerja: number
  idKontrakKerja: number
  kategori: string
  namaJadwal?: string
  berlakuDari: Dayjs
  berlakuSampai?: Dayjs | null
  status: DoctorScheduleStatus
  keterangan?: string
}

export interface DoctorScheduleSessionsFormValues {
  sessions: DoctorScheduleSessionFormValue[]
}

export interface DoctorScheduleQuotasFormValues {
  registrationQuota: Record<string, number | null | undefined>
}

export interface DoctorScheduleExceptionsFormValues {
  exceptions?: DoctorScheduleExceptionFormValue[]
}

export interface DoctorScheduleSessionFormValue {
  id?: number
  dayOfWeek: number
  sessionNumber: number
  startTime: string
  endTime: string
  quota?: number | null
  isActive: boolean
}

export interface DoctorScheduleExceptionSessionFormValue {
  id?: number
  sessionNumber: number
  startTime: string
  endTime: string
  quota?: number | null
  isActive: boolean
}

export interface DoctorScheduleExceptionFormValue {
  id?: number
  date: Dayjs
  type: DoctorScheduleExceptionType
  mode: DoctorScheduleExceptionMode
  description?: string
  isActive: boolean
  sessions?: DoctorScheduleExceptionSessionFormValue[]
}

export interface DoctorScheduleFormValues {
  idPegawai: number
  idPoli: number
  idLokasiKerja: number
  idKontrakKerja: number
  kategori: string
  namaJadwal?: string
  berlakuDari: Dayjs
  berlakuSampai?: Dayjs | null
  status: DoctorScheduleStatus
  keterangan?: string
  registrationQuota: Record<string, number | null | undefined>
  sessions: DoctorScheduleSessionFormValue[]
  exceptions?: DoctorScheduleExceptionFormValue[]
}

export type DoctorScheduleDetailResponse = {
  success: boolean
  result?: DoctorScheduleDetail
  message?: string
  error?: string
}

export type RegistrationQuotaListResponse = {
  success: boolean
  result?: RegistrationQuotaDetail[]
  message?: string
  error?: string
}

export type ApiSuccessResponse<T> = {
  success: boolean
  result?: T
  message?: string
  error?: string
}

export interface SelectOption {
  value: number
  label: string
}
