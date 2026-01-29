import { ApiResponseSchema, BedStatusDomainSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

export const RoomTransferInputSchema = z.object({
  encounterId: z.string(),
  newRoomCodeId: z.string(),
  newBedCodeId: z.string(),
  newClassOfCareCodeId: z.string(),
  transferReason: z.string(),
  currentAssignmentId: z.string().optional()
})
export type RoomTransferInput = z.infer<typeof RoomTransferInputSchema>

export const RoomAvailableInputSchema = z.object({ paginated: z.boolean().optional() })
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
