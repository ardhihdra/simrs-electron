export interface ResourceLogSummary {
  success: number
  failed: number
  retry: number
  pending: number
  lastFailedLog: FhirFailedLogDetail | null
}

export interface FhirFailedLogDetail {
  internalResourceId: string
  status: string
  attemptCount: number
  lastAttemptAt?: string | null
  errorMessage?: string | null
}

export interface ResourceSyncCount {
  total: number
  synced: number
  needsResync: number
  logSummary: ResourceLogSummary | null
}

export interface SatuSehatSyncStatus {
  encounterSynced: boolean
  allSynced: boolean
  hasPendingResync: boolean
  encounterLog: FhirFailedLogDetail | null
  resources: {
    observation: ResourceSyncCount
    condition: ResourceSyncCount
    procedure: ResourceSyncCount
    allergyIntolerance: ResourceSyncCount
    composition: ResourceSyncCount
  }
}
