import z from 'zod'

export const UnitSchema = z.object({
  nama: z.string().min(1),
  kode: z.string().min(1)
})

export const UnitWithIdSchema = UnitSchema.extend({
  id: z.number(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional()
})

