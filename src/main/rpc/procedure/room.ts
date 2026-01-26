import { ApiResponseSchema, BedStatusDomainSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

export const roomRpc = {
  // transfer: POST /module/room/transfer
  transfer: t
    .input(
      z.object({
        encounterId: z.string(),
        newRoomCodeId: z.string(),
        newBedCodeId: z.string(),
        newClassOfCareCodeId: z.string(),
        transferReason: z.string(),
        currentAssignmentId: z.string().optional()
      })
    )
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/room/transfer', input)
      return await data.json()
    }),

  // available: GET /module/room/available
  available: t
    .input(z.object({ paginated: z.boolean().optional() }))
    .output(ApiResponseSchema(BedStatusDomainSchema.array().optional()))
    .query(async ({ client }) => {
      const data = await client.get('/api/module/room/available/listAll')
      const res = await data.json()
      return res
    })
}
