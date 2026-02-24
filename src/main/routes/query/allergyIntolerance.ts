import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse } from '@main/utils/backendClient'

export const requireSession = true

const AllergyIntoleranceSchema = z.object({
    id: z.number().optional(),
    identifier: z.string().optional(),
    patientId: z.string(),
    encounterId: z.string().optional(),
    clinicalStatus: z.enum(['active', 'inactive', 'resolved']).optional(),
    verificationStatus: z.enum(['unconfirmed', 'confirmed', 'refuted', 'entered-in-error']).optional(),
    type: z.enum(['allergy', 'intolerance']).optional(),
    category: z.enum(['food', 'medication', 'environment', 'biologic']).optional(),
    criticality: z.enum(['low', 'high', 'unable-to-assess']).optional(),
    note: z.string().optional(),
    recorder: z.number().optional(),
    recordedDate: z.string().optional(),
    diagnosisCodeId: z.number().optional(),
    codeCoding: z.array(z.any()).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
})

export const schemas = {
    create: {
        args: z.object({
            patientId: z.string(),
            encounterId: z.string().optional(),
            recordedDate: z.string().optional(),
            recorder: z.number().optional(),
            clinicalStatus: z.enum(['active', 'inactive', 'resolved']).optional(),
            verificationStatus: z.enum(['unconfirmed', 'confirmed', 'refuted', 'entered-in-error']).optional(),
            type: z.enum(['allergy', 'intolerance']).optional(),
            category: z.enum(['food', 'medication', 'environment', 'biologic']).optional(),
            criticality: z.enum(['low', 'high', 'unable-to-assess']).optional(),
            note: z.string().optional(),
            diagnosisCodeId: z.number().optional()
        }),
        result: z.object({
            success: z.boolean(),
            result: AllergyIntoleranceSchema.optional(),
            message: z.string().optional()
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
            message: z.string().optional()
        })
    },
    update: {
        args: z.object({
            id: z.number(),
            clinicalStatus: z.enum(['active', 'inactive', 'resolved']).optional(),
            verificationStatus: z.enum(['unconfirmed', 'confirmed', 'refuted', 'entered-in-error']).optional(),
            type: z.enum(['allergy', 'intolerance']).optional(),
            category: z.enum(['food', 'medication', 'environment', 'biologic']).optional(),
            criticality: z.enum(['low', 'high', 'unable-to-assess']).optional(),
            note: z.string().optional(),
            recorder: z.number().optional(),
            recordedDate: z.string().optional(),
            diagnosisCodeId: z.number().optional()
        }),
        result: z.object({
            success: z.boolean(),
            result: AllergyIntoleranceSchema.optional(),
            message: z.string().optional()
        })
    },
    deleteById: {
        args: z.object({
            id: z.number()
        }),
        result: z.object({
            success: z.boolean(),
            message: z.string().optional()
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
        const res = await client.post('/module/allergy-intolerance', args)
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
        const params = new URLSearchParams()
        if (args?.patientId) params.set('patientId', args.patientId)
        if (args?.encounterId) params.set('encounterId', args.encounterId)
        const res = await client.get(`/module/allergy-intolerance?${params.toString()}`)
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
        const res = await client.patch(`/module/allergy-intolerance/${id}`, rest)
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
        const res = await client.delete(`/module/allergy-intolerance/${args.id}`)
        await parseBackendResponse(res, DeleteSchema)
        return { success: true }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'NO_BACKEND_TOKEN') return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        return { success: false, error: msg }
    }
}
