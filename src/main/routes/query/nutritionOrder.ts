import { IpcContext } from '@main/ipc/router'
import { getClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'
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

        const BackendCreateSchema = z.object({
            success: z.boolean(),
            result: z.any().optional(),
            message: z.string().optional(),
            error: z.any().optional()
        })

        const result = await parseBackendResponse(res, BackendCreateSchema)

        return {
            success: true,
            result: result,
            message: 'Successfully created NutritionOrder'
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

        const BackendReadSchema = z.object({
            success: z.boolean(),
            result: z.any().optional(),
            message: z.string().optional(),
            error: z.any().optional()
        })

        const result = await parseBackendResponse(res, BackendReadSchema)

        return {
            success: true,
            result: result
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

        const url = `/api/nutritionOrder?${params.toString()}`;

        const res = await client.get(url)

        const ListSchema = BackendListSchema(z.any())
        const result = await parseBackendResponse(res, ListSchema)

        return {
            success: true,
            result: Array.isArray(result) ? result : [],
            message: 'Successfully fetched nutrition orders'
        }
    } catch (err: any) {
        console.error('[nutritionOrder.list] error:', err.message)
        return { success: false, result: [], error: err.message }
    }
}
