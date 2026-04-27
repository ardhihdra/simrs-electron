export type SourceEncounterLookupType = 'EMER' | 'AMB'

export type SourceEncounterLookupFilters = {
  encounterType?: SourceEncounterLookupType
  search?: string
  patient?: string
  practitionerId?: string
  dateFrom?: string
  dateTo?: string
}

export type IgdEncounterLookupFilters = Omit<SourceEncounterLookupFilters, 'encounterType'>

export type SourceEncounterLookupQuery = {
  depth: number
  items: number
  serviceType: SourceEncounterLookupType
  startDate?: string
  endDate?: string
  practitionerId?: string
  q?: string
}

export type IgdEncounterLookupQuery = SourceEncounterLookupQuery & {
  serviceType: 'EMER'
}

export type SourceEncounterLookupRow = {
  key: string
  id: string
  encounterType: string
  status: string
  startTime?: string
  patientId?: string
  patientName: string
  patientMrNo: string
  practitionerName: string
  queueNumber: string
  serviceUnitName: string
  raw: any
}

export type IgdEncounterLookupRow = SourceEncounterLookupRow

const pickRows = (payload: unknown): any[] => {
  if (!payload || typeof payload !== 'object') return []

  const record = payload as any
  const candidates = [record.result, record.data, record.result?.data, record.data?.data]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }

  return []
}

const getDateOnly = (value?: string) => {
  const trimmed = String(value || '').trim()
  return trimmed || undefined
}

export function buildSourceEncounterLookupQuery(
  filters: SourceEncounterLookupFilters = {}
): SourceEncounterLookupQuery {
  const q = (filters.patient || filters.search || '').trim()
  const practitionerId = String(filters.practitionerId || '').trim()
  const encounterType = filters.encounterType ?? 'EMER'

  return {
    depth: 1,
    items: 50,
    serviceType: encounterType,
    ...(getDateOnly(filters.dateFrom) ? { startDate: getDateOnly(filters.dateFrom) } : {}),
    ...(getDateOnly(filters.dateTo) ? { endDate: getDateOnly(filters.dateTo) } : {}),
    ...(practitionerId ? { practitionerId } : {}),
    ...(q ? { q } : {})
  }
}

export function buildIgdEncounterLookupQuery(
  filters: IgdEncounterLookupFilters = {}
): IgdEncounterLookupQuery {
  return buildSourceEncounterLookupQuery({
    ...filters,
    encounterType: 'EMER'
  }) as IgdEncounterLookupQuery
}

export function normalizeSourceEncounterLookupRows(
  payload: unknown,
  encounterType: SourceEncounterLookupType = 'EMER'
): SourceEncounterLookupRow[] {
  return pickRows(payload)
    .filter((item) => String(item?.encounterType || '').toUpperCase() === encounterType)
    .map((item) => {
      const queueTicket = item?.queueTicket ?? {}
      const patient = item?.patient ?? {}
      const practitioner = queueTicket?.practitioner ?? item?.practitioner ?? {}
      const serviceUnit = queueTicket?.serviceUnit ?? item?.serviceUnit ?? {}
      const poli = queueTicket?.poli ?? item?.poli ?? {}

      return {
        key: String(item.id),
        id: String(item.id),
        encounterType: String(item.encounterType || ''),
        status: String(item.status || ''),
        startTime: item.startTime || item.visitDate || item.createdAt || undefined,
        patientId: item.patientId ? String(item.patientId) : patient?.id ? String(patient.id) : undefined,
        patientName: item.patientName || patient?.name || '-',
        patientMrNo: item.patientMrNo || patient?.medicalRecordNumber || '-',
        practitionerName: practitioner?.namaLengkap || practitioner?.name || '-',
        queueNumber:
          queueTicket?.formattedQueueNumber ||
          (queueTicket?.queueNumber ? String(queueTicket.queueNumber) : '-'),
        serviceUnitName: serviceUnit?.display || serviceUnit?.name || poli?.name || '-',
        raw: item
      }
    })
}

export function normalizeIgdEncounterLookupRows(payload: unknown): IgdEncounterLookupRow[] {
  return normalizeSourceEncounterLookupRows(payload, 'EMER')
}
