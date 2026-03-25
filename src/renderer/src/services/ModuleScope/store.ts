import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { ScopeSession } from './type'

interface ModuleScopeState {
  session: ScopeSession | null
  setSession: (session: ScopeSession) => void
  clearSession: () => void
}

export const useModuleScopeStore = create<ModuleScopeState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) =>
        set({
          session
        }),
      clearSession: () => set({ session: null })
    }),
    {
      name: 'module-scope-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
