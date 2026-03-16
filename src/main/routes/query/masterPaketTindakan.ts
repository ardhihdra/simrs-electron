import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { parseBackendResponse, BackendListSchema, getClient } from '@main/utils/backendClient'

export const requireSession = true

const MasterTindakanSimpleSchema = z.object({
    id: z.number(),
    kodeTindakan: z.string(),
    namaTindakan: z.string(),
    kategoriTindakan: z.string().optional().nullable()
}).passthrough()

const PaketBhpItemSchema = z.object({
    id: z.number().optional(),
    paketDetailId: z.number().optional(),
    itemId: z.number(),
    jumlahDefault: z.union([z.number(), z.string()]).optional(),
    satuan: z.string().optional().nullable(),
    includedInPaket: z.boolean().optional(),
    keterangan: z.string().optional().nullable(),
    item: z
        .object({
            id: z.number(),
            kode: z.string().optional().nullable(),
            nama: z.string().optional().nullable(),
            kind: z.string().optional().nullable(),
            sellingPrice: z.union([z.number(), z.string()]).optional().nullable()
        })
        .optional()
        .nullable()
}).passthrough()

const PaketDetailItemSchema = z.object({
    id: z.number(),
    paketId: z.number(),
    masterTindakanId: z.number(),
    qty: z.union([z.number(), z.string()]).optional(),
    satuan: z.string().optional().nullable(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
    tindakan: MasterTindakanSimpleSchema.optional().nullable(),
    masterTindakan: MasterTindakanSimpleSchema.optional().nullable(),
    bhpList: z.array(PaketBhpItemSchema).optional().nullable()
}).passthrough()

const MasterPaketTindakanSchema = z.object({
    id: z.number(),
    kodePaket: z.string(),
    namaPaket: z.string(),
    kategoriPaket: z.string().optional().nullable(),
    deskripsi: z.string().optional().nullable(),
    tarifPaket: z.union([z.number(), z.string()]).optional().nullable(),
    aktif: z.boolean().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
    detailItems: z.array(PaketDetailItemSchema).optional().nullable(),
    listTindakan: z.array(PaketDetailItemSchema).optional().nullable(),
    listBHP: z.array(PaketBhpItemSchema).optional().nullable(),
    tarifList: z.array(z.any()).optional().nullable(),
    tindakanPasienList: z.array(z.any()).optional().nullable()
}).passthrough()

const normalizeMasterPaket = (raw: z.infer<typeof MasterPaketTindakanSchema>) => {
    const detailItemsRaw = Array.isArray(raw?.detailItems) ? raw.detailItems : []
    const listTindakan = Array.isArray(raw?.listTindakan)
        ? raw.listTindakan
        : detailItemsRaw.map((detail) => {
            const rest = { ...detail } as Record<string, unknown>
            delete rest.bhpList
            return rest
        })

    const listBHP = Array.isArray(raw?.listBHP)
        ? raw.listBHP
        : detailItemsRaw.flatMap((detail) => {
            const bhpList = Array.isArray(detail?.bhpList) ? detail.bhpList : []
            return bhpList.map((bhp) => ({
                ...bhp,
                paketDetailId: bhp?.paketDetailId ?? detail?.id,
                masterTindakanId: detail?.masterTindakanId,
                tindakan: detail?.tindakan ?? detail?.masterTindakan ?? null
            }))
        })

    return {
        ...raw,
        listTindakan,
        listBHP
    }
}

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
            result: MasterPaketTindakanSchema.optional().nullable(),
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
        const url = `/api/masterpakettindakan${queryString ? `?${queryString}` : ''}`
        const res = await client.get(url)

        const ListSchema = BackendListSchema(MasterPaketTindakanSchema)
        const result = await parseBackendResponse(res, ListSchema)
        const normalized = (result ?? []).map((item) => normalizeMasterPaket(item))
        return { success: true, result: normalized }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.get(`/api/masterpakettindakan/${args.id}/read`)
        const BackendReadSchema = z.object({
            success: z.boolean(),
            result: MasterPaketTindakanSchema.optional().nullable(),
            message: z.string().optional(),
            error: z.any().optional()
        })
        const result = await parseBackendResponse(res, BackendReadSchema)
        return { success: true, result: result ? normalizeMasterPaket(result) : result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
