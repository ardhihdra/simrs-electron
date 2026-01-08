import z from 'zod'

export const RawMaterialCategorySchema = z.object({
  name: z.string().min(1),
  status: z.boolean().optional()
})

export const RawMaterialCategoryWithIdSchema = RawMaterialCategorySchema.extend({
  id: z.number(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional()
})

