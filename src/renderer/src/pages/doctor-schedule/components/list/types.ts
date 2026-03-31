export interface DoctorScheduleApiItem {
  id: number
  idPegawai: number
  idPoli: number
  idLokasiKerja: number
  idKontrakKerja: number
  kategori: string
  namaJadwal?: string | null
  berlakuDari: string
  berlakuSampai?: string | null
  status: 'active' | 'inactive'
  keterangan?: string | null
  pegawai?: {
    id: number
    namaLengkap: string
    email?: string | null
    nik?: string | null
  } | null
  poli?: {
    id: number
    name: string
    description?: string | null
    location?: string | null
  } | null
}

export type DoctorScheduleListResult = {
  success: boolean
  result?: DoctorScheduleApiItem[]
  message?: string
  error?: string
}

export interface DoctorScheduleItem {
  id?: number
  scheduleName: string
  doctorName: string
  category: string
  poli: string
  effectiveRange: string
  contractId: number
  locationId: number
  status: 'active' | 'inactive'
  note: string
}

export type DoctorScheduleRow = DoctorScheduleItem & { no: number }
