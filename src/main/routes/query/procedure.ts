import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'

export const requireSession = true

const ProcedureCodeCodingSchema = z.object({
    procedureCodeId: z.number(),
    isPrimary: z.boolean().optional(),
    procedureCode: z.object({
        code: z.string(),
        name: z.string().optional(),
        display: z.string().optional(),
        system: z.string().optional()
    }).optional()
})

const ProcedureNoteSchema = z.object({
    text: z.string(),
    time: z.union([z.string(), z.date()]).optional()
})

const ProcedurePerformerSchema = z.object({
    actorReference: z.string(),
    actorType: z.string()
})

const ProcedureSchema = z.object({
    id: z.string().optional(),
    status: z.string().optional(),
    subjectPatientId: z.string(),
    encounterId: z.string(),
    performedDateTime: z.union([z.string(), z.date()]).optional(),
    recorderId: z.number().optional(),
    codeCoding: z.array(ProcedureCodeCodingSchema).optional(),
    notes: z.array(ProcedureNoteSchema).optional(),
    performers: z.array(ProcedurePerformerSchema).optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional()
})

const BulkCreateProcedureInputSchema = z.object({
    procedureCodeId: z.number().optional(),
    notes: z.string().optional(),
    performedAt: z.union([z.string(), z.date()]).optional()
})

const BackendProcedureResponseSchema = z.object({
    success: z.boolean(),
    result: z.array(ProcedureSchema).optional().nullable(),
    message: z.string().optional(),
    error: z.string().optional()
})

export const schemas = {
    bulkCreate: {
        args: z.object({
            encounterId: z.string(),
            patientId: z.string(),
            doctorId: z.number(),
            procedures: z.array(BulkCreateProcedureInputSchema)
        }),
        result: BackendProcedureResponseSchema
    },
    getByEncounter: {
        args: z.object({
            encounterId: z.string()
        }),
        result: BackendProcedureResponseSchema
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

        const res = await client.post('/api/module/procedure', payload)
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
        const res = await client.get(`/api/module/procedure/${args.encounterId}`)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))

        if (!raw || typeof raw !== 'object') {
            return { success: false as const, error: 'Invalid response format' }
        }

        if (!res.ok || raw.success === false) {
            return {
                success: false as const,
                error: raw.error || raw.message || 'Unknown backend error'
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
