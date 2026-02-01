import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
    parseBackendResponse,
    getClient
} from '@main/utils/backendClient'

export const requireSession = true



const ConditionSchema = z.object({
    id: z.number().optional(),
    clinicalStatus: z.string().optional(),
    verificationStatus: z.string().optional(),
    subjectId: z.string(),
    encounterId: z.string().optional(),
    recordedDate: z.union([z.string(), z.date()]).optional(),
    recorder: z.number().optional(),
    note: z.string().optional().nullable(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional()
})

const BulkCreateConditionInputSchema = z.object({
    diagnosisCodeId: z.number().optional(),
    isPrimary: z.boolean().optional(),
    category: z.string().optional(),
    notes: z.string().optional()
})

export const schemas = {
    create: {
        args: z.object({
            encounterId: z.string(),
            patientId: z.string(),
            doctorId: z.number(),
            conditions: z.array(BulkCreateConditionInputSchema)
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(ConditionSchema).optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    },
    getByEncounter: {
        args: z.object({
            encounterId: z.string()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(z.any()).optional().nullable(),
            message: z.string().optional(),
            error: z.string().optional()
        })
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

        const res = await client.post('/api/condition', payload)

        const BackendCreateSchema = z.object({
            success: z.boolean(),
            result: z.array(z.any()).optional().nullable(),
            message: z.string().optional(),
            error: z.any().optional()
        })

        const result = await parseBackendResponse(res, BackendCreateSchema)
        return { success: true, result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/condition/read/${args.encounterId}`)

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
