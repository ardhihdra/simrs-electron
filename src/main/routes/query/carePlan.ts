import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'

export const requireSession = true

const CarePlanActivitySchema = z.object({
    kind: z.string().nullish(),
    code: z.string().nullish(),
    codeDisplay: z.string().nullish(),
    codeSystem: z.string().nullish(),
    status: z.string(),
    description: z.string().nullish(),
    scheduledPeriodStart: z.string().nullish(),
    scheduledPeriodEnd: z.string().nullish(),
    performerId: z.string().nullish(),
    performerName: z.string().nullish(),
})

const CarePlanNoteSchema = z.object({
    authorId: z.string().nullish(),
    authorName: z.string().nullish(),
    time: z.string().nullish(),
    text: z.string(),
})

const CarePlanCategorySchema = z.object({
    code: z.string().nullish(),
    display: z.string().nullish(),
    system: z.string().nullish(),
    text: z.string().nullish(),
})

const CarePlanAddressSchema = z.object({
    referenceType: z.string().nullish(),
    referenceId: z.string().nullish(),
    display: z.string().nullish(),
})

const CarePlanGoalSchema = z.object({
    goalId: z.string().nullish(),
    display: z.string().nullish(),
})

const CarePlanSchema = z.object({
    id: z.string().nullish(),
    encounterId: z.string().nullish(),
    subjectId: z.string().nullish(),
    status: z.string().nullish(),
    intent: z.string().nullish(),
    title: z.string().nullish(),
    description: z.string().nullish(),
    periodStart: z.string().nullish(),
    periodEnd: z.string().nullish(),
    created: z.string().nullish(),
    authorId: z.string().nullish(),
    authorType: z.string().nullish(),
    activities: z.array(CarePlanActivitySchema).nullish(),
    notes: z.array(CarePlanNoteSchema).nullish(),
    categories: z.array(CarePlanCategorySchema).nullish(),
    addresses: z.array(CarePlanAddressSchema).nullish(),
    goals: z.array(CarePlanGoalSchema).nullish(),
    createdAt: z.string().nullish(),
    updatedAt: z.string().nullish(),
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
