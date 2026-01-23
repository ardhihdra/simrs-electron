import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
    parseBackendResponse,
    BackendListSchema,
    getClient
} from '@main/utils/backendClient'

export const requireSession = true

// DiagnosisCode schema
const DiagnosisCodeSchema = z.object({
    id: z.number(),
    system: z.string(),
    code: z.string(),
    url: z.string(),
    display: z.string(),
    idDisplay: z.string(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional()
})

export const schemas = {
    list: {
        args: z.object({
            page: z.number().optional(),
            items: z.number().optional(),
            search: z.string().optional(),
            code: z.string().optional()
        }).optional(),
        result: z.any()
    },
    getById: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: DiagnosisCodeSchema.optional(),
            error: z.string().optional()
        })
    }
} as const

export const list = async (ctx: IpcContext, args?: z.infer<typeof schemas.list.args>) => {
    try {
        const client = getClient(ctx)
        const params = new URLSearchParams()

        if (args?.page) params.append('page', args.page.toString())
        if (args?.items) params.append('items', args.items.toString())
        if (args?.search) params.append('search', args.search)
        if (args?.code) params.append('code', args.code)

        const queryString = params.toString()
        const url = `/api/diagnosiscode${queryString ? `?${queryString}` : ''}`

        const res = await client.get(url)

        const ListSchema = BackendListSchema(DiagnosisCodeSchema)
        const result = await parseBackendResponse(res, ListSchema)

        return { success: true, ...result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/diagnosiscode/${args.id}`)

        const BackendReadSchema = z.object({
            success: z.boolean(),
            result: DiagnosisCodeSchema.optional().nullable(),
            message: z.string().optional(),
            error: z.any().optional()
        })

        const result = await parseBackendResponse(res, BackendReadSchema)
        return { success: true, result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
