import {
  ApiResponseSchema,
  BedStatusDomainSchema,
  RoomSchema,
  RoomTransferInputSchema,
  RoomAvailableInputSchema
} from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

// --- Schemas are now in simrs-types ---
export type RoomTransferInput = z.infer<typeof RoomTransferInputSchema>
export type RoomAvailableInput = z.infer<typeof RoomAvailableInputSchema>

const RoomAssignInputSchema = z.object({
  encounterId: z.string().min(1),
  roomCodeId: z.string().min(1),
  bedCodeId: z.string().min(1),
  classOfCareCodeId: z.string().min(1),
  assignedBy: z.string().optional(),
  reason: z.string().optional()
})

const RoomReleaseInputSchema = z.object({
  accommodationAssignmentId: z.string().min(1),
  releasedBy: z.string().optional()
})

const CreateBedInputSchema = z.object({
  bedCodeId: z.string().min(1),
  roomId: z.string().min(1)
})

export const roomRpc = {
  assign: t
    .input(RoomAssignInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/room/assign', input)
      return await data.json()
    }),

  release: t
    .input(RoomReleaseInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/room/release', input)
      return await data.json()
    }),

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
    }),

  rooms: t
    .input(z.object({}).default({}))
    .output(ApiResponseSchema(RoomSchema.array().optional()))
    .query(async ({ client }) => {
      const data = await client.get('/api/module/room/rooms/listAll')
      return await data.json()
    }),

  createBed: t
    .input(CreateBedInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/room/beds', input)
      return await data.json()
    })
}
