import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
    getClient
} from '@main/utils/backendClient'

export const requireSession = true

// Schema definitions
const CodingSchema = z.object({
    system: z.string().optional(),
    code: z.string().optional(),
    display: z.string().optional()
})

const CodeableConceptSchema = z.object({
    coding: z.array(CodingSchema).optional(),
    text: z.string().optional()
})

const QuantitySchema = z.object({
    value: z.number().optional(),
    unit: z.string().optional(),
    system: z.string().optional(),
    code: z.string().optional()
})

const ReferenceRangeSchema = z.object({
    low: QuantitySchema.optional(),
    high: QuantitySchema.optional(),
    type: CodeableConceptSchema.optional(),
    appliesTo: z.array(CodeableConceptSchema).optional(),
    age: z.any().optional(), // simplified
    text: z.string().optional()
})

const ObservationSchema = z.object({
    id: z.number().optional(),
    status: z.string(),
    category: z.array(CodeableConceptSchema).optional(),
    code: CodeableConceptSchema,
    subjectId: z.string(),
    focus: z.array(z.string()).optional(),
    encounterId: z.string().optional(),
    effectiveDateTime: z.union([z.string(), z.date()]).optional().nullable(),
    issued: z.union([z.string(), z.date()]).optional().nullable(),
    valueQuantity: QuantitySchema.optional().nullable(),
    referenceRange: z.array(ReferenceRangeSchema).optional().nullable(),
    createdAt: z.union([z.string(), z.date()]).optional()
})

const DiagnosticReportSchema = z.object({
    id: z.number().optional(),
    identifier: z.string().optional().nullable(),
    basedOn: z.any().optional().nullable(),
    status: z.string(),
    category: z.array(CodeableConceptSchema).optional().nullable(),
    code: CodeableConceptSchema,
    subjectId: z.string(),
    encounterId: z.string().optional().nullable(),
    effectiveDateTime: z.union([z.string(), z.date()]).optional().nullable(),
    issued: z.union([z.string(), z.date()]).optional().nullable(),
    result: z.any().optional().nullable(),
    observations: z.array(ObservationSchema).optional().nullable(), // populated
    conclusion: z.string().optional().nullable(),
    createdAt: z.union([z.string(), z.date()]).optional()
})

const CreateResultInputSchema = z.object({
    code: z.string(),
    display: z.string(),
    value: z.number(),
    unit: z.string(),
    referenceRange: z.string()
})

export const schemas = {
    getByEncounter: {
        args: z.object({
            encounterId: z.string()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(DiagnosticReportSchema).optional().nullable(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    },
    create: {
        args: z.object({
            encounterId: z.string(),
            patientId: z.string(),
            category: z.string(),
            code: z.string(),
            display: z.string(),
            conclusion: z.string().optional(),
            results: z.array(CreateResultInputSchema).optional(),
            serviceRequestId: z.string().optional()
        }),
        result: z.object({
            success: z.boolean(),
            result: DiagnosticReportSchema.optional().nullable(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    }
} as const

export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/diagnostic-report/read/${args.encounterId}`)

        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))

        if (!raw || typeof raw !== 'object' || raw.success === false) {
            return { success: false, error: raw?.error || raw?.message || 'Unknown backend error' }
        }

        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = getClient(ctx)
        const payload = args

        const res = await client.post('/api/diagnostic-report', payload)

        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))

        if (!raw || typeof raw !== 'object' || raw.success === false) {
            return { success: false, error: raw?.error || raw?.message || 'Unknown backend error' }
        }

        return raw as any
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
