import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { parseBackendResponse, BackendListSchema, getClient } from '@main/utils/backendClient'

export const requireSession = true

export const CATEGORY_BPJS_VALUES = [
    'Prosedur Non Bedah',
    'Prosedur Bedah',
    'Tenaga Ahli',
    'Keperawatan',
    'Radiologi',
    'Laboratorium',
    'Rehabilitasi',
    'Kamar / Akomodasi',
    'Obat',
    'Alkes',
    'BHP',
    'Pelayanan Darah',
    'Rawat Intensif',
    'Konsultasi',
    'Penunjang',
    'Sewa Alat'
] as const

export type CategoryBpjs = typeof CATEGORY_BPJS_VALUES[number]

const MasterTindakanSchema = z.object({
    id: z.number(),
    kodeTindakan: z.string(),
    namaTindakan: z.string(),
    kategoriTindakan: z.string().optional().nullable(),
    categoryBpjs: z.enum(CATEGORY_BPJS_VALUES).optional().nullable(),
    deskripsi: z.string().optional().nullable(),
    aktif: z.boolean().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional()
})

export const schemas = {
    list: {
        args: z.object({
            page: z.number().optional(),
            items: z.number().optional(),
            q: z.string().optional(),
            kode: z.string().optional(),
            nama: z.string().optional(),
            kategori: z.string().optional(),
            categoryBpjs: z.enum(CATEGORY_BPJS_VALUES).optional(),
            status: z.string().optional()
        }).optional(),
        result: z.any()
    },
    getById: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: z.any().optional(),
            error: z.string().optional()
        })
    }
} as const

export const list = async (ctx: IpcContext, args?: z.infer<typeof schemas.list.args>) => {
    try {
        const client = getClient(ctx)
        const params = new URLSearchParams()

        if (args?.page) params.append('page', args.page.toString())
        if (args?.items) params.append('items', args.items.toString())
        if (args?.q) params.append('q', args.q)
        if (args?.kode) params.append('kode', args.kode)
        if (args?.nama) params.append('nama', args.nama)
        if (args?.kategori) params.append('kategori', args.kategori)
        if (args?.categoryBpjs) params.append('categoryBpjs', args.categoryBpjs)
        if (args?.status) params.append('status', args.status)

        const queryString = params.toString()
        const url = `/api/mastertindakan${queryString ? `?${queryString}` : ''}`
        const res = await client.get(url)

        const ListSchema = BackendListSchema(MasterTindakanSchema)
        const result = await parseBackendResponse(res, ListSchema)
        return { success: true, result: result ?? [] }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/mastertindakan/${args.id}/read`)
        const BackendReadSchema = z.object({
            success: z.boolean(),
            result: z.any().optional().nullable(),
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
