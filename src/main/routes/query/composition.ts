import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
    getClient,
    parseBackendResponse
} from '@main/utils/backendClient'
import {
    CompositionCreateInputSchema,
    CompositionGetByEncounterInputSchema,
    CompositionListResponseSchema,
    CompositionResponseSchema,
    CompositionSchema
} from 'simrs-types'
export const requireSession = true

export const schemas = {
    create: {
        args: CompositionCreateInputSchema,
        result: z.object({
            success: z.boolean(),
            result: CompositionSchema.optional().nullable(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    },
    getByEncounter: {
        args: CompositionGetByEncounterInputSchema,
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
        const result = await parseBackendResponse(res, CompositionResponseSchema)
        return { success: true, result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, message: msg, error: msg }
    }
}

export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/module/composition/${args.encounterId}`)
        const result = await parseBackendResponse(res, CompositionListResponseSchema)
        return { success: true, result: result ?? [] }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, message: msg, error: msg }
    }
}
