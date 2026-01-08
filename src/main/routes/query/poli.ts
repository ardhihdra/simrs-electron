import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
    getClient,
    parseBackendResponse,
    BackendListSchema
} from '@main/utils/backendClient'

export const requireSession = true

const PoliSchema = z.object({
    id: z.string().or(z.number()),
    name: z.string().optional(),
    label: z.string().optional()
}).passthrough()

export const schemas = {
    list: {
        result: z.object({
            success: z.boolean(),
            data: z.array(PoliSchema).optional(),
            error: z.string().optional()
        })
    }
} as const

export const list = async (ctx: IpcContext) => {
    try {
        const client = getClient(ctx)
        // The user specifically asked for /api/poli
        const res = await client.get('/api/poli')

        // Use a loose schema for the list to accommodate potential variations
        const ListSchema = BackendListSchema(PoliSchema)

        const result = await parseBackendResponse(res, ListSchema)
        return { success: true, data: result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
