import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse } from '@main/utils/backendClient'
import { AllergyIntoleranceSchema } from 'simrs-types'

export const requireSession = true

export const AllergyIntoleranceSchemaPayload = AllergyIntoleranceSchema.extend({
    id: z.number().optional().nullable(),
    createdAt: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    updatedAt: z.union([z.string(), z.coerce.date()]).optional().nullable(),
})

export const schemas = {
    create: {
        args: AllergyIntoleranceSchemaPayload,
        result: z.object({
            success: z.boolean(),
            result: AllergyIntoleranceSchema.optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    },
    list: {
        args: z.object({
            patientId: z.string().optional(),
            encounterId: z.string().optional()
        }).optional(),
        result: z.object({
            success: z.boolean(),
            result: z.array(AllergyIntoleranceSchema).optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    },
    update: {
        args: AllergyIntoleranceSchemaPayload.extend({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: AllergyIntoleranceSchema.optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    },
    deleteById: {
        args: z.object({
            id: z.number()
        }),
        result: z.object({
            success: z.boolean(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    }
} as const

const BackendItemSchema = z.object({
    success: z.boolean(),
    result: AllergyIntoleranceSchema.optional(),
    message: z.string().optional(),
    error: z.string().optional()
})

const BackendListResultSchema = z.object({
    success: z.boolean(),
    result: z.array(AllergyIntoleranceSchema).optional(),
    message: z.string().optional(),
    error: z.string().optional()
})

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = createBackendClient(ctx)
        const res = await client.post('/api/module/allergy-intolerance', args)
        return await parseBackendResponse(res, BackendItemSchema).then(result => ({
            success: true,
            result
        }))
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'NO_BACKEND_TOKEN') return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        return { success: false, error: msg }
    }
}

export const list = async (ctx: IpcContext, args?: z.infer<typeof schemas.list.args>) => {
    try {
        const client = createBackendClient(ctx)
        let url = '/api/module/allergy-intolerance'
        if (args?.encounterId) {
            url += `/${args.encounterId}`
        }
        const params = new URLSearchParams()
        if (args?.patientId) params.set('patientId', args.patientId)
        const queryString = params.toString()
        const res = await client.get(queryString ? `${url}?${queryString}` : url)
        return await parseBackendResponse(res, BackendListResultSchema).then(result => ({
            success: true,
            result
        }))
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'NO_BACKEND_TOKEN') return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        return { success: false, error: msg }
    }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
    try {
        const client = createBackendClient(ctx)
        const { id, ...rest } = args
        const res = await client.patch(`/api/module/allergy-intolerance/${id}`, rest)
        return await parseBackendResponse(res, BackendItemSchema).then(result => ({
            success: true,
            result
        }))
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'NO_BACKEND_TOKEN') return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        return { success: false, error: msg }
    }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
    try {
        const client = createBackendClient(ctx)
        const DeleteSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
        const res = await client.delete(`/api/module/allergy-intolerance/${args.id}`)
        await parseBackendResponse(res, DeleteSchema)
        return { success: true }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'NO_BACKEND_TOKEN') return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        return { success: false, error: msg }
    }
}
