import z from 'zod'

export const SuplierSchema = z.object({
  nama: z.string().min(1),
  kode: z.string().min(1),
  noHp: z.string().min(1),
  alamat: z.string().nullable().optional(),
  note: z.string().nullable().optional()
})

export const SuplierWithIdSchema = SuplierSchema.extend({
  id: z.number(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional()
})

