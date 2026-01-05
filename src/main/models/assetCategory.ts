import z from 'zod'

export const AssetCategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['MEDICAL', 'NON_MEDICAL']),
  requiresCalibration: z.boolean(),
  depreciationYears: z.number().int().optional().nullable()
})

export const AssetCategorySchemaWithId = AssetCategorySchema.extend({
  id: z.number(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  deletedAt: z.string().optional().nullable()
})

