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

const domainModules: ModuleNodeInput[] = [
  {
    code: 'rekam_medis',
    children: [
      {
        code: 'rekam_medis'
      },
      {
        code: 'registration',
        children: [{ code: 'pendaftaran' }, { code: 'penjadwalan' }]
      },
      {
        code: 'queue'
      }
    ]
  },
  {
    code: 'rawat_jalan',
    children: [
      {
        code: 'poli',
        children: [
          { code: 'anak' },
          { code: 'jantung' },
          { code: 'kulit_dan_kelamin' },
          { code: 'mata' },
          { code: 'bedah' },
          { code: 'saraf' },
          { code: 'ortopedi' },
          { code: 'penyakit_dalam' },
          { code: 'kandungan' },
          { code: 'gigi_dan_mulut' },
          { code: 'tht' },
          { code: 'paru' },
          { code: 'psykologi' },
          { code: 'fisioterapi' },
          { code: 'gizi' },
          { code: 'umum' }
        ]
      }
    ]
  },
  {
    code: 'rawat_inap',
    children: [
      {
        code: 'ranap_1',
        children: [{ code: 'class_1' }, { code: 'class_2' }, { code: 'class_3' }, { code: 'vip' }]
      },
      {
        code: 'ranap_2',
        children: [{ code: 'class_1' }, { code: 'class_2' }, { code: 'class_3' }, { code: 'vip' }]
      }
    ]
  },
  {
    code: 'igd'
  }
] as const

export const modules: ModuleNodeInput[] = [...workspaceModules, ...domainModules]

export const moduleTree = buildModuleTree(modules)
