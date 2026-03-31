import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient, parseBackendResponse } from '@main/utils/backendClient'

export const requireSession = true

const ProcedureDetailSchema = z.object({
    id: z.number(),
    encounterId: z.string(),
    patientId: z.string(),
    tanggalTindakan: z.union([z.string(), z.date()]),
    cyto: z.boolean().optional().nullable(),
    catatanTambahan: z.string().optional().nullable(),
    status: z.string().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional()
}).passthrough()

const PetugasListSchema = z.object({
    pegawaiId: z.number(),
    roleTenaga: z.string()
})

export const schemas = {
    create: {
        args: z.object({
            encounterId: z.string(),
            patientId: z.string(),
            tanggalTindakan: z.union([z.string(), z.date()]),
            cyto: z.boolean().optional().nullable(),
            catatanTambahan: z.string().optional().nullable(),
            petugasList: z.array(PetugasListSchema).optional(),
            tindakanPaketList: z.array(z.any()).optional(),
            tindakanSatuanList: z.array(z.any()).optional(),
            bhpSatuanList: z.array(z.any()).optional(),
            bhpPaketList: z.array(z.any()).optional()
        }),
        result: z.object({
            success: z.boolean(),
            result: z.any().optional(),
            error: z.string().optional(),
            message: z.string().optional()
        })
    },
    list: {
        args: z.object({
            encounterId: z.string().optional(),
            patientId: z.string().optional(),
            status: z.string().optional(),
            page: z.number().optional(),
            items: z.number().optional()
        }).optional(),
        result: z.object({
            success: z.boolean(),
            result: z.array(ProcedureDetailSchema).optional(),
            error: z.string().optional()
        })
    },
    remove: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            error: z.string().optional(),
            message: z.string().optional()
        })
    }
} as const

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.post('/api/detailtindakanpasien', args)
        const ResponseSchema = z.object({
            success: z.boolean(),
            result: z.any().optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
        const result = await parseBackendResponse(res, ResponseSchema)
        return { success: true, result, message: 'Detail tindakan berhasil disimpan' }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const list = async (ctx: IpcContext, args?: z.infer<typeof schemas.list.args>) => {
    try {
        const client = getClient(ctx)
        const params = new URLSearchParams()

        if (args?.encounterId) params.append('encounterId', args.encounterId)
        if (args?.patientId) params.append('patientId', args.patientId)
        if (args?.status) params.append('status', args.status)
        if (args?.page) params.append('page', args.page.toString())
        if (args?.items) params.append('items', args.items.toString())

        const queryString = params.toString()
        const url = `/api/detailtindakanpasien${queryString ? `?${queryString}` : ''}`
        const res = await client.get(url)
        const raw = await res.json().catch(() => ({ success: false, error: 'Invalid JSON response' }))

        if (!res.ok || raw.success === false) {
            return { success: false as const, error: raw.error || raw.message || `HTTP ${res.status}`, result: [] }
        }

        return { success: true as const, result: raw.result ?? [] }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false as const, error: msg, result: [] }
    }
}

export const remove = async (ctx: IpcContext, args: z.infer<typeof schemas.remove.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.delete(`/api/detailtindakanpasien/${args.id}`)
        const ResponseSchema = z.object({
            success: z.boolean(),
            message: z.string().optional(),
            error: z.string().optional()
        })
        await parseBackendResponse(res, ResponseSchema)
        return { success: true as const }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false as const, error: msg }
    }
}
