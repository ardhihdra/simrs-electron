import z from 'zod'

export const AssetMasterSchema = z.object({
  categoryId: z.number(),
  name: z.string().min(1),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  spec: z.string().optional().nullable()
})

export const AssetMasterSchemaWithId = AssetMasterSchema.extend({
  id: z.number(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  deletedAt: z.string().optional().nullable()
})

