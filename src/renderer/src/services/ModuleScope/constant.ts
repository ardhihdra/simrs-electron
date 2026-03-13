import { ModuleDefinition } from 'simrs-types'
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
