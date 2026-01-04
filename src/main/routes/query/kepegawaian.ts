import z from 'zod'
import { KepegawaianSchema, KepegawaianSchemaWithId } from '@main/models/kepegawaian'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
    list: {
        result: z.object({
            success: z.boolean(),
            result: KepegawaianSchemaWithId.array().optional(),
            message: z.string().optional()
        })
    },
    getById: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: KepegawaianSchemaWithId.optional(),
            message: z.string().optional()
        })
    },
    create: {
        args: KepegawaianSchema.partial(),
        result: z.object({
            success: z.boolean(),
            result: KepegawaianSchemaWithId.optional(),
            message: z.string().optional()
        })
    },
    update: {
        args: KepegawaianSchemaWithId,
        result: z.object({
            success: z.boolean(),
            result: KepegawaianSchemaWithId.optional(),
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
    result: KepegawaianSchemaWithId.optional(),
    message: z.string().optional(),
    error: z.string().optional()
})

export const list = async (ctx: IpcContext) => {
    try {
        const client = createBackendClient(ctx)
        const res = await client.get('/api/kepegawaian?items=100')
        const result = await parseBackendResponse(
            res,
            BackendListSchema(KepegawaianSchemaWithId)
        )
        return { success: true, result }
    } catch (err) {
        console.error('[kepegawaian.list] Error:', err)
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
        const res = await client.get(`/api/kepegawaian/read/${args.id}`)
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
            email: args.email,
            namaLengkap: args.namaLengkap,
            nik: args.nik,
            tanggalLahir: args.tanggalLahir,
            jenisKelamin: args.jenisKelamin,
            alamat: args.alamat ?? null,
            nomorTelepon: args.nomorTelepon ?? null,
            hakAksesId: args.hakAksesId,
            emailVerified: args.emailVerified ?? false,
            createdBy: args.createdBy ?? null
        }
        const res = await client.post('/api/kepegawaian', payload)
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
            email: args.email,
            namaLengkap: args.namaLengkap,
            nik: args.nik,
            tanggalLahir: args.tanggalLahir,
            jenisKelamin: args.jenisKelamin,
            alamat: args.alamat,
            nomorTelepon: args.nomorTelepon,
            hakAksesId: args.hakAksesId,
            emailVerified: args.emailVerified,
            updatedBy: args.updatedBy ?? null
        }
        const res = await client.put(`/api/kepegawaian/${args.id}`, payload)
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
        const res = await client.delete(`/api/kepegawaian/${args.id}`)
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
