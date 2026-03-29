export interface DoctorScheduleApiItem {
  id: number | string
  idPegawai: number | string
  idPoli: number | string
  idLokasiKerja: number | string
  idKontrakKerja: number | string
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
  id?: number | string
  scheduleName: string
  doctorName: string
  category: string
  poli: string
  effectiveRange: string
  contractId: number | string
  locationId: number | string
  status: 'active' | 'inactive'
  note: string
}

export type DoctorScheduleRow = DoctorScheduleItem & { no: number }
