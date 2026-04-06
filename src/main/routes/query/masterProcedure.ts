import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
    parseBackendResponse,
    BackendListSchema,
    getClient
} from '@main/utils/backendClient'
import { MasterProcedureSchema } from 'simrs-types'

export const requireSession = true
const MasterProcedureSchemaCompat = MasterProcedureSchema as unknown as z.ZodTypeAny

export const schemas = {
    list: {
        args: z.object({
            page: z.number().optional(),
            items: z.number().optional(),
            q: z.string().optional(),
            search: z.string().optional(),
            code: z.string().optional(),
            status: z.string().optional()
        }).optional(),
        result: z.any()
    },
    getById: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: MasterProcedureSchemaCompat.optional(),
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
        if (args?.q) params.append('q', args.q)
        if (args?.search) params.append('q', args.search) // Map search to q
        if (args?.code) params.append('code', args.code)
        if (args?.status) params.append('status', args.status)

        const queryString = params.toString()
        const url = `/api/masterprocedure${queryString ? `?${queryString}` : ''}`

        const res = await client.get(url)

        const ListSchema = BackendListSchema(MasterProcedureSchemaCompat)
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
        const res = await client.get(`/api/masterprocedure/${args.id}`)

        const BackendReadSchema = z.object({
            success: z.boolean(),
            result: MasterProcedureSchemaCompat.optional().nullable(),
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
