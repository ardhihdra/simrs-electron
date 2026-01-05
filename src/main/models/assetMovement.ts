import z from 'zod'

export const AssetMovementSchema = z.object({
  assetId: z.number(),
  fromLocationId: z.number().optional().nullable(),
  toLocationId: z.number(),
  movedAt: z.string(),
  reason: z.string().optional().nullable(),
  approvedBy: z.number().optional().nullable()
})

export const AssetMovementSchemaWithId = AssetMovementSchema.extend({
  id: z.number(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  deletedAt: z.string().optional().nullable()
})

