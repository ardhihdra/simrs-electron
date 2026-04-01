import { ApiResponseSchema, TriageRecordSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

// --- Schemas are now in simrs-types ---
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
