import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
    create: {
        args: z.object({
            patientId: z.string(),
            status: z.string(),
            relationship: z.string(),
            relationshipDisplay: z.string().optional(),
            sex: z.string().optional(),
            bornDate: z.string().optional(),
            bornAge: z.number().optional(),
            deceasedBoolean: z.boolean().optional(),
            deceasedDate: z.string().optional(),
            note: z.string().optional(),
            conditions: z.array(z.object({
                diagnosisCodeId: z.number(),
                outcome: z.string().optional(),
                contributedToDeath: z.boolean().optional(),
                note: z.string().optional()
            })).optional()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.any().optional(),
            message: z.string().optional()
        })
    },
    list: {
        args: z.any().optional(),
        result: z.object({
            success: z.boolean(),
            result: z.array(z.any()).optional(),
            message: z.string().optional()
        })
    },
    update: {
        args: z.any(),
        result: z.object({
            success: z.boolean(),
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

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.post('/api/familymemberhistory', args)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const list = async (ctx: IpcContext, args: z.infer<typeof schemas.list.args>) => {
    try {
        const client = getClient(ctx)
        const params = new URLSearchParams(args as any).toString()
        const res = await client.get(`/api/familymemberhistory?${params}`)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
    try {
        const client = getClient(ctx)
        const { id, ...rest } = args
        const res = await client.patch(`/api/familymemberhistory/${id}`, rest)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
    try {
        const client = getClient(ctx)
        const { id } = args
        const res = await client.delete(`/api/familymemberhistory/${id}`)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
