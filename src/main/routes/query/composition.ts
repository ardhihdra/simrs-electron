import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
    getClient
} from '@main/utils/backendClient'

export const requireSession = true

const CompositionSchema = z.object({
    id: z.number().optional(),
    identifier: z.string().optional(),
    status: z.string(),
    subjectPatientId: z.string(),
    encounterId: z.string(),
    date: z.union([z.string(), z.date()]),
    authorId: z.array(z.string()),
    title: z.string(),
    soapSubjective: z.string().nullable().optional(),
    soapObjective: z.string().nullable().optional(),
    soapAssessment: z.string().nullable().optional(),
    soapPlan: z.string().nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional()
})

export const schemas = {
    create: {
        args: z.object({
            id: z.number().optional(),
            encounterId: z.string(),
            patientId: z.string(),
            doctorId: z.number(),
            title: z.string().optional(),
            soapSubjective: z.string().optional(),
            soapObjective: z.string().optional(),
            soapAssessment: z.string().optional(),
            soapPlan: z.string().optional(),
            status: z.string().optional()
        }),
        result: z.object({
            success: z.boolean(),
            result: CompositionSchema.optional().nullable(),
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
            result: z.array(CompositionSchema).optional().nullable(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    }
} as const

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = getClient(ctx)
        const payload = {
            id: args.id,
            encounterId: args.encounterId,
            patientId: args.patientId,
            doctorId: args.doctorId,
            title: args.title,
            soapSubjective: args.soapSubjective,
            soapObjective: args.soapObjective,
            soapAssessment: args.soapAssessment,
            soapPlan: args.soapPlan,
            status: args.status
        }

        const res = await client.post('/api/composition', payload)

        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))

        if (!raw || typeof raw !== 'object' || raw.success === false) {
            return { success: false, error: raw?.error || raw?.message || 'Unknown backend error' }
        }

        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/composition/read/${args.encounterId}`)

        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))

        if (!raw || typeof raw !== 'object' || raw.success === false) {
            return { success: false, error: raw?.error || raw?.message || 'Unknown backend error' }
        }

        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
