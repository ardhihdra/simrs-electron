import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SelectedModuleState {
  selectedModule: string | null
  setSelectedModule: (module: string) => void
  clearSelectedModule: () => void
}

const normalizeSelectedModule = (module: string) => module.trim().toLowerCase()

export const useSelectedModuleStore = create<SelectedModuleState>()(
  persist(
    (set) => ({
      selectedModule: null,
      setSelectedModule: (module) =>
        set({
          selectedModule: normalizeSelectedModule(module)
        }),
      clearSelectedModule: () => set({ selectedModule: null })
    }),
    {
      name: 'selected-module-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
