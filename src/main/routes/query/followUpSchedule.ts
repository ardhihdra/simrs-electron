import { IpcContext } from '@main/ipc/router'
import { getClient, parseBackendResponse } from '@main/utils/backendClient'
import z from 'zod'
import { FollowUpScheduleSchema } from 'simrs-types'

const FollowUpScheduleSchemaCompat = FollowUpScheduleSchema as unknown as z.ZodTypeAny

export const FollowUpScheduleSchemaPayload = FollowUpScheduleSchema.extend({
    id: z.string().optional().nullable(),
    followUpDate: z.union([z.string(), z.coerce.date()]),
    createdAt: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    updatedAt: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    doctor: z.any().optional().nullable(),
    polyclinic: z.any().optional().nullable()
})

export const schemas = {
    create: {
        args: FollowUpScheduleSchemaPayload,
        result: z.object({
            success: z.boolean(),
            message: z.string().optional(),
            result: FollowUpScheduleSchemaCompat.optional().nullable(),
            error: z.string().optional()
        })
    },
    list: {
        args: z.object({
            encounterId: z.string().optional(),
            patientId: z.string().optional(),
            polyclinicId: z.union([z.string(), z.number()]).optional()
        }).optional(),
        result: z.object({
            success: z.boolean(),
            result: z.array(FollowUpScheduleSchemaCompat).optional().nullable(),
            message: z.string().optional(),
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
        const parsedResult = (await parseBackendResponse(res, schemas.create.result as any)) as any
        return { success: true, result: parsedResult }
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

        Object.entries(args || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, String(value))
            }
        })

        const queryString = queryParams.toString()
        const res = await client.get(`/api/followupschedule${queryString ? `?${queryString}` : ''}`)
        const parsedResult = (await parseBackendResponse(res, schemas.list.result as any)) as any
        return { success: true, result: parsedResult || [] }
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
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))

        const parsed = schemas.remove.result.safeParse(raw)
        if (!res.ok || !parsed.success || !parsed.data.success) {
            return {
                success: false,
                error: parsed.success
                    ? parsed.data.error || parsed.data.message || `HTTP ${res.status}`
                    : parsed.error.message
            }
        }

        return parsed.data
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[FOLLOW UP SCHEDULE] Error remove:', msg)
        return { success: false, error: msg }
    }
}
