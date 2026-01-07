import z from 'zod'

export const MedicineBrandSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional()
})

export const MedicineBrandWithIdSchema = MedicineBrandSchema.extend({
  id: z.number(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional()
})

