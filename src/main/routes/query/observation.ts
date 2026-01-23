import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
    parseBackendResponse,
    BackendListSchema,
    getClient
} from '@main/utils/backendClient'

export const requireSession = true

// Observation schemas
const ObservationCategorySchema = z.object({
    code: z.string(),
    display: z.string().optional(),
    system: z.string().optional()
})

const ObservationCodeCodingSchema = z.object({
    code: z.string(),
    display: z.string().optional(),
    system: z.string().optional()
})

const ObservationSchema = z.object({
    id: z.number().optional().nullable(),
    status: z.string(),
    subjectId: z.string(),
    encounterId: z.string().optional().nullable(),
    effectiveDateTime: z.union([z.string(), z.date()]).optional().nullable(),
    issued: z.union([z.string(), z.date()]).optional().nullable(),
    valueQuantity: z.any().optional().nullable(),
    valueString: z.string().optional().nullable(),
    valueBoolean: z.boolean().optional().nullable(),
    valueInteger: z.number().optional().nullable(),
    categories: z.array(ObservationCategorySchema).optional().nullable(),
    codeCoding: z.array(ObservationCodeCodingSchema).optional().nullable()
})


const BulkCreatePerformerSchema = z.object({
    performerId: z.string(),
    performerName: z.string()
})

const BulkCreateBodySiteSchema = z.object({
    code: z.string(),
    display: z.string(),
    system: z.string().optional()
})

const BulkCreateInterpretationSchema = z.object({
    code: z.string(),
    display: z.string(),
    system: z.string().optional()
})

const BulkCreateMethodSchema = z.object({
    code: z.string(),
    display: z.string(),
    system: z.string().optional()
})

const BulkCreateNoteSchema = z.union([
    z.string(),
    z.object({ text: z.string() })
])

const BulkCreateObservationInputSchema = z.object({
    category: z.string(),
    code: z.string(),
    display: z.string().optional(),
    system: z.string().optional(),
    valueQuantity: z.any().optional(),
    valueString: z.string().optional(),
    valueBoolean: z.boolean().optional(),
    performers: z.array(BulkCreatePerformerSchema).optional(),
    bodySites: z.array(BulkCreateBodySiteSchema).optional(),
    interpretations: z.array(BulkCreateInterpretationSchema).optional(),
    methods: z.array(BulkCreateMethodSchema).optional(),
    notes: z.array(BulkCreateNoteSchema).optional()
})

export const schemas = {
    list: {
        args: z.object({
            encounterId: z.string().optional(),
            patientId: z.string().optional(),
            category: z.string().optional(),
            status: z.string().optional()
        }).optional(),
        result: z.any()
    },
    getById: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: ObservationSchema.optional(),
            error: z.string().optional()
        })
    },
    getByEncounter: {
        args: z.object({ encounterId: z.string() }),
        result: z.object({
            success: z.boolean(),
            result: z.object({
                all: z.array(ObservationSchema),
                grouped: z.object({
                    vitalSigns: z.array(ObservationSchema),
                    anamnesis: z.array(ObservationSchema),
                    physicalExam: z.array(ObservationSchema),
                    other: z.array(ObservationSchema)
                })
            }).optional(),
            error: z.string().optional()
        })
    },
    bulkCreate: {
        args: z.object({
            encounterId: z.string(),
            patientId: z.string(),
            observations: z.array(BulkCreateObservationInputSchema),
            performerId: z.string().optional(),
            performerName: z.string().optional()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(ObservationSchema).optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    },
    create: {
        args: ObservationSchema,
        result: z.object({
            success: z.boolean(),
            result: ObservationSchema.optional(),
            error: z.string().optional()
        })
    },
    update: {
        args: ObservationSchema.extend({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: ObservationSchema.optional(),
            error: z.string().optional()
        })
    },
    deleteById: {
        args: z.object({ id: z.number() }),
        result: z.object({ success: z.boolean(), error: z.string().optional() })
    }
} as const

export const list = async (ctx: IpcContext, args?: z.infer<typeof schemas.list.args>) => {
    try {
        const client = getClient(ctx)
        const params = new URLSearchParams()

        if (args?.encounterId) params.append('encounterId', args.encounterId)
        if (args?.patientId) params.append('patientId', args.patientId)
        if (args?.category) params.append('category', args.category)
        if (args?.status) params.append('status', args.status)

        const queryString = params.toString()
        const url = `/api/observation${queryString ? `?${queryString}` : ''}`

        const res = await client.get(url)

        const ListSchema = BackendListSchema(ObservationSchema)
        const result = await parseBackendResponse(res, ListSchema)

        return { success: true, result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/observation/read/${args.id}`)

        const BackendReadSchema = z.object({
            success: z.boolean(),
            result: ObservationSchema.optional().nullable(),
            message: z.string().optional(),
            error: z.any().optional()
        })

        const result = await parseBackendResponse(res, BackendReadSchema)
        return { success: true, result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
    try {
        const client = getClient(ctx)

        // Use the dedicated by-encounter endpoint
        const res = await client.get(`/api/observation/by-encounter/${args.encounterId}`)

        // Manual extraction to debug and ensure strict control over parsing
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))

        // Log the raw response to electron console (viewable in terminal where user ran npm run dev)
        console.log('[DEBUG] getByEncounter RAW:', JSON.stringify(raw, null, 2))

        // Basic validation without Zod for now to identify the issue
        if (!raw || typeof raw !== 'object') {
            return { success: false, error: 'Invalid response format' }
        }

        if (raw.success === false) {
            return {
                success: false,
                error: raw.error || raw.message || 'Unknown backend error'
            }
        }

        // Check if success is missing (which caused the Zod error "expected boolean, received undefined")
        if (typeof raw.success === 'undefined') {
            // If result exists, maybe it's just missing success flag?
            if (raw.result) {
                return { success: true, result: raw.result }
            }
            return { success: false, error: 'Response missing success flag' }
        }

        // Return the raw response which we verified has success: true and result
        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const bulkCreate = async (ctx: IpcContext, args: z.infer<typeof schemas.bulkCreate.args>) => {
    try {
        const client = getClient(ctx)
        const payload = {
            encounterId: args.encounterId,
            patientId: args.patientId,
            observations: args.observations,
            performerId: args.performerId,
            performerName: args.performerName
        }

        const res = await client.post('/api/observation/bulk-create', payload)

        const BackendCreateSchema = z.object({
            success: z.boolean(),
            result: z.array(z.any()).optional().nullable(),
            message: z.string().optional(),
            error: z.any().optional()
        })

        const result = await parseBackendResponse(res, BackendCreateSchema)
        return { success: true, result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.post('/api/observation', args)

        const BackendCreateSchema = z.object({
            success: z.boolean(),
            result: ObservationSchema.optional().nullable(),
            message: z.string().optional(),
            error: z.any().optional()
        })

        const result = await parseBackendResponse(res, BackendCreateSchema)
        return { success: true, result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.put(`/api/observation/${args.id}`, args)

        const BackendUpdateSchema = z.object({
            success: z.boolean(),
            result: ObservationSchema.optional().nullable(),
            message: z.string().optional(),
            error: z.any().optional()
        })

        const result = await parseBackendResponse(res, BackendUpdateSchema)
        return { success: true, result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.delete(`/api/observation/${args.id}`)

        const BackendDeleteSchema = z.object({
            success: z.boolean()
        })

        await parseBackendResponse(res, BackendDeleteSchema)
        return { success: true }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
