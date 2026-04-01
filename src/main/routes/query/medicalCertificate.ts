import { IpcContext } from '@main/ipc/router'
import { getClient, parseBackendResponse } from '@main/utils/backendClient'
import { BaseResultSchema } from '@main/utils/crud'
import z from 'zod'

export const MedicalCertificateSchema = z.object({
    id: z.string().optional(),
    encounterId: z.string(),
    patientId: z.string(),
    doctorId: z.number(),
    type: z.string(),
    validFrom: z.union([z.string(), z.date()]).optional().nullable(),
    validUntil: z.union([z.string(), z.date()]).optional().nullable(),
    diagnosis: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    createdAt: z.string().optional(),
    doctor: z.object({
        id: z.number(),
        namaLengkap: z.string(),
        nik: z.string().optional().nullable()
    }).optional().nullable()
})

export const schemas = {
    create: {
        args: MedicalCertificateSchema,
        result: z.object({
            success: z.boolean(),
            message: z.string().optional(),
            result: MedicalCertificateSchema.optional(),
            error: z.string().optional()
        })
    },
    list: {
        args: z.object({
            encounterId: z.string().optional(),
            patientId: z.string().optional(),
            type: z.string().optional()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(MedicalCertificateSchema).optional(),
            error: z.string().optional()
        })
    },
    remove: {
        args: z.object({ id: z.string() }),
        result: BaseResultSchema
    }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = getClient(ctx)
        // Parse Payload for safe transmission
        const payload = {
            ...args,
            validFrom: args.validFrom instanceof Date ? args.validFrom.toISOString() : args.validFrom,
            validUntil: args.validUntil instanceof Date ? args.validUntil.toISOString() : args.validUntil
        }

        const res = await client.post('/api/medicalcertificate', payload)
        const parsedResult = (await parseBackendResponse(res, schemas.create.result)) as any
        return { success: true, ...parsedResult }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[MEDICAL CERTIFICATE] Error create:', msg)
        return { success: false, error: msg }
    }
}

export const list = async (ctx: IpcContext, args: z.infer<typeof schemas.list.args>) => {
    try {
        const client = getClient(ctx)
        const queryParams = new URLSearchParams()

        Object.entries(args).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, String(value))
            }
        })

        const res = await client.get(`/api/medicalcertificate?${queryParams.toString()}`)
        const parsedResult = (await parseBackendResponse(res, schemas.list.result)) as any
        // Map response structure properly
        return { success: true, result: parsedResult?.result || parsedResult || [] }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[MEDICAL CERTIFICATE] Error list:', msg)
        return { success: false, error: msg }
    }
}

export const remove = async (ctx: IpcContext, args: z.infer<typeof schemas.remove.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.delete(`/api/medicalcertificate/${args.id}`)
        const parsedResult = (await parseBackendResponse(res, schemas.remove.result)) as any
        return { success: true, ...parsedResult }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[MEDICAL CERTIFICATE] Error remove:', msg)
        return { success: false, error: msg }
    }
}
