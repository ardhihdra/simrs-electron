import dayjs from 'dayjs'

export type EncounterStatusValue = 'PLANNED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED'
export type EncounterStatusFilter = EncounterStatusValue | 'ALL'

export interface QueueEncounterLike {
  patientName?: string
  patientMrNo?: string
  patient?: {
    name?: string
    mrn?: string
  }
  status?: string
  visitDate?: string
  startTime?: string
  createdAt?: string
}

export function normalizeEncounterStatus(status?: string): EncounterStatusValue | undefined {
  const normalized = String(status || '').toUpperCase()

  if (
    normalized === 'PLANNED' ||
    normalized === 'IN_PROGRESS' ||
    normalized === 'FINISHED' ||
    normalized === 'CANCELLED'
  ) {
    return normalized
  }

  return undefined
}

export function getEncounterSortTime(record: QueueEncounterLike): number {
  const rawTime = record.visitDate || record.startTime || record.createdAt
  const parsedTime = dayjs(rawTime).valueOf()

  return Number.isFinite(parsedTime) ? parsedTime : Number.MAX_SAFE_INTEGER
}

export function filterAndSortQueueEncounters<T extends QueueEncounterLike>(
  encounters: T[],
  options: {
    searchText?: string
    statusFilter?: EncounterStatusFilter
  } = {}
): T[] {
  const normalizedSearch = String(options.searchText || '').trim().toLowerCase()
  const statusFilter = options.statusFilter || 'ALL'

  return encounters
    .filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        (item.patientName || item.patient?.name || '').toLowerCase().includes(normalizedSearch) ||
        (item.patientMrNo || item.patient?.mrn || '').toLowerCase().includes(normalizedSearch)

      const matchesStatus =
        statusFilter === 'ALL' || normalizeEncounterStatus(item.status) === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((left, right) => getEncounterSortTime(left) - getEncounterSortTime(right))
}

export function findNextEncounterToServe<T extends QueueEncounterLike>(encounters: T[]): T | null {
  return (
    filterAndSortQueueEncounters(encounters).find(
      (encounter) => normalizeEncounterStatus(encounter.status) === 'PLANNED'
    ) || null
  )
}
