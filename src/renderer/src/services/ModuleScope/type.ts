export type ModuleCode = string

export type ModuleNodeInput = {
  code: string
  children?: ModuleNodeInput[]
}

export interface ModuleNode {
  code: ModuleCode
  children?: ModuleNode[]
}

export interface ScopeSession {
  id: number
  lokasiKerjaId: number
  allowedModules: ModuleCode[]
  label?: string
  hakAksesId?: string
  kepegawaianId?: number
}

export interface PermissionState {
  visibleModules: ModuleCode[]
}

export interface ScopeSessionPayload {
  id: number | string
  lokasiKerjaId: number | string
  allowedModules: string[]
  label?: string
  hakAksesId?: string
}

export const ModuleDefinition: ModuleNodeInput[] = []

export type PageAccessEntry = {
    allowedModules: string[]
    roles: string[]
    allowedLokasiKerjaIds: number[]
}
