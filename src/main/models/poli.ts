import z from 'zod'

export const PoliSchemaWithId = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    createdBy: z.number().nullable().optional(),
    updatedBy: z.number().nullable().optional(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    deleted_at: z.string().nullable().optional(),
    deletedBy: z.number().nullable().optional()
})

export const PoliSchema = z.object({
    name: z.string(),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    createdBy: z.number().nullable().optional(),
    updatedBy: z.number().nullable().optional()
})
