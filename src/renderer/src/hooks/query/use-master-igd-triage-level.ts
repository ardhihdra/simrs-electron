/**
 * purpose: Hook query untuk mengambil daftar level triase IGD aktif dari IPC.
 * main callers: `useIgdTriageMaster` dan komponen triase workspace IGD.
 * key dependencies: React Query, `window.api.query.masterIgdTriageLevel.listActive`.
 * main/public functions: `useMasterIgdTriageLevelActive`.
 * side effects: IPC invoke ke main process lalu HTTP read-only ke backend.
 */
import { useQuery } from '@tanstack/react-query'

export interface MasterIgdTriageLevelItem {
  id: number
  levelNo: number
  name?: string | null
  color?: string | null
  label?: string | null
  responseTime?: string | null
  isActive?: boolean | null
}

export const useMasterIgdTriageLevelActive = () => {
  return useQuery({
    queryKey: ['master-igd-triage-level', 'list-active'],
    queryFn: async (): Promise<MasterIgdTriageLevelItem[]> => {
      const fn = (window.api?.query as any)?.masterIgdTriageLevel?.listActive as
        | (() => Promise<{ success: boolean; result?: MasterIgdTriageLevelItem[]; error?: string }>)
        | undefined
      if (!fn) throw new Error('API master level triase IGD tidak tersedia')

      const response = await fn()
      if (!response.success) {
        throw new Error(response.error ?? 'Gagal mengambil level triase IGD')
      }

      return Array.isArray(response.result) ? (response.result as MasterIgdTriageLevelItem[]) : []
    },
    staleTime: 5 * 60 * 1000
  })
}
