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

export const InpatientPatientListResultSchema = z.object({
  generatedAt: z.string(),
  items: z.array(InpatientPatientListItemSchema),
})

export type InpatientPatientListItem = z.infer<typeof InpatientPatientListItemSchema>
export type InpatientPatientListResult = z.infer<typeof InpatientPatientListResultSchema>

export function normalizeInpatientPatientListResponse(payload: unknown): InpatientPatientListResult {
  if (payload && typeof payload === 'object' && 'result' in payload) {
    return InpatientPatientListResultSchema.parse((payload as { result: unknown }).result)
  }
  throw new Error('Invalid inpatient patient list response')
}
