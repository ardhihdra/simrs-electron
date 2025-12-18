import z from 'zod'

export const JaminanSchema = z.object({
    nama: z.string().min(1),
    kode: z.string().min(1),
    keterangan: z.string().nullable().optional(),
    status: z.enum(['active', 'inactive']).optional()
})

export const JaminanSchemaWithId = JaminanSchema.extend({
    id: z.number(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
    deletedAt: z.string().optional().nullable()
})
