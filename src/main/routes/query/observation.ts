import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
    getClient
} from '@main/utils/backendClient'

export const requireSession = true

const ObservationPropsSchema = z.object({
    id: z.string().optional(),
    status: z.string().optional(),
    subjectId: z.string().optional(),
    encounterId: z.string().optional(),
    effectiveDateTime: z.string().optional(),
    issued: z.string().optional(),
    valueQuantity: z.any().optional(),
    valueString: z.any().nullable().optional(),
    valueBoolean: z.any().nullable().optional(),
    categories: z.array(z.any()).optional(),
    codeCoding: z.array(z.any()).optional(),
    performers: z.array(z.any()).optional(),
    bodySites: z.array(z.any()).optional(),
    interpretations: z.array(z.any()).optional(),
    methods: z.array(z.any()).optional(),
    components: z.array(z.any()).optional(),
    notes: z.array(z.any()).optional(),
}).passthrough()

const PaginationSchema = z.object({
    page: z.number(),
    pages: z.number(),
    count: z.number(),
    limit: z.number()
}).passthrough()

export const schemas = {
    getByEncounter: {
        args: z.object({
            encounterId: z.string()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(ObservationPropsSchema).optional(),
            message: z.string().optional()
        })
    },
    create: {
        args: z.object({
            encounterId: z.string(),
            patientId: z.string(),
            observations: z.array(z.any()),
            performerId: z.union([z.number(), z.string(), z.null()]).optional(),
            performerName: z.string().optional()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(ObservationPropsSchema).optional(),
            message: z.string().optional()
        })
    },
    list: {
        args: z.any().optional(),
        result: z.object({
            success: z.boolean(),
            result: z.array(ObservationPropsSchema).optional(),
            message: z.string().optional(),
            pagination: PaginationSchema.optional()
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
            id: z.union([z.number(), z.string()])
        }),
        result: z.object({
            success: z.boolean(),
            message: z.string().optional()
        })
    }
} as const

export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/module/observation/${args.encounterId}`)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.post('/api/module/observation', args)
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
        const res = await client.get(`/api/module/observation?${params}`)
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
        const res = await client.patch(`/api/module/observation/${id}`, rest)
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
        const res = await client.delete(`/api/module/observation/${id}`)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
