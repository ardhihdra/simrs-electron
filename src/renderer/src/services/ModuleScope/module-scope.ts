import { moduleTree } from './constant'
import { useModuleScopeStore } from './store'
import { ModuleCode, ModuleNode, PermissionState, ScopeSession } from './type'

export interface ModuleScopeOptions {
  moduleTree: ModuleNode[]
}

export class ModuleScopePermission {
  private readonly parentMap = new Map<ModuleCode, ModuleCode | null>()
  private readonly childrenMap = new Map<ModuleCode, ModuleCode[]>()
  private readonly allModules = new Set<ModuleCode>()

  constructor(options: ModuleScopeOptions) {
    this.buildIndexes(options.moduleTree, null)
  }

  private buildIndexes(nodes: ModuleNode[], parent: ModuleCode | null): void {
    for (const node of nodes) {
      if (this.allModules.has(node.code)) {
        throw new Error(`Duplicate module code: ${node.code}`)
      }

      this.allModules.add(node.code)
      this.parentMap.set(node.code, parent)

      if (!this.childrenMap.has(node.code)) {
        this.childrenMap.set(node.code, [])
      }

      if (parent) {
        const children = this.childrenMap.get(parent) ?? []
        children.push(node.code)
        this.childrenMap.set(parent, children)
      }

      if (node.children?.length) {
        this.buildIndexes(node.children, node.code)
      }
    }
  }

  private assertKnownModule(code: ModuleCode): void {
    if (!this.allModules.has(code)) {
      throw new Error(`Unknown module: ${code}`)
    }
  }

  public validateGrantedModules(grantedModules: ModuleCode[]): void {
    for (const code of grantedModules) {
      this.assertKnownModule(code)
    }
  }

  private hasAdministratorAccess(session: ScopeSession): boolean {
    return isAdministratorRole(session.hakAksesId)
  }

  /**
   * Access rule:
   * - direct grant => allowed
   * - ancestor grant => allowed
   * - child grant does not grant sibling
   */
  public hasAccess(session: ScopeSession, targetModule: ModuleCode): boolean {
    this.assertKnownModule(targetModule)
    if (this.hasAdministratorAccess(session)) {
      return true
    }
    this.validateGrantedModules(session.allowedModules)

    let current: ModuleCode | null = targetModule

    while (current) {
      if (session.allowedModules.includes(current)) {
        return true
      }
      current = this.parentMap.get(current) ?? null
    }

    return false
  }

  /**
   * Visible in client menu if:
   * - module itself is accessible, OR
   * - any descendant is accessible
   *
   * This allows showing parent containers when only child is granted.
   */
  public isVisibleForClient(session: ScopeSession, targetModule: ModuleCode): boolean {
    this.assertKnownModule(targetModule)
    if (this.hasAdministratorAccess(session)) {
      console.log('has admin access, visible', targetModule)
      return true
    }

    if (this.hasAccess(session, targetModule)) {
      console.log('has access, visible', targetModule)
      return true
    }

    const descendants = this.getDescendants(targetModule)
    for (const descendant of descendants) {
      if (this.hasAccess(session, descendant)) {
        console.log('has access through descendant, visible', targetModule)
        return true
      }
    }
    console.log('no access, not visible', targetModule)
    return false
  }

  public buildClientState(session: ScopeSession): PermissionState {
    if (this.hasAdministratorAccess(session)) {
      return { visibleModules: [...this.allModules] }
    }

    this.validateGrantedModules(session.allowedModules)

    const visibleModules: ModuleCode[] = []

    for (const code of this.allModules) {
      if (this.isVisibleForClient(session, code)) {
        visibleModules.push(code)
      }
    }

    return { visibleModules }
  }

  public getDescendants(moduleCode: ModuleCode): ModuleCode[] {
    this.assertKnownModule(moduleCode)

    const result: ModuleCode[] = []
    const stack = [...(this.childrenMap.get(moduleCode) ?? [])]

    while (stack.length > 0) {
      const current = stack.pop()!
      result.push(current)

      const children = this.childrenMap.get(current) ?? []
      for (const child of children) {
        stack.push(child)
      }
    }

    return result
  }
}

export const moduleScopePermission = new ModuleScopePermission({
  moduleTree
})

const SESSION_CONTAINER_KEYS = ['result', 'session'] as const
const ADMINISTRATOR_ROLE = 'administrator'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

// we use upper case for module
export const normalizeModuleCode = (code: string): ModuleCode => code.trim()

const normalizeRoleCode = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : undefined

export const isAdministratorRole = (hakAksesId?: string): boolean =>
  normalizeRoleCode(hakAksesId) === ADMINISTRATOR_ROLE

const normalizeAllowedModules = (allowedModules: unknown): ModuleCode[] => {
  if (!Array.isArray(allowedModules)) {
    throw new Error('Invalid module scope session: allowedModules must be an array')
  }

  const normalizedModules = Array.from(
    new Set(
      allowedModules
        .filter((value): value is string => typeof value === 'string')
        .map(normalizeModuleCode)
        .filter(Boolean)
    )
  )

  if (normalizedModules.length === 0) {
    throw new Error('Invalid module scope session: allowedModules is empty')
  }

  return normalizedModules
}

const normalizeNumericValue = (value: unknown, fieldName: string): number => {
  const normalizedValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN

  if (!Number.isFinite(normalizedValue)) {
    throw new Error(`Invalid module scope session: ${fieldName} must be a number`)
  }

  return normalizedValue
}

const unwrapScopeSession = (input: unknown): Record<string, unknown> => {
  if (!isRecord(input)) {
    throw new Error('Invalid module scope session response')
  }

  for (const key of SESSION_CONTAINER_KEYS) {
    const nestedValue = input[key]
    if (isRecord(nestedValue)) {
      return nestedValue
    }
  }

  return input
}

export const normalizeScopeSession = (input: unknown): ScopeSession => {
  const rawSession = unwrapScopeSession(input)

  const session: ScopeSession = {
    id: normalizeNumericValue(rawSession.id, 'id'),
    lokasiKerjaId: normalizeNumericValue(rawSession.lokasiKerjaId, 'lokasiKerjaId'),
    allowedModules: normalizeAllowedModules(rawSession.allowedModules),
    ...(normalizeRoleCode(rawSession.hakAksesId)
      ? { hakAksesId: normalizeRoleCode(rawSession.hakAksesId) }
      : {}),
    ...(typeof rawSession.label === 'string' && rawSession.label.trim()
      ? { label: rawSession.label.trim() }
      : {})
  }

  if (!isAdministratorRole(session.hakAksesId)) {
    moduleScopePermission.validateGrantedModules(session.allowedModules)
  }
  return session
}

export const setModuleScopeSession = (input: unknown): ScopeSession => {
  const session = normalizeScopeSession(input)
  useModuleScopeStore.getState().setSession(session)
  return session
}

export const clearModuleScopeSession = (): void => {
  useModuleScopeStore.getState().clearSession()
}

export const getModuleScopeState = (session: ScopeSession | null): PermissionState => {
  if (!session) {
    return { visibleModules: [] }
  }

  try {
    return moduleScopePermission.buildClientState(session)
  } catch {
    return { visibleModules: [] }
  }
}
