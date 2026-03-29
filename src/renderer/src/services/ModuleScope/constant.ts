import { ModuleDefinition } from './type'
import { ModuleNodeInput } from './type'
import { buildModuleTree } from './utils'

export const workspaceModuleCodes = {
  administrator: 'administrator',
  registration: 'registration',
  queue: 'queue',
  medicine: 'medicine',
  laboratory: 'laboratory',
  nurse: 'nurse',
  doctor: 'doctor'
} as const

const workspaceModules: ModuleNodeInput[] = Object.values(workspaceModuleCodes).map((code) => ({
  code
}))

export const modules: ModuleNodeInput[] = [...workspaceModules, ...ModuleDefinition]

export const moduleTree = buildModuleTree(modules)

// TODO MOVE IT TO shared
export enum Modules {
  REGISTRASI = 'REGISTRASI',
  ANTRIAN = 'ANTRIAN',
  RAWAT_JALAN = 'RAWAT_JALAN',
  RAWAT_INAP = 'RAWAT_INAP',
  OK = 'OK',
  VK = 'VK',
  MCU = 'MCU',
  RAWAT_DARURAT = 'RAWAT_DARURAT',
  LAB = 'LAB',
  RADIOLOGI = 'RADIOLOGI',
  REKAM_MEDIK = 'REKAM_MEDIK',
  FARMASI = 'FARMASI',
  KEUANGAN = 'KEUANGAN',
  PONEK = 'PONEK',
  GUDANG_FARMASI = 'GUDANG_FARMASI',
  GUDANG_UMUM = 'GUDANG_UMUM',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  BILLING_KASIR = 'BILLING_KASIR',
  MOBILE_PASIEN = 'MOBILE_PASIEN',
}