import z from 'zod'

export const RoomSchema = z.object({
  roomCodeId: z.string().min(1),
  roomClassCodeId: z.string().min(1),
  organizationId: z.string().nullable().optional(),
  floor: z.string().nullable().optional(),
  capacity: z.number().optional(),
  statusCodeId: z.string().nullable().optional(),
  isActive: z.boolean().optional()
})

export const RoomWithIdSchema = RoomSchema.extend({
  id: z.string(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional()
})
