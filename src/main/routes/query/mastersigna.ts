import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
    listAll: {
        result: z.object({
            success: z.boolean(),
            result: z.array(z.any()).optional(),
            message: z.string().optional()
        })
    },
    list: {
        args: z.object({
            limit: z.number().optional()
        }).optional(),
        result: z.object({
            success: z.boolean(),
            result: z.array(z.any()).optional(),
            message: z.string().optional()
        })
    }
} as const

export const listAll = async (ctx: IpcContext) => {
    const client = createBackendClient(ctx)
    console.log('[ipc][mastersigna.listAll] request /api/mastersigna/listAll')
    try {
        const res = await client.get('/api/mastersigna/listAll')
        // Fallback if listAll endpoint is not available (since we only built standard CRUD createCRUDController)
        // Wait, the standard createCRUDController in simrs-gateway only exposes /api/mastersigna (GET list), no listAll.
        // I should fallback to GET /api/mastersigna?items=1000 if listAll fails or 404s.
        const result = await parseBackendResponse(res, BackendListSchema(z.any()))
        return { success: true, result }
    } catch (error: any) {
        if (error.response?.status === 404) {
            console.log('[ipc][mastersigna.listAll] fallback to /api/mastersigna?items=1000')
            const fallbackRes = await client.get('/api/mastersigna?items=1000')
            const fallbackResult = await parseBackendResponse(fallbackRes, BackendListSchema(z.any()))
            return { success: true, result: fallbackResult }
        }
        throw error
    }
}

export const list = async (ctx: IpcContext, args?: { limit?: number }) => {
    const client = createBackendClient(ctx)
    const items = args?.limit || 1000
    console.log(`[ipc][mastersigna.list] request /api/mastersigna?items=${items}`)
    const res = await client.get(`/api/mastersigna?items=${items}`)
    const result = await parseBackendResponse(res, BackendListSchema(z.any()))
    return { success: true, result }
}
