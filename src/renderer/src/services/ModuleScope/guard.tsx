import type { PropsWithChildren, ReactNode } from 'react'
import { moduleScopePermission } from './module-scope'
import { useModuleScopeStore } from './store'
import type { ModuleCode, ScopeSession } from './type'

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

export const useModuleScopeAccess = (moduleCode: ModuleCode) => {
  const session = useModuleScopeStore((state) => state.session)
  const { canAccess, isVisible } = resolveModuleAccess(session, moduleCode)

  return {
    canAccess,
    isVisible,
    session
  }
}

interface ModuleScopeGuardProps extends PropsWithChildren {
  module: ModuleCode
  mode?: 'access' | 'visible'
  fallback?: ReactNode
}

export function ModuleScopeGuard({
  children,
  module,
  mode = 'access',
  fallback = null
}: ModuleScopeGuardProps) {
  const { canAccess, isVisible } = useModuleScopeAccess(module)
  const isAllowed = mode === 'visible' ? isVisible : canAccess

  return isAllowed ? <>{children}</> : <>{fallback}</>
}
