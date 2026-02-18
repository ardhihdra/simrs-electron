import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
    create: {
        args: z.object({
            encounterId: z.union([z.string(), z.number()]).optional(),
            subjectId: z.union([z.string(), z.number()]),
            questionnaire: z.string().optional(),
            status: z.string().optional(),
            authored: z.any().optional(),
            authorId: z.union([z.string(), z.number(), z.null()]).optional(),
            sourceId: z.union([z.string(), z.number(), z.null()]).optional(),
            items: z.array(z.any())
        }),
        result: z.object({
            success: z.boolean(),
            result: z.any().optional(),
            message: z.string().optional()
        })
    },
    getByEncounter: {
        args: z.object({
            encounterId: z.string()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.any().optional(),
            message: z.string().optional()
        })
    },
    list: {
        args: z.any().optional(),
        result: z.object({
            success: z.boolean(),
            result: z.array(z.any()).optional(),
            message: z.string().optional(),
            pagination: z.any().optional()
        })
    }
} as const

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        console.log("IPC [questionnaireResponse:create] Payload:", JSON.stringify(args, null, 2))
        const client = getClient(ctx)
        const res = await client.post('/api/questionnaireresponse', args)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        console.log("IPC [questionnaireResponse:create] Response:", JSON.stringify(raw, null, 2))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/questionnaireresponse?encounterId=${args.encounterId}`)
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
        const res = await client.get(`/api/questionnaireresponse?${params}`)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
