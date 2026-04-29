import { z } from 'zod'

export const DpjpParticipantItemSchema = z.object({
  id: z.number(),
  staffId: z.number(),
  staffName: z.string(),
  role: z.enum(['dpjp_utama', 'dpjp_tambahan']),
  startAt: z.string().nullable(),
  notes: z.string().nullable(),
})

const InpatientPatientListItemSchema = z.object({
  encounterId: z.string(),
  patientId: z.string(),
  serviceUnitId: z.string().nullable().optional(),
  practitionerId: z.number().nullable().optional(),
  partOfId: z.string().nullable().optional(),
  partOfEncounterType: z.string().nullable().optional(),
  arrivalType: z.string().nullable().optional(),
  medicalRecordNumber: z.string().nullable(),
  patientName: z.string(),
  ageLabel: z.string().nullable(),
  gender: z.string().nullable(),
  wardId: z.string().nullable(),
  wardName: z.string().nullable(),
  bedId: z.string().nullable().optional(),
  bedName: z.string().nullable(),
  dpjpName: z.string().nullable(),
  dpjpParticipants: z.array(DpjpParticipantItemSchema).optional().default([]),
  diagnosisCode: z.string().nullable().optional(),
  diagnosisSummary: z.string().nullable(),
  admissionDateTime: z.string().nullable(),
  indication: z.string().nullable().optional(),
  classOfCareCodeId: z.string().nullable().optional(),
  losDays: z.number(),
  paymentLabel: z.string().nullable(),
  paymentMethod: z.string().nullable().optional(),
  patientInsuranceId: z.number().nullable().optional(),
  sepNumber: z.string().nullable(),
  sepNoKartu: z.string().nullable().optional(),
  sepNoRujukan: z.string().nullable().optional(),
  encounterStatus: z.string(),
})

export const InpatientPatientListQuerySchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(10),
  search: z.string().optional(),
  encounterStatus: z.string().optional(),
  wardId: z.string().optional(),
  dpjpName: z.string().optional(),
  paymentType: z.string().optional(),
  losCategory: z.enum(['normal', 'panjang', 'sangat']).optional(),
  sortField: z.enum(['patientName', 'wardName', 'dpjpName', 'admissionDateTime', 'losDays']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export const InpatientPatientListResultSchema = z.object({
  generatedAt: z.string(),
  items: z.array(InpatientPatientListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  statusCounts: z.object({
    PLANNED: z.number().default(0),
    IN_PROGRESS: z.number().default(0),
    FINISHED: z.number().default(0),
  }),
})

export const InpatientPatientListOptionsSchema = z.object({
  wards: z.array(z.object({ id: z.string(), name: z.string() })),
  dpjps: z.array(z.string()),
})

export type InpatientPatientListItem = z.infer<typeof InpatientPatientListItemSchema>
export type InpatientPatientListQuery = z.infer<typeof InpatientPatientListQuerySchema>
export type InpatientPatientListResult = z.infer<typeof InpatientPatientListResultSchema>
export type InpatientPatientListOptions = z.infer<typeof InpatientPatientListOptionsSchema>

export function normalizeInpatientPatientListResponse(payload: unknown): InpatientPatientListResult {
  if (payload && typeof payload === 'object' && 'result' in payload) {
    return InpatientPatientListResultSchema.parse((payload as { result: unknown }).result)
  }
  throw new Error('Invalid inpatient patient list response')
}

export function normalizeInpatientPatientListOptionsResponse(payload: unknown): InpatientPatientListOptions {
  if (payload && typeof payload === 'object' && 'result' in payload) {
    return InpatientPatientListOptionsSchema.parse((payload as { result: unknown }).result)
  }
  throw new Error('Invalid inpatient patient list options response')
}

export type DpjpParticipantItem = z.infer<typeof DpjpParticipantItemSchema>
