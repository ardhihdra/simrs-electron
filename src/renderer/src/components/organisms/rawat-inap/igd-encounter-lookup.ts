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
  patientBirthDate?: string
  patientGender?: string
  patientInsuranceNumber?: string
  practitionerName: string
  queueNumber: string
  serviceUnitName: string
  diagnosisCode?: string
  diagnosisText?: string
  paymentMethod?: string
  patientInsuranceId?: string
  mitraId?: number
  mitraCodeNumber?: string
  mitraCodeExpiredDate?: string
  noSep?: string
  noRujukan?: string
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

const firstFilled = (...values: unknown[]) => {
  for (const value of values) {
    const trimmed = String(value ?? '').trim()
    if (trimmed) return trimmed
  }

  return undefined
}

const toOptionalNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const getDiagnosisFromReasonCode = (reasonCode: unknown) => {
  const firstReason = Array.isArray(reasonCode) ? reasonCode[0] : reasonCode
  if (!firstReason || typeof firstReason !== 'object') return {}

  const record = firstReason as any
  const firstCoding = Array.isArray(record.coding) ? record.coding[0] : record.coding

  return {
    diagnosisCode: firstFilled(record.code, firstCoding?.code),
    diagnosisText: firstFilled(record.display, firstCoding?.display, record.text)
  }
}

const getDiagnosisFromEncounter = (item: any) => {
  const reasonDiagnosis = getDiagnosisFromReasonCode(item?.reasonCode)
  const diagnosis = item?.diagnosis ?? item?.condition ?? item?.primaryDiagnosis ?? {}
  const diagnosisCoding = Array.isArray(diagnosis?.coding) ? diagnosis.coding[0] : diagnosis?.coding

  return {
    diagnosisCode: firstFilled(
      item?.diagnosisCode,
      item?.diagnosis?.code,
      item?.condition?.code,
      diagnosisCoding?.code,
      reasonDiagnosis.diagnosisCode
    ),
    diagnosisText: firstFilled(
      item?.diagnosisText,
      item?.diagnosisSummary,
      item?.diagnosis?.text,
      item?.diagnosis?.display,
      item?.condition?.text,
      item?.condition?.display,
      diagnosisCoding?.display,
      reasonDiagnosis.diagnosisText
    )
  }
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
      const patientInsurance = item?.patientInsurance ?? queueTicket?.patientInsurance ?? {}
      const sep = item?.sep ?? item?.latestSep ?? (Array.isArray(item?.seps) ? item.seps[0] : item?.seps) ?? {}
      const diagnosis = getDiagnosisFromEncounter(item)

      return {
        key: String(item.id),
        id: String(item.id),
        encounterType: String(item.encounterType || ''),
        status: String(item.status || ''),
        startTime: item.startTime || item.visitDate || item.createdAt || undefined,
        patientId: item.patientId
          ? String(item.patientId)
          : patient?.id
            ? String(patient.id)
            : undefined,
        patientName: item.patientName || patient?.name || '-',
        patientMrNo: item.patientMrNo || patient?.medicalRecordNumber || '-',
        patientBirthDate: firstFilled(item?.patientBirthDate, patient?.birthDate),
        patientGender: firstFilled(item?.patientGender, patient?.gender),
        patientInsuranceNumber: firstFilled(
          item?.patientInsuranceNumber,
          item?.insuranceNumber,
          patient?.insuranceNumber,
          patient?.bpjsNumber
        ),
        practitionerName: practitioner?.namaLengkap || practitioner?.name || '-',
        queueNumber:
          queueTicket?.formattedQueueNumber ||
          (queueTicket?.queueNumber ? String(queueTicket.queueNumber) : '-'),
        serviceUnitName: serviceUnit?.display || serviceUnit?.name || poli?.name || '-',
        diagnosisCode: diagnosis.diagnosisCode,
        diagnosisText: diagnosis.diagnosisText,
        paymentMethod: firstFilled(item?.paymentMethod, queueTicket?.paymentMethod),
        patientInsuranceId: firstFilled(
          item?.patientInsuranceId,
          queueTicket?.patientInsuranceId,
          patientInsurance?.id
        ),
        mitraId: toOptionalNumber(
          item?.mitraId ?? queueTicket?.mitraId ?? patientInsurance?.mitraId
        ),
        mitraCodeNumber: firstFilled(
          item?.mitraCodeNumber,
          item?.noKartu,
          item?.sep?.noKartu,
          sep?.noKartu,
          queueTicket?.mitraCodeNumber,
          patientInsurance?.mitraCodeNumber,
          patientInsurance?.mitraCode
        ),
        mitraCodeExpiredDate: firstFilled(
          item?.mitraCodeExpiredDate,
          item?.mitraExpiredAt,
          queueTicket?.mitraCodeExpiredDate,
          patientInsurance?.mitraCodeExpiredDate,
          patientInsurance?.mitraExpiredAt
        ),
        noSep: firstFilled(
          item?.noSep,
          item?.sepNumber,
          item?.sepNo,
          item?.sepNoSep,
          item?.sep?.noSep,
          sep?.noSep
        ),
        noRujukan: firstFilled(
          item?.noRujukan,
          item?.sepNoRujukan,
          item?.referralNumber,
          item?.referral?.noRujukan,
          item?.sep?.noRujukan,
          sep?.noRujukan
        ),
        raw: item
      }
    })
}

export function normalizeIgdEncounterLookupRows(payload: unknown): IgdEncounterLookupRow[] {
  return normalizeSourceEncounterLookupRows(payload, 'EMER')
}
