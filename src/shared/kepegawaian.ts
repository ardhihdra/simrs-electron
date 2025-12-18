export enum JenisKelaminEnum {
  Laki = 'L',
  Perempuan = 'P'
}

export type RoleEnum =
  | 'administrator'
  | 'manager'
  | 'admin'
  | 'admin_backoffice'
  | 'operator_gudang'
  | 'doctor'
  | 'nurse'
  | 'pharmacist'
  | 'receptionist'
  | 'lab_technician'
  | 'radiologist'
  | 'accountant'
  | 'patient'

export interface KontrakPegawaiAttributes {
  idKontrakPegawai?: number
  idPegawai?: number
  kodeDivisi?: string | null
  kodeDepartemen?: string | null
  kodeJabatan?: string | null
  tanggalMulaiKontrak?: Date | string | null
  tanggalBerakhirKontrak?: Date | string | null
  statusKontrak?: string | null
}

export interface KepegawaianAttributes {
  id?: number
  removed: boolean
  email: string
  namaLengkap: string
  nik: string
  tanggalLahir: Date
  jenisKelamin: JenisKelaminEnum
  alamat?: string | null
  nomorTelepon?: string | null
  hakAkses?: RoleEnum | null
  kodeHakAkses?: string | null
  hakAksesId?: string | null
  hash?: string | null
  emailToken?: string | null
  resetToken?: string | null
  emailVerified?: boolean | null
  loggedSessions?: string[] | null
  idSatuSehat?: string | null
  kontrakPegawai?: KontrakPegawaiAttributes[]
  createdBy: number
  updatedBy?: number | null
  deletedBy?: number | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}
