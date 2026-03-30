import type { PropsWithChildren, ReactNode } from 'react'
import { useModuleScopeStore } from './store'
import type { PageAccessEntry } from './type'
import { isPageVisible } from './utils'


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
        return <>{fallback}</>
    }
    return <>{children}</>
}
