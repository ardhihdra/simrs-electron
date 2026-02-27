import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'


export const requireSession = true

const ConditionCategorySchema = z.object({
    code: z.string().optional(),
    display: z.string().optional(),
    system: z.string().optional()
})

const ConditionCodeCodingSchema = z.object({
    diagnosisCodeId: z.number(),
    isPrimary: z.boolean().optional(),
    diagnosisCode: z.object({
        code: z.string(),
        display: z.string(),
        system: z.string()
    }).optional()
})

const ConditionSchema = z.object({
    id: z.string().optional(),
    clinicalStatus: z.string().optional(),
    verificationStatus: z.string().optional(),
    subjectId: z.string(),
    encounterId: z.string().optional(),
    recordedDate: z.union([z.string(), z.date()]).optional(),
    recorder: z.number().optional(),
    note: z.string().optional().nullable(),
    categories: z.array(ConditionCategorySchema).optional(),
    codeCoding: z.array(ConditionCodeCodingSchema).optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional()
})

const BulkCreateConditionInputSchema = z.object({
    diagnosisCodeId: z.number().optional(),
    isPrimary: z.boolean().optional(),
    category: z.string().optional(),
    notes: z.string().optional(),
    recordedDate: z.union([z.string(), z.date()]).optional()
})

const BackendConditionResponseSchema = z.object({
    success: z.boolean(),
    result: z.array(ConditionSchema).optional().nullable(),
    message: z.string().optional(),
    error: z.string().optional()
})

export const schemas = {
    create: {
        args: z.object({
            encounterId: z.string(),
            patientId: z.string(),
            doctorId: z.number(),
            conditions: z.array(BulkCreateConditionInputSchema)
        }),
        result: BackendConditionResponseSchema
    },
    getByEncounter: {
        args: z.object({
            encounterId: z.string()
        }),
        result: BackendConditionResponseSchema
    }
} as const

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = getClient(ctx)
        const payload = {
            encounterId: args.encounterId,
            patientId: args.patientId,
            doctorId: args.doctorId,
            conditions: args.conditions
        }

        const res = await client.post('/api/module/condition', payload)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))

        if (!res.ok || !raw.success) {
            return {
                success: false as const,
                error: raw.error || raw.message || `HTTP ${res.status}`
            }
        }

        return {
            success: true as const,
            result: raw.result,
            message: raw.message
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false as const, error: msg }
    }
}

export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/module/condition/${args.encounterId}`)

        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))

        if (!raw || typeof raw !== 'object') {
            return { success: false, error: 'Invalid response format' }
        }

        if (raw.success === false) {
            return {
                success: false,
                error: raw.error || raw.message || 'Unknown backend error'
            }
        }

        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
