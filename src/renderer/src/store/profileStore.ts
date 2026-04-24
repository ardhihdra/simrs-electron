import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type SessionUser = { id: number | string; username: string; hakAksesId: string; hakAksesNama?: string }

interface ProfileState {
  profile: SessionUser | null
  setProfile: (profile: SessionUser) => void
  clearProfile: () => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null })
    }),
    {
      name: 'profile-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
