import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
    parseBackendResponse,
    getClient
} from '@main/utils/backendClient'

export const requireSession = true

const ProcedureSchema = z.object({
    id: z.number().optional(),
    status: z.string().optional(),
    subjectPatientId: z.string(),
    encounterId: z.string(),
    performedDateTime: z.union([z.string(), z.date()]).optional(),
    recorderId: z.number().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional()
})

const BulkCreateProcedureInputSchema = z.object({
    procedureCodeId: z.number(),
    notes: z.string().optional(),
    performedAt: z.string().optional()
})

export const schemas = {
    bulkCreate: {
        args: z.object({
            encounterId: z.string(),
            patientId: z.string(),
            doctorId: z.number(),
            procedures: z.array(BulkCreateProcedureInputSchema)
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(ProcedureSchema).optional(),
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

export const bulkCreate = async (ctx: IpcContext, args: z.infer<typeof schemas.bulkCreate.args>) => {
    try {
        const client = getClient(ctx)
        const payload = {
            encounterId: args.encounterId,
            patientId: args.patientId,
            doctorId: args.doctorId,
            procedures: args.procedures
        }

        const res = await client.post('/api/procedure/bulk-create', payload)

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
        const res = await client.get(`/api/procedure/by-encounter/${args.encounterId}`)

        // Manual extraction to ensure robust handling
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

        // Return raw response directly
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
