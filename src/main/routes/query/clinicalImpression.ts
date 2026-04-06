import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'
import { BaseResultSchema } from '@main/utils/crud'
import { ClinicalImpressionSchema } from 'simrs-types'

export const requireSession = true

const ClinicalImpressionSchemaCompat = ClinicalImpressionSchema as unknown as z.ZodTypeAny

export const ClinicalImpressionSchemaPayload = ClinicalImpressionSchema.extend({
    id: z.string().optional().nullable(),
    status: z.string().default('in-progress'),
    subjectId: z.string().optional().nullable(),
    encounterId: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    summary: z.string().optional().nullable(),
    effectiveDateTime: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    effectivePeriodStart: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    effectivePeriodEnd: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    date: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    subject: z.any().optional().nullable(),
    encounter: z.any().optional().nullable(),
    assessor: z.any().optional().nullable(),
    code: z.any().optional().nullable(),
    problem: z.array(z.any()).optional().nullable(),
    investigation: z.array(z.any()).optional().nullable(),
    finding: z.array(z.any()).optional().nullable(),
    note: z.array(z.any()).optional().nullable(),
}).passthrough()

export const schemas = {
    getByEncounter: {
        args: z.object({
            encounterId: z.string()
        }),
        result: BaseResultSchema.extend({
            data: z.array(ClinicalImpressionSchemaCompat).optional().nullable(),
            total: z.number().optional()
        })
    },
    create: {
        args: ClinicalImpressionSchemaPayload,
        result: BaseResultSchema.extend({
            data: ClinicalImpressionSchemaCompat.optional().nullable()
        })
    },
    list: {
        args: z.object({
            subjectId: z.string().optional(),
            encounterId: z.string().optional(),
            status: z.string().optional(),
            limit: z.union([z.string(), z.number()]).optional(),
            offset: z.union([z.string(), z.number()]).optional()
        }).optional(),
        result: BaseResultSchema.extend({
            data: z.array(ClinicalImpressionSchemaCompat).optional().nullable(),
            total: z.number().optional()
        })
    },
    update: {
        args: ClinicalImpressionSchemaPayload.extend({
            id: z.string()
        }),
        result: BaseResultSchema.extend({
            data: ClinicalImpressionSchemaCompat.optional().nullable()
        })
    },
    deleteById: {
        args: z.object({
            id: z.string()
        }),
        result: BaseResultSchema
    },
    getById: {
        args: z.object({
            id: z.string()
        }),
        result: BaseResultSchema.extend({
            data: ClinicalImpressionSchemaCompat.optional().nullable()
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
        const res = await client.get(`/api/module/clinical-impression${params ? `?${params}` : ''}`)
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
