import { ScopeSession } from 'simrs-types'
import { ModuleCode, ModuleNode, ModuleNodeInput, PageAccessEntry } from './type'
import { moduleScopePermission } from './module-scope'
import { useModuleScopeStore } from './store'



export function buildModuleTree(nodes: ModuleNodeInput[], parentCode = ''): ModuleNode[] {
  return nodes.map((node) => {
    const fullCode = parentCode ? `${parentCode}.${node.code}` : node.code

    return {
      code: fullCode,
      ...(node.children && {
        children: buildModuleTree(node.children, fullCode)
      })
    }
  })
}

const resolveModuleAccess = (
  session: ScopeSession | null,
  moduleCode: ModuleCode
): { canAccess: boolean; isVisible: boolean } => {
  if (!session) {
    return { canAccess: false, isVisible: false }
  }

  try {
    return {
      canAccess: moduleScopePermission.hasAccess(session, moduleCode),
      isVisible: moduleScopePermission.isVisibleForClient(session, moduleCode)
    }
  } catch {
    return { canAccess: false, isVisible: false }
  }
}

// FIX ME: move me to a better place if we want to use this
export const useModuleScopeAccess = (moduleCode: ModuleCode) => {
  const session = useModuleScopeStore((state) => state.session)
  const { canAccess, isVisible } = resolveModuleAccess(session, moduleCode)

  return {
    canAccess,
    isVisible,
    session
  }
}

export const isPageVisible = (access: PageAccessEntry | undefined, session: ScopeSession): boolean => {
  // return true
  if (!access) return true

  const { allowedModules, roles, allowedLokasiKerjaIds } = access

  // Administrator bypasses module restrictions
  const isAdministrator = session.hakAksesId === 'administrator';

  if (allowedModules.length > 0 && !session.allowedModules.some((m) => allowedModules.includes(m))) {
    // console.log('no module akses for modules', session.allowedModules, 'allowed:', allowedModules)
    return false
  }

  if (
    allowedLokasiKerjaIds.length > 0 &&
    // admin can access all location
    (
      !allowedLokasiKerjaIds.includes(session.lokasiKerjaId) && !isAdministrator
    )
  ) {
    // console.log('no lokasi akses for lokasi', session.lokasiKerjaId, 'allowed:', access.allowedLokasiKerjaIds)
    return false
  }

  const isRoleAllowed = isAdministrator || (roles.length > 0 && session.hakAksesId && roles.includes(session.hakAksesId))
  if (!isRoleAllowed) {
    // console.log('no role akses for role', session.hakAksesId, 'allowed:', roles)
    return false
  }

  // console.log('access granted for', session)
  // console.log('checked againts', access)
  return true
}