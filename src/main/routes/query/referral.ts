import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
    getClient
} from '@main/utils/backendClient'

export const requireSession = true

const ReferralSchema = z.object({
    id: z.number().optional(),
    encounterId: z.string(),
    patientId: z.string(),
    referralType: z.enum(['internal', 'external']),
    targetUnit: z.string().optional().nullable(),
    targetFacility: z.string().optional().nullable(),
    reason: z.string(),
    clinicalSummary: z.string().optional().nullable(),
    priority: z.enum(['normal', 'urgent', 'emergency']),
    referredBy: z.number(),
    referralDate: z.union([z.string(), z.date()]),
    status: z.string(),
    response: z.string().optional().nullable(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional()
})

const CreateReferralInputSchema = z.object({
    encounterId: z.string(),
    patientId: z.string(),
    referralType: z.enum(['internal', 'external']),
    targetUnit: z.string().optional(),
    targetFacility: z.string().optional(),
    reason: z.string(),
    clinicalSummary: z.string().optional(),
    priority: z.enum(['normal', 'urgent', 'emergency']),
    referredBy: z.number().optional(),
    status: z.string().optional(),
    referralDate: z.union([z.string(), z.date()]).optional()
})

export const schemas = {
    create: {
        args: CreateReferralInputSchema,
        result: z.object({
            success: z.boolean(),
            result: ReferralSchema.optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    },
    getByEncounter: {
        args: z.object({
            encounterId: z.string()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(ReferralSchema).optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    }
} as const

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.post('/api/referral', args)
        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' })) as any

        if (!raw || typeof raw !== 'object') {
            return { success: false, error: 'Invalid response format' }
        }

        if (!res.ok || raw.success === false) {
            return {
                success: false,
                error: raw.error || raw.message || 'Unknown backend error'
            }
        }

        return {
            success: true,
            result: raw.data,
            message: raw.message
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
    try {
        const client = getClient(ctx)
        // Use standard generic filter endpoint
        const res = await client.get(`/api/referral/filter?encounterId=${args.encounterId}`)

        const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' })) as any

        if (!raw || typeof raw !== 'object') {
            return { success: false, error: 'Invalid response format' }
        }

        if (!res.ok || raw.success === false) {
            return {
                success: false,
                error: raw.error || raw.message || 'Unknown backend error'
            }
        }

        return {
            success: true,
            result: raw.result || [] // Generic controller returns 'result'
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
