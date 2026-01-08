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

export const PegawaiCategoryOptions = [
  { label: 'Dokter', value: 'doctor' },
  { label: 'Perawat', value: 'nurse' },
  { label: 'Apoteker', value: 'pharmacist' },
  { label: 'Lab', value: 'lab_technician' },
  { label: 'Radiologi', value: 'radiologist' }
]

export type { KepegawaianAttributes, KontrakPegawaiAttributes } from "simrs-types"
