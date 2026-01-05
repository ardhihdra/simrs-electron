import z from 'zod'
import { PoliSchema, PoliSchemaWithId } from '@main/models/poli'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
    list: {
        result: z.object({
            success: z.boolean(),
            result: PoliSchemaWithId.array().optional(),
            message: z.string().optional()
        })
    },
    getById: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: PoliSchemaWithId.optional(),
            message: z.string().optional()
        })
    },
    create: {
        args: PoliSchema.partial(),
        result: z.object({
            success: z.boolean(),
            result: PoliSchemaWithId.optional(),
            message: z.string().optional()
        })
    },
    update: {
        args: PoliSchemaWithId,
        result: z.object({
            success: z.boolean(),
            result: PoliSchemaWithId.optional(),
            message: z.string().optional()
        })
    },
    deleteById: {
        args: z.object({ id: z.number() }),
        result: z.object({ success: z.boolean(), message: z.string().optional() })
    }
} as const

const BackendResponseSchema = z.object({
    success: z.boolean(),
    result: PoliSchemaWithId.optional(),
    message: z.string().optional(),
    error: z.string().optional()
})

export const list = async (ctx: IpcContext) => {
    try {
        const client = createBackendClient(ctx)
        const res = await client.get('/api/poli?items=100')
        const result = await parseBackendResponse(
            res,
            BackendListSchema(PoliSchemaWithId)
        )
        return { success: true, result }
    } catch (err) {
        console.error('[poli.list] Error:', err)
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'NO_BACKEND_TOKEN') {
            return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        }
        return { success: false, error: msg }
    }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
    try {
        const client = createBackendClient(ctx)
        const res = await client.get(`/api/poli/read/${args.id}`)
        const result = await parseBackendResponse(res, BackendResponseSchema)
        return { success: true, result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'NO_BACKEND_TOKEN') {
            return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        }
        return { success: false, error: msg }
    }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = createBackendClient(ctx)
        const payload = {
            name: args.name,
            description: args.description ?? null,
            location: args.location ?? null,
            createdBy: args.createdBy ?? null
        }
        const res = await client.post('/api/poli', payload)
        const result = await parseBackendResponse(res, BackendResponseSchema)
        return { success: true, result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'NO_BACKEND_TOKEN') {
            return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        }
        return { success: false, error: msg }
    }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
    try {
        const client = createBackendClient(ctx)
        const payload = {
            name: args.name,
            description: args.description,
            location: args.location,
            updatedBy: args.updatedBy ?? null
        }
        const res = await client.put(`/api/poli/${args.id}`, payload)
        const result = await parseBackendResponse(res, BackendResponseSchema)
        return { success: true, result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'NO_BACKEND_TOKEN') {
            return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        }
        return { success: false, error: msg }
    }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
    try {
        const client = createBackendClient(ctx)
        const res = await client.delete(`/api/poli/${args.id}`)
        const DeleteResponseSchema = z.object({
            success: z.boolean(),
            message: z.string().optional(),
            error: z.string().optional()
        })
        await parseBackendResponse(res, DeleteResponseSchema)
        return { success: true }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'NO_BACKEND_TOKEN') {
            return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        }
        return { success: false, error: msg }
    }
}
