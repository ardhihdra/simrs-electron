import { z } from 'zod'

const InpatientPatientListItemSchema = z.object({
  encounterId: z.string(),
  patientId: z.string(),
  medicalRecordNumber: z.string().nullable(),
  patientName: z.string(),
  ageLabel: z.string().nullable(),
  gender: z.string().nullable(),
  wardId: z.string().nullable(),
  wardName: z.string().nullable(),
  bedName: z.string().nullable(),
  dpjpName: z.string().nullable(),
  diagnosisSummary: z.string().nullable(),
  admissionDateTime: z.string().nullable(),
  losDays: z.number(),
  paymentLabel: z.string().nullable(),
  sepNumber: z.string().nullable(),
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
    IN_PROGRESS: z.number(),
    FINISHED: z.number(),
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
