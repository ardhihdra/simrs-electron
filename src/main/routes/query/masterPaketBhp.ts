import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { parseBackendResponse, BackendListSchema, getClient } from '@main/utils/backendClient'

export const requireSession = true

const ItemSimpleSchema = z.object({
    id: z.number(),
    kode: z.string().optional().nullable(),
    nama: z.string().optional().nullable(),
    kind: z.string().optional().nullable(),
    sellingPrice: z.union([z.number(), z.string()]).optional().nullable()
}).passthrough()

const PaketBhpDetailItemSchema = z.object({
    id: z.number(),
    paketBhpId: z.number(),
    itemId: z.number(),
    jumlahDefault: z.union([z.number(), z.string()]).optional().nullable(),
    satuan: z.string().optional().nullable(),
    keterangan: z.string().optional().nullable(),
    aktif: z.boolean().optional(),
    item: ItemSimpleSchema.optional().nullable()
}).passthrough()

const MasterPaketBhpSchema = z.object({
    id: z.number(),
    kodePaketBhp: z.string(),
    namaPaketBhp: z.string(),
    kategoriPaket: z.string().optional().nullable(),
    deskripsi: z.string().optional().nullable(),
    aktif: z.boolean().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
    listBhp: z.array(PaketBhpDetailItemSchema).optional().nullable()
}).passthrough()

export const schemas = {
    list: {
        args: z.object({
            page: z.number().optional(),
            items: z.number().optional(),
            q: z.string().optional(),
            aktif: z.boolean().optional()
        }).optional(),
        result: z.any()
    },
    getById: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: MasterPaketBhpSchema.optional().nullable(),
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
        if (args?.aktif !== undefined) params.append('aktif', String(args.aktif))

        const queryString = params.toString()
        const url = `/api/masterpaketbhp${queryString ? `?${queryString}` : ''}`
        const res = await client.get(url)

        const ListSchema = BackendListSchema(MasterPaketBhpSchema)
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
        const res = await client.get(`/api/masterpaketbhp/${args.id}/read`)
        const BackendReadSchema = z.object({
            success: z.boolean(),
            result: MasterPaketBhpSchema.optional().nullable(),
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
