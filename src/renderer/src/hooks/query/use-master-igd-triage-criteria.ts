/**
 * purpose: Hook query untuk mengambil daftar kriteria triase IGD aktif dari IPC.
 * main callers: `useIgdTriageMaster` dan panel Primer/Sekunder pada triase workspace.
 * key dependencies: React Query, `window.api.query.masterIgdTriageCriteria.listActive`.
 * main/public functions: `useMasterIgdTriageCriteriaActive`.
 * side effects: IPC invoke ke main process lalu HTTP read-only ke backend.
 */
import { useQuery } from '@tanstack/react-query'

export type TriageCriteriaGroup =
  | 'airway'
  | 'breathing'
  | 'circulation'
  | 'disability_and_other_dysfunction'
  | 'nyeri'

export interface MasterIgdTriageCriteriaItem {
  id: number
  triageLevelId: number
  criteriaGroup: string
  criteriaText: string
  sortOrder?: number | null
  isActive?: boolean | null
}

export const TRIAGE_CRITERIA_GROUPS: TriageCriteriaGroup[] = [
  'airway',
  'breathing',
  'circulation',
  'disability_and_other_dysfunction',
  'nyeri'
]

export const useMasterIgdTriageCriteriaActive = () => {
  return useQuery({
    queryKey: ['master-igd-triage-criteria', 'list-active'],
    queryFn: async (): Promise<MasterIgdTriageCriteriaItem[]> => {
      const fn = (window.api?.query as any)?.masterIgdTriageCriteria?.listActive as
        | (() => Promise<{ success: boolean; result?: MasterIgdTriageCriteriaItem[]; error?: string }>)
        | undefined
      if (!fn) throw new Error('API master kriteria triase IGD tidak tersedia')

      const response = await fn()
      if (!response.success) {
        throw new Error(response.error ?? 'Gagal mengambil kriteria triase IGD')
      }

      return Array.isArray(response.result)
        ? (response.result as MasterIgdTriageCriteriaItem[])
        : []
    },
    staleTime: 5 * 60 * 1000
  })
}
