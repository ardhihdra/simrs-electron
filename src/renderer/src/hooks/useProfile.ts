import { useMemo, useEffect } from 'react'
import { useProfileStore, SessionUser } from '@renderer/store/profileStore'

type GetSessionResult = {
  success: boolean
  user?: SessionUser
}

export function useMyProfile() {
  const profile = useProfileStore((state) => state.profile)
  const setProfile = useProfileStore((state) => state.setProfile)

  useEffect(() => {
    if (profile) return
    let mounted = true
    ;(async () => {
      try {
        const res = (await window.api.auth.getSession()) as GetSessionResult
        if (mounted && res.success && res.user) setProfile(res.user)
      } catch {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [profile, setProfile])

  const initials = useMemo(() => {
    const name = profile?.username?.trim() || ''
    if (!name) return 'U'
    const parts = name.split(/\s+/)
    const a = parts[0]?.[0] ?? ''
    const b = parts[1]?.[0] ?? ''
    return (a + b).toUpperCase() || a.toUpperCase() || 'U'
  }, [profile?.username])

  return { profile, initials }
}
