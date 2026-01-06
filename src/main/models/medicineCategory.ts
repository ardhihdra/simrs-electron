import z from 'zod'

export const MedicineCategorySchema = z.object({
  name: z.string().min(1),
  status: z.boolean().optional()
})

export const MedicineCategoryWithIdSchema = MedicineCategorySchema.extend({
  id: z.number(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional()
})

