import { ApiResponseSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

const ObservationSchema = z.object({
  code: z.string(),
  valueQuantity: z.number(),
  valueUnit: z.string(),
  effectiveDateTime: z.string()
})

const TriageRecordSchema = z.object({
  encounterId: z.string().uuid(),
  practitionerId: z.number(),
  queueTicketId: z.string().optional(),
  observations: z.array(ObservationSchema),
  consciousness: z.string(),
  notes: z.string().optional()
})

export const triageRpc = {
  recordTriage: t
    .input(TriageRecordSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const res = await client.post('/api/module/triage/record-triage-observation', input)
      return await res.json()
    })
}
