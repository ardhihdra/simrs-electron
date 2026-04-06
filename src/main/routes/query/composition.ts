import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
    getClient
} from '@main/utils/backendClient'
import { CompositionSchema } from 'simrs-types'
export const requireSession = true

const CompositionResultSchema = CompositionSchema.extend({
    authorId: z.any().optional().nullable(),
    section: z.any().optional().nullable(),
    author: z.any().optional().nullable(),
    attesters: z.any().optional().nullable(),
    type: z.any().optional().nullable(),
    types: z.any().optional().nullable(),
    category: z.any().optional().nullable(),
    categories: z.any().optional().nullable(),
}).passthrough()

export const CompositionSchemaPayload = CompositionSchema.extend({
    id: z.union([z.string(), z.number()]).optional().nullable(),
    date: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    createdAt: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    updatedAt: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    section: z.any().optional().nullable(),
    type: z.any().optional().nullable(),
    category: z.any().optional().nullable(),
    custodian: z.any().optional().nullable(),
})

export const schemas = {
    create: {
        args: CompositionSchemaPayload.extend({
            encounterId: z.string(),
            patientId: z.string(),
            doctorId: z.union([z.number(), z.string()]),
        }),
        result: z.object({
            success: z.boolean(),
            result: CompositionResultSchema.optional().nullable(),
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
            result: z.array(CompositionResultSchema).optional().nullable(),
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
            authorName: args.authorName,
            title: args.title,
            soapSubjective: args.soapSubjective,
            soapObjective: args.soapObjective,
            soapAssessment: args.soapAssessment,
            soapPlan: args.soapPlan,
            status: args.status,
            section: args.section,
            custodian: args.custodian,
            type: args.type,
            category: args.category
        }

        const res = await client.post('/api/module/composition', payload)

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
        const res = await client.get(`/api/module/composition/${args.encounterId}`)

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
