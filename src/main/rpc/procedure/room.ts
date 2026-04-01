import { ApiResponseSchema, BedStatusDomainSchema, RoomTransferInputSchema, RoomAvailableInputSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

// --- Schemas are now in simrs-types ---
export type RoomTransferInput = z.infer<typeof RoomTransferInputSchema>
export type RoomAvailableInput = z.infer<typeof RoomAvailableInputSchema>

export const roomRpc = {
  // transfer: POST /module/room/transfer
  transfer: t
    .input(RoomTransferInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/room/transfer', input)
      return await data.json()
    }),

  // available: GET /module/room/available
  available: t
    .input(RoomAvailableInputSchema)
    .output(ApiResponseSchema(BedStatusDomainSchema.array().optional()))
    .query(async ({ client }) => {
      const data = await client.get('/api/module/room/available/listAll')
      const res = await data.json()
      return res
    })
}
