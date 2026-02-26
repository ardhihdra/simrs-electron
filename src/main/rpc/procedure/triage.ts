import { ApiResponseSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

const ObservationSchema = z.object({
  code: z.string(),
  valueQuantity: z.number(),
  valueUnit: z.string(),
  effectiveDateTime: z.string()
})

export const TriageRecordSchema = z.object({
  encounterId: z.string().uuid(),
  patientId: z.string().uuid(),
  practitionerId: z.number(),
  queueTicketId: z.string().optional(),
  observations: z.array(ObservationSchema),
  consciousness: z.string(),
  notes: z.string().optional()
})
export type TriageRecordInput = z.infer<typeof TriageRecordSchema>

export const triageRpc = {
  recordTriage: t
    .input(TriageRecordSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      // Calls the new Initial Triage endpoint
      // Route: POST /api/module/initial-triage/encounters/:encounterId/triage
      const res = await client.post(`/api/module/initial-triage/encounters/${input.encounterId}/triage`, input)
      return await res.json()
    })
}
