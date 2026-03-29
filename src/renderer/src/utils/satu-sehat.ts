import { SatuSehatSyncStatus } from "@renderer/types/satu-sehat"

export const getSyncSummary = (syncStatus: SatuSehatSyncStatus | null | undefined) => {
  if (!syncStatus) return { totalResources: 0, totalSynced: 0, pct: 0 }
  const res = syncStatus.resources
  const keys = Object.keys(res) as (keyof typeof res)[]
  let totalResources = 1
  let totalSynced = syncStatus.encounterSynced ? 1 : 0
  for (const k of keys) {
    if (res[k].total > 0) {
      totalResources += res[k].total
      totalSynced += res[k].synced
    }
  }
  const pct = totalResources === 0 ? 0 : Math.round((totalSynced / totalResources) * 100)
  return { totalResources, totalSynced, pct }
}
