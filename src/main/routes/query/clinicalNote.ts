import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
    getClient
} from '@main/utils/backendClient'

export const requireSession = true

const ClinicalNoteSchema = z.object({
    id: z.number().optional(),
    encounterId: z.string(),
    authorId: z.number().optional(),
    authorRole: z.string().optional(),
    noteType: z.string(),
    noteText: z.string(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional()
})

const UpsertNoteInputSchema = z.object({
    type: z.string(),
    text: z.string()
})

export const schemas = {
    upsert: {
        args: z.object({
            encounterId: z.string(),
            doctorId: z.number().optional(),
            notes: z.array(UpsertNoteInputSchema)
        }),
        result: z.object({
            success: z.boolean(),
            result: z.array(ClinicalNoteSchema).optional().nullable(),
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
            result: z.array(ClinicalNoteSchema).optional().nullable(),
            message: z.string().optional(),
            error: z.string().optional()
        })
    }
} as const

export const upsert = async (ctx: IpcContext, args: z.infer<typeof schemas.upsert.args>) => {
    try {
        const client = getClient(ctx)
        const payload = {
            encounterId: args.encounterId,
            doctorId: args.doctorId,
            notes: args.notes
        }

        const res = await client.post('/api/clinical-note/upsert', payload)

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

export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/clinical-note/by-encounter/${args.encounterId}`)

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
