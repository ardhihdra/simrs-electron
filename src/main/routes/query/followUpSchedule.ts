import { IpcContext } from '@main/ipc/router'
import { getClient, parseBackendResponse } from '@main/utils/backendClient'
import { error } from 'console'
import z from 'zod'

export const FollowUpScheduleSchema = z.object({
    id: z.string().optional(),
    encounterId: z.string(),
    patientId: z.string(),
    doctorId: z.number(),
    followUpDate: z.union([z.string(), z.date()]),
    polyclinicId: z.number().optional().nullable(),
    controlType: z.string().optional().nullable(),
    diagnosis: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    createdAt: z.string().optional(),
    doctor: z.object({
        id: z.number(),
        namaLengkap: z.string(),
        nik: z.string().optional().nullable()
    }).optional().nullable(),
    polyclinic: z.object({
        id: z.number(),
        name: z.string()
    }).optional().nullable()
})

export const schemas = {
    create: {
        args: FollowUpScheduleSchema,
        result: z.object({
            success: z.boolean(),
            message: z.string().optional(),
            result: FollowUpScheduleSchema.optional(),
            error: z.string().optional()
        })
    },
    list: {
        args: z.object({
            encounterId: z.string().optional(),
            patientId: z.string().optional(),
            polyclinicId: z.union([z.string(), z.number()]).optional()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(FollowUpScheduleSchema).optional(),
            error: z.string().optional()
        })
    },
    remove: {
        args: z.object({ id: z.string() }),
        result: z.object({
            success: z.boolean(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = getClient(ctx)
        const payload = {
            ...args,
            followUpDate:
                args.followUpDate instanceof Date
                    ? args.followUpDate.toISOString()
                    : args.followUpDate
        }

        const res = await client.post('/api/followupschedule', payload)
        const parsedResult = (await parseBackendResponse(res, schemas.create.result)) as any
        return { success: true, ...parsedResult }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[FOLLOW UP SCHEDULE] Error create:', msg)
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

        const res = await client.get(`/api/followupschedule?${queryParams.toString()}`)
        const parsedResult = (await parseBackendResponse(res, schemas.list.result)) as any
        return { success: true, result: parsedResult?.result || parsedResult || [] }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[FOLLOW UP SCHEDULE] Error list:', msg)
        return { success: false, error: msg }
    }
}

export const remove = async (ctx: IpcContext, args: z.infer<typeof schemas.remove.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.delete(`/api/followupschedule/${args.id}`)
        const parsedResult = (await parseBackendResponse(res, schemas.remove.result)) as any
        return { success: true, ...parsedResult }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[FOLLOW UP SCHEDULE] Error remove:', msg)
        return { success: false, error: msg }
    }
}
