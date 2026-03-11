import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'

export const requireSession = true

const ClinicalImpressionPropsSchema = z.object({
    id: z.string().nullish(),
    status: z.string().nullish(),
    subjectId: z.string().nullish(),
    encounterId: z.string().nullish(),
    description: z.string().nullish(),
    effectiveDateTime: z.string().nullish(),
    effectivePeriodStart: z.string().nullish(),
    effectivePeriodEnd: z.string().nullish(),
    date: z.string().nullish(),
    summary: z.string().nullish(),

    identifier: z.array(z.any()).nullish(),
    statusReason: z.any().nullish(),
    code: z.any().nullish(),
    assessor: z.any().nullish(),
    previousImpression: z.any().nullish(),

    problem: z.array(z.any()).nullish(),
    investigation: z.array(z.any()).nullish(),
    protocol: z.array(z.string()).nullish(),
    finding: z.array(z.any()).nullish(),
    prognosisCodeableConcept: z.array(z.any()).nullish(),
    prognosisReference: z.array(z.any()).nullish(),
    supportingInfo: z.array(z.any()).nullish(),
    note: z.array(z.any()).nullish(),
}).passthrough()

export const schemas = {
    getByEncounter: {
        args: z.object({
            encounterId: z.string()
        }),
        result: z.object({
            success: z.boolean(),
            data: z.array(ClinicalImpressionPropsSchema).optional(),
            message: z.string().optional(),
            total: z.number().optional()
        })
    },
    create: {
        args: z.object({
            encounterId: z.string().optional(),
            subjectId: z.string().optional(),
            subject: z.any().optional(),
            encounter: z.any().optional(),
            status: z.string().default('in-progress'),
            description: z.string().optional(),
            summary: z.string().optional(),
            effectiveDateTime: z.string().optional(),
            date: z.string().optional(),
            assessor: z.any().optional(),
            code: z.any().optional(),
            problem: z.array(z.any()).optional(),
            investigation: z.array(z.any()).optional(),
            finding: z.array(z.any()).optional(),
            note: z.array(z.any()).optional()
        }).passthrough(),
        result: z.object({
            success: z.boolean(),
            data: ClinicalImpressionPropsSchema.optional(),
            message: z.string().optional()
        })
    },
    list: {
        args: z.any().optional(),
        result: z.object({
            success: z.boolean(),
            data: z.array(ClinicalImpressionPropsSchema).optional(),
            message: z.string().optional(),
            total: z.number().optional()
        })
    },
    update: {
        args: z.any(),
        result: z.object({
            success: z.boolean(),
            data: ClinicalImpressionPropsSchema.optional(),
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
    },
    getById: {
        args: z.object({
            id: z.string()
        }),
        result: z.object({
            success: z.boolean(),
            data: ClinicalImpressionPropsSchema.optional(),
            message: z.string().optional()
        })
    }
} as const

// Helper to standardise responses matching Observation
export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
    try {
        const client = getClient(ctx)
        // The backend uses ?encounterId= list filtering
        const res = await client.get(`/api/module/clinical-impression?encounterId=${args.encounterId}`)
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
        const res = await client.post('/api/module/clinical-impression', args)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const list = async (ctx: IpcContext, args: z.infer<typeof schemas.list.args>) => {
    try {
        const client = getClient(ctx)
        const params = new URLSearchParams(args as any).toString()
        const res = await client.get(`/api/module/clinical-impression?${params}`)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
    try {
        const client = getClient(ctx)
        const { id, ...rest } = args
        const res = await client.put(`/api/module/clinical-impression/${id}`, rest)
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
        const { id } = args
        const res = await client.delete(`/api/module/clinical-impression/${id}`)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/module/clinical-impression/${args.id}`)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
