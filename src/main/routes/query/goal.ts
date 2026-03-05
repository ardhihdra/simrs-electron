import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'

export const requireSession = true

const GoalTargetSchema = z.object({
    measureCode: z.string().optional(),
    measureDisplay: z.string().optional(),
    measureSystem: z.string().optional(),
    detailQuantityValue: z.number().optional(),
    detailQuantityUnit: z.string().optional(),
    detailQuantityCode: z.string().optional(),
    detailQuantitySystem: z.string().optional(),
    detailString: z.string().optional(),
    detailBoolean: z.boolean().optional(),
    dueDate: z.string().optional(),
})

const GoalNoteSchema = z.object({
    authorId: z.string().optional(),
    authorName: z.string().optional(),
    time: z.string().optional(),
    text: z.string(),
})

const GoalCategorySchema = z.object({
    code: z.string().optional(),
    display: z.string().optional(),
    system: z.string().optional(),
    text: z.string().optional(),
})

const GoalAddressSchema = z.object({
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
    display: z.string().optional(),
})

const GoalSchema = z.object({
    id: z.string().optional(),
    encounterId: z.string().optional(),
    subjectId: z.string().optional(),
    lifecycleStatus: z.string().optional(),
    description: z.any().optional(),
    achievementStatus: z.any().optional(),
    priority: z.any().optional(),
    startDate: z.string().optional(),
    statusDate: z.string().optional(),
    statusReason: z.string().optional(),
    expressedByType: z.string().optional(),
    expressedById: z.string().optional(),
    targets: z.array(GoalTargetSchema).optional(),
    notes: z.array(GoalNoteSchema).optional(),
    categories: z.array(GoalCategorySchema).optional(),
    addresses: z.array(GoalAddressSchema).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
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
