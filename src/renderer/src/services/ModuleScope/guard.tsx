import type { PropsWithChildren, ReactNode } from 'react'
import { moduleScopePermission } from './module-scope'
import { useModuleScopeStore } from './store'
import type { ModuleCode, PageAccessEntry, ScopeSession } from './type'

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

const isPageVisible = (access: PageAccessEntry | undefined, session: ScopeSession): boolean => {
    if (!access) return true

    const { allowedModules, roles, allowedLokasiKerjaIds } = access

    const isAdministrator = session.hakAksesId === 'administrator'

    if (allowedModules.length > 0 && !session.allowedModules.some((m) => allowedModules.includes(m))) {
        return false
    }
    if (allowedLokasiKerjaIds.length > 0 && !allowedLokasiKerjaIds.includes(session.lokasiKerjaId)) {
        return false
    }

    const isRoleAllowed =
        isAdministrator || (roles.length > 0 && session.hakAksesId && roles.includes(session.hakAksesId))
    if (!isRoleAllowed) {
        return false
    }

    return true
}

interface ModuleScopeGuardProps extends PropsWithChildren {
    access?: PageAccessEntry
    fallback?: ReactNode
}

export function ModuleScopeGuard({ children, access, fallback = null }: ModuleScopeGuardProps) {
    // return children
    const session = useModuleScopeStore((state) => state.session)
    if (!session) return <>{fallback}</>
    const isAllowed = isPageVisible(access, session)
    if (!isAllowed) {
        console.warn('Not allowed for', access)
    }
    return isAllowed ? <>{children}</> : <>{fallback}</>
}
