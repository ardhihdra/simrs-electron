import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'

export const requireSession = true

const CarePlanActivitySchema = z.object({
    kind: z.string().optional(),
    code: z.string().optional(),
    codeDisplay: z.string().optional(),
    codeSystem: z.string().optional(),
    status: z.string(),
    description: z.string().optional(),
    scheduledPeriodStart: z.string().optional(),
    scheduledPeriodEnd: z.string().optional(),
    performerId: z.string().optional(),
    performerName: z.string().optional(),
})

const CarePlanNoteSchema = z.object({
    authorId: z.string().optional(),
    authorName: z.string().optional(),
    time: z.string().optional(),
    text: z.string(),
})

const CarePlanCategorySchema = z.object({
    code: z.string().optional(),
    display: z.string().optional(),
    system: z.string().optional(),
    text: z.string().optional(),
})

const CarePlanAddressSchema = z.object({
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
    display: z.string().optional(),
})

const CarePlanGoalSchema = z.object({
    goalId: z.string().optional(),
    display: z.string().optional(),
})

const CarePlanSchema = z.object({
    id: z.string().optional(),
    encounterId: z.string().optional(),
    subjectId: z.string().optional(),
    status: z.string().optional(),
    intent: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    created: z.string().optional(),
    authorId: z.string().optional(),
    authorType: z.string().optional(),
    activities: z.array(CarePlanActivitySchema).optional(),
    notes: z.array(CarePlanNoteSchema).optional(),
    categories: z.array(CarePlanCategorySchema).optional(),
    addresses: z.array(CarePlanAddressSchema).optional(),
    goals: z.array(CarePlanGoalSchema).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
}).passthrough()

export const schemas = {
    getByEncounter: {
        args: z.object({ encounterId: z.string() }),
        result: z.object({
            success: z.boolean(),
            result: z.array(CarePlanSchema).optional(),
            message: z.string().optional(),
        }),
    },
    create: {
        args: z.object({
            encounterId: z.string(),
            patientId: z.string(),
            performerId: z.union([z.number(), z.string(), z.null()]).optional(),
            performerName: z.string().optional(),
            status: z.string(),
            intent: z.string(),
            title: z.string().optional(),
            description: z.string().optional(),
            periodStart: z.string().optional(),
            periodEnd: z.string().optional(),
            activities: z.array(CarePlanActivitySchema).optional(),
            notes: z.array(CarePlanNoteSchema).optional(),
            categories: z.array(CarePlanCategorySchema).optional(),
            addresses: z.array(CarePlanAddressSchema).optional(),
            goals: z.array(CarePlanGoalSchema).optional(),
        }),
        result: z.object({
            success: z.boolean(),
            result: CarePlanSchema.optional(),
            message: z.string().optional(),
        }),
    },
    deleteById: {
        args: z.object({ id: z.string() }),
        result: z.object({
            success: z.boolean(),
            message: z.string().optional(),
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
