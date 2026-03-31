import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'
import {
    GoalSchema,
    GoalTargetSchema,
    GoalNoteSchema,
    GoalCategorySchema,
    GoalAddressSchema
} from 'simrs-types'

export const requireSession = true
const GoalSchemaCompat = GoalSchema as unknown as z.ZodTypeAny

export const GoalSchemaPayload = GoalSchema.extend({
    id: z.string().optional().nullable(),
    encounterId: z.string(),
    subjectId: z.string().optional().nullable(),
    lifecycleStatus: z.string(),
    description: z.string(),
    priority: z.string().optional().nullable(),
    startDate: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    statusDate: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    statusReason: z.string().optional().nullable(),
    patientId: z.string(),
    performerId: z.union([z.number(), z.string(), z.null()]).optional(),
    performerName: z.string().optional().nullable(),
    targets: z.array(GoalTargetSchema).optional().nullable(),
    notes: z.array(GoalNoteSchema).optional().nullable(),
    categories: z.array(GoalCategorySchema).optional().nullable(),
    addresses: z.array(GoalAddressSchema).optional().nullable(),
})

export const schemas = {
    getByEncounter: {
        args: z.object({
            encounterId: z.string()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(GoalSchemaCompat).optional().nullable(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    },
    create: {
        args: GoalSchemaPayload,
        result: z.object({
            success: z.boolean(),
            result: GoalSchemaCompat.optional().nullable(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    },
    deleteById: {
        args: z.object({
            id: z.string()
        }),
        result: z.object({
            success: z.boolean(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    }
} as const

export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/module/goal/${args.encounterId}`)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.post('/api/module/goal', args)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.delete(`/api/module/goal/${args.id}`)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
