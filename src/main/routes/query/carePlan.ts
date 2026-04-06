import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'
import {
    CarePlanSchema,
    CarePlanActivitySchema,
    CarePlanNoteSchema,
    CarePlanCategorySchema,
    CarePlanAddressSchema,
    CarePlanGoalSchema
} from 'simrs-types'

export const requireSession = true

const CarePlanSchemaCompat = CarePlanSchema as unknown as z.ZodTypeAny

export const CarePlanSchemaPayload = CarePlanSchema.extend({
    id: z.string().optional().nullable(),
    encounterId: z.string(),
    subjectId: z.string().optional().nullable(),
    status: z.string(),
    intent: z.string(),
    title: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    periodStart: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    periodEnd: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    created: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    authorId: z.string().optional().nullable(),
    authorType: z.string().optional().nullable(),
    activities: z.array(CarePlanActivitySchema).optional().nullable(),
    notes: z.array(CarePlanNoteSchema).optional().nullable(),
    categories: z.array(CarePlanCategorySchema).optional().nullable(),
    addresses: z.array(CarePlanAddressSchema).optional().nullable(),
    goals: z.array(CarePlanGoalSchema).optional().nullable(),
    patientId: z.string(),
    performerId: z.union([z.number(), z.string(), z.null()]).optional(),
    performerName: z.string().optional().nullable(),
})

export const schemas = {
    getByEncounter: {
        args: z.object({ encounterId: z.string() }),
        result: z.object({
            success: z.boolean(),
            result: z.array(CarePlanSchemaCompat).optional().nullable(),
            message: z.string().optional(),
            error: z.string().optional(),
        }),
    },
    create: {
        args: CarePlanSchemaPayload,
        result: z.object({
            success: z.boolean(),
            result: CarePlanSchemaCompat.optional().nullable(),
            message: z.string().optional(),
            error: z.string().optional(),
        }),
    },
    deleteById: {
        args: z.object({ id: z.string() }),
        result: z.object({
            success: z.boolean(),
            message: z.string().optional(),
            error: z.string().optional(),
        }),
    },
} as const

export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/module/care-plan/${args.encounterId}`)
        return await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.post('/api/module/care-plan', args)
        return await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.delete(`/api/module/care-plan/${args.id}`)
        return await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
}
