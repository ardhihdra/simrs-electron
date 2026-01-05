import z from 'zod'

export const AssetDepreciationSchema = z.object({
  assetId: z.number(),
  year: z.number().int(),
  bookValue: z.number(),
  depreciationValue: z.number()
})

export const AssetDepreciationSchemaWithId = AssetDepreciationSchema.extend({
  id: z.number(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  deletedAt: z.string().optional().nullable()
})

