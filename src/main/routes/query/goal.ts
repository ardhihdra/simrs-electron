import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'

export const requireSession = true

const GoalTargetSchema = z.object({
    measureCode: z.string().nullish(),
    measureDisplay: z.string().nullish(),
    measureSystem: z.string().nullish(),
    detailQuantityValue: z.number().nullish(),
    detailQuantityUnit: z.string().nullish(),
    detailQuantityCode: z.string().nullish(),
    detailQuantitySystem: z.string().nullish(),
    detailString: z.string().nullish(),
    detailBoolean: z.boolean().nullish(),
    dueDate: z.string().nullish(),
})

const GoalNoteSchema = z.object({
    authorId: z.string().nullish(),
    authorName: z.string().nullish(),
    time: z.string().nullish(),
    text: z.string(),
})

const GoalCategorySchema = z.object({
    code: z.string().nullish(),
    display: z.string().nullish(),
    system: z.string().nullish(),
    text: z.string().nullish(),
})

const GoalAddressSchema = z.object({
    referenceType: z.string().nullish(),
    referenceId: z.string().nullish(),
    display: z.string().nullish(),
})

const GoalSchema = z.object({
    id: z.string().nullish(),
    encounterId: z.string().nullish(),
    subjectId: z.string().nullish(),
    lifecycleStatus: z.string().nullish(),
    description: z.any().nullish(),
    achievementStatus: z.any().nullish(),
    priority: z.any().nullish(),
    startDate: z.string().nullish(),
    statusDate: z.string().nullish(),
    statusReason: z.string().nullish(),
    expressedByType: z.string().nullish(),
    expressedById: z.string().nullish(),
    targets: z.array(GoalTargetSchema).nullish(),
    notes: z.array(GoalNoteSchema).nullish(),
    categories: z.array(GoalCategorySchema).nullish(),
    addresses: z.array(GoalAddressSchema).nullish(),
    createdAt: z.string().nullish(),
    updatedAt: z.string().nullish(),
}).passthrough()

export const schemas = {
    getByEncounter: {
        args: z.object({
            encounterId: z.string()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(GoalSchema).optional(),
            message: z.string().optional()
        })
    },
    create: {
        args: z.object({
            encounterId: z.string(),
            patientId: z.string(),
            performerId: z.union([z.number(), z.string(), z.null()]).optional(),
            performerName: z.string().optional(),
            lifecycleStatus: z.string(),
            description: z.string(),
            priority: z.string().optional(),
            startDate: z.string().optional(),
            statusDate: z.string().optional(),
            statusReason: z.string().optional(),
            targets: z.array(GoalTargetSchema).optional(),
            notes: z.array(GoalNoteSchema).optional(),
            categories: z.array(GoalCategorySchema).optional(),
            addresses: z.array(GoalAddressSchema).optional(),
        }),
        result: z.object({
            success: z.boolean(),
            result: GoalSchema.optional(),
            message: z.string().optional()
        })
    },
    deleteById: {
        args: z.object({
            id: z.string()
        }),
        result: z.object({
            success: z.boolean(),
            message: z.string().optional()
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
