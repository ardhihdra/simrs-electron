import z from 'zod'
import { JaminanSchema, JaminanSchemaWithId } from '@main/models/jaminan'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
    list: {
        result: z.object({
            success: z.boolean(),
            result: JaminanSchemaWithId.array().optional(),
            message: z.string().optional()
        })
    },
    getById: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: JaminanSchemaWithId.optional(),
            message: z.string().optional()
        })
    },
    create: {
        args: JaminanSchema.partial(),
        result: z.object({
            success: z.boolean(),
            result: JaminanSchemaWithId.optional(),
            message: z.string().optional()
        })
    },
    update: {
        args: JaminanSchemaWithId,
        result: z.object({
            success: z.boolean(),
            result: JaminanSchemaWithId.optional(),
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
    result: JaminanSchemaWithId.optional(),
    message: z.string().optional(),
    error: z.string().optional()
})

export const list = async (ctx: IpcContext) => {
    try {
        const client = createBackendClient(ctx)
        const res = await client.get('/api/jaminan?items=100')
        const result = await parseBackendResponse(
            res,
            BackendListSchema(JaminanSchemaWithId)
        )
        return { success: true, result }
    } catch (err) {
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
        const res = await client.get(`/api/jaminan/read/${args.id}`)
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
            nama: args.nama,
            kode: args.kode,
            keterangan: args.keterangan ?? null,
            status: args.status ?? 'active'
        }
        const res = await client.post('/api/jaminan', payload)
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
            nama: args.nama,
            kode: args.kode,
            keterangan: args.keterangan,
            status: args.status
        }
        const res = await client.put(`/api/jaminan/${args.id}`, payload)
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
        const res = await client.delete(`/api/jaminan/${args.id}`)
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
