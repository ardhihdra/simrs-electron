/**
 * purpose: Hook komposisi untuk menggabungkan master level dan kriteria triase IGD.
 * main callers: `IgdTriageWorkspace`, `IgdTriagePrimerPanel`, `IgdTriageSekunderPanel`.
 * key dependencies: `useMasterIgdTriageLevelActive`, `useMasterIgdTriageCriteriaActive`.
 * main/public functions: `useIgdTriageMaster`.
 * side effects: Men-trigger query read-only untuk 2 sumber master data triase.
 */
import { useMemo } from 'react'
import {
  TRIAGE_CRITERIA_GROUPS,
  type MasterIgdTriageCriteriaItem,
  type TriageCriteriaGroup,
  useMasterIgdTriageCriteriaActive
} from './use-master-igd-triage-criteria'
import {
  type MasterIgdTriageLevelItem,
  useMasterIgdTriageLevelActive
} from './use-master-igd-triage-level'

export interface TriageCriteriaGroupedByGroup {
  airway: MasterIgdTriageCriteriaItem[]
  breathing: MasterIgdTriageCriteriaItem[]
  circulation: MasterIgdTriageCriteriaItem[]
  disability_and_other_dysfunction: MasterIgdTriageCriteriaItem[]
  nyeri: MasterIgdTriageCriteriaItem[]
}

const createEmptyCriteriaGroup = (): TriageCriteriaGroupedByGroup => ({
  airway: [],
  breathing: [],
  circulation: [],
  disability_and_other_dysfunction: [],
  nyeri: []
})

export const useIgdTriageMaster = () => {
  const levelsQuery = useMasterIgdTriageLevelActive()
  const criteriaQuery = useMasterIgdTriageCriteriaActive()

  const levels = useMemo(
    () => (Array.isArray(levelsQuery.data) ? levelsQuery.data : []),
    [levelsQuery.data]
  )

  const criteria = useMemo(
    () => (Array.isArray(criteriaQuery.data) ? criteriaQuery.data : []),
    [criteriaQuery.data]
  )

  const criteriaByLevel = useMemo(() => {
    const grouped = new Map<number, TriageCriteriaGroupedByGroup>()

    for (const level of levels) {
      grouped.set(level.id, createEmptyCriteriaGroup())
    }

    for (const item of criteria) {
      if (!grouped.has(item.triageLevelId)) {
        grouped.set(item.triageLevelId, createEmptyCriteriaGroup())
      }

      const target = grouped.get(item.triageLevelId)
      if (!target) continue

      if (TRIAGE_CRITERIA_GROUPS.includes(item.criteriaGroup as TriageCriteriaGroup)) {
        const key = item.criteriaGroup as TriageCriteriaGroup
        target[key].push(item)
      }
    }

    return grouped
  }, [levels, criteria])

  const primerLevels = useMemo(() => levels.filter((level) => level.levelNo <= 2), [levels])
  const sekunderLevels = useMemo(() => levels.filter((level) => level.levelNo >= 3), [levels])

  return {
    levels,
    criteria,
    primerLevels,
    sekunderLevels,
    criteriaByLevel,
    isLoading: levelsQuery.isLoading || criteriaQuery.isLoading,
    isFetching: levelsQuery.isFetching || criteriaQuery.isFetching,
    isError: levelsQuery.isError || criteriaQuery.isError,
    error: levelsQuery.error ?? criteriaQuery.error,
    refetchAll: async () => {
      await Promise.all([levelsQuery.refetch(), criteriaQuery.refetch()])
    }
  }
}

export type { MasterIgdTriageLevelItem }
