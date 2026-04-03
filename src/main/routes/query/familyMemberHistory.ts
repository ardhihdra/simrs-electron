import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'
import { FamilyMemberHistorySchema } from 'simrs-types'

export const requireSession = true
const FamilyMemberHistorySchemaCompat = FamilyMemberHistorySchema as unknown as z.ZodTypeAny
const FamilyMemberRelationshipPayloadSchema = z.enum([
    'ayah',
    'ibu',
    'kakak',
    'adik',
    'saudara',
    'anak',
    'kakek',
    'nenek',
    'paman',
    'bibi',
    'sepupu',
    'suami',
    'istri',
    'lainnya',
    'other'
])

const FamilyMemberHistoryConditionPayloadSchema = z.object({
    diagnosisCodeId: z.number(),
    outcome: z.string().optional().nullable(),
    contributedToDeath: z.boolean().optional().nullable(),
    note: z.string().optional().nullable()
})

export const FamilyMemberHistorySchemaPayload = z.object({
    id: z.union([z.number(), z.string()]).optional().nullable(),
    patientId: z.string(),
    status: z.string(),
    relationship: z.union([FamilyMemberRelationshipPayloadSchema, z.string()]),
    relationshipDisplay: z.string().optional().nullable(),
    sex: z.string().optional().nullable(),
    bornDate: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    bornAge: z.number().optional().nullable(),
    deceasedBoolean: z.boolean().optional().nullable(),
    deceasedDate: z.union([z.string(), z.coerce.date()]).optional().nullable(),
    note: z.string().optional().nullable(),
    conditions: z.array(FamilyMemberHistoryConditionPayloadSchema).optional().nullable()
})

export const schemas = {
    create: {
        args: FamilyMemberHistorySchemaPayload,
        result: z.object({
            success: z.boolean(),
            result: FamilyMemberHistorySchemaCompat.optional().nullable(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    },
    list: {
        args: z.object({
            patientId: z.union([z.string(), z.number()]).optional(),
            status: z.string().optional(),
            page: z.union([z.string(), z.number()]).optional(),
            items: z.union([z.string(), z.number()]).optional()
        }).optional(),
        result: z.object({
            success: z.boolean(),
            result: z.array(FamilyMemberHistorySchemaCompat).optional().nullable(),
            pagination: z.any().optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    },
    update: {
        args: FamilyMemberHistorySchemaPayload.extend({
            id: z.union([z.number(), z.string()])
        }),
        result: z.object({
            success: z.boolean(),
            result: FamilyMemberHistorySchemaCompat.optional().nullable(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    },
    deleteById: {
        args: z.object({
            id: z.union([z.number(), z.string()])
        }),
        result: z.object({
            success: z.boolean(),
            result: z.any().optional().nullable(),
            message: z.string().optional(),
            error: z.string().optional()
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
        const res = await client.get(`/api/familymemberhistory${params ? `?${params}` : ''}`)
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
