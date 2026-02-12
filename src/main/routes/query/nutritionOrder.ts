import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'
import z from 'zod'

export const schemas = {
    create: {
        args: z.any(),
        result: z.object({
            success: z.boolean(),
            result: z.any().optional(),
            message: z.string().optional(),
            error: z.any().optional()
        })
    },
    read: {
        args: z.object({ id: z.string() }),
        result: z.object({
            success: z.boolean(),
            result: z.any().optional(),
            message: z.string().optional(),
            error: z.any().optional()
        })
    },
    list: {
        args: z.object({
            encounterId: z.string(),
            page: z.string().optional(),
            items: z.string().optional()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(z.any()).optional(),
            message: z.string().optional(),
            error: z.any().optional()
        })
    }
}

export const create = async (ctx: IpcContext, payload: any) => {
    try {
        const client = getClient(ctx)
        const res = await client.post('/api/nutritionOrder', payload)
        const json = await res.json()
        return {
            success: json.success ?? true,
            result: json.result,
            message: json.message
        }
    } catch (err: any) {
        console.error('[nutritionOrder.create] error:', err.message)
        return { success: false, error: err.message }
    }
}

export const read = async (ctx: IpcContext, args: z.infer<typeof schemas.read.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/nutritionOrder/${args.id}/read`)
        const json = await res.json()
        return {
            success: json.success ?? true,
            result: json.result,
            message: json.message
        }
    } catch (err: any) {
        console.error('[nutritionOrder.read] error:', err.message)
        return { success: false, error: err.message }
    }
}

export const list = async (ctx: IpcContext, args: z.infer<typeof schemas.list.args>) => {
    try {
        const client = getClient(ctx)
        const params = new URLSearchParams()
        params.append('encounterId', args.encounterId)
        if (args.page) params.append('page', args.page)
        if (args.items) params.append('items', args.items)

        const url = `/api/nutritionOrder/list?${params.toString()}`;
        const res = await client.get(url)
        const json = await res.json()
        return {
            success: json.success ?? true,
            result: json.result || [],
            message: json.message
        }
    } catch (err: any) {
        console.error('[nutritionOrder.list] error:', err.message)
        return { success: false, result: [], error: err.message }
    }
}
