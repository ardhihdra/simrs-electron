import { clearModuleScopeSession } from '@renderer/services/ModuleScope/module-scope'
import { queryClient } from '@renderer/query-client'
import { useSelectedModuleStore } from '@renderer/store/selectedModuleStore'
import { useProfileStore } from '@renderer/store/profileStore'
import { useNavigate } from 'react-router'

type LogoutResult = { success: boolean }

export function useLogout() {
  const navigate = useNavigate()
  const clearSelectedModule = useSelectedModuleStore((state) => state.clearSelectedModule)
  const clearProfile = useProfileStore((state) => state.clearProfile)

  const clearModuleClientState = (includeProfile = false) => {
    clearModuleScopeSession()
    clearSelectedModule()
    queryClient.removeQueries({ queryKey: ['module'] })
    if (includeProfile) clearProfile()
  }

  const handleLogout = async () => {
    const res = (await window.api.auth.logout()) as LogoutResult
    if (res.success) {
      clearModuleClientState(true)
      navigate('/')
    }
  }

  return { handleLogout, clearModuleClientState }
}
