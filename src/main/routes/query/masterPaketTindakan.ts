import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { parseBackendResponse, BackendListSchema, getClient } from '@main/utils/backendClient'
import { MasterPaketTindakanSchema } from 'simrs-types'

export const requireSession = true

const MasterPaketTindakanSchemaCompat = MasterPaketTindakanSchema as unknown as z.ZodTypeAny
type MasterPaketTindakanData = z.infer<typeof MasterPaketTindakanSchema>

const normalizeMasterPaket = (raw: MasterPaketTindakanData) => {
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
            sortBy: z.union([z.string(), z.array(z.string())]).optional(),
            sortOrder: z.string().optional(),
            q: z.string().optional(),
            kode: z.string().optional(),
            nama: z.string().optional(),
            kategori: z.string().optional(),
            kodePaket: z.string().optional(),
            namaPaket: z.string().optional(),
            kategoriPaket: z.string().optional(),
            kategoriBpjs: z.string().optional(),
            status: z.string().optional(),
            aktif: z.boolean().optional(),
            isPaketOk: z.boolean().optional()
        }).optional(),
        result: z.object({
            success: z.boolean(),
            result: z.array(MasterPaketTindakanSchemaCompat).optional(),
            pagination: z
                .object({
                    page: z.number(),
                    pages: z.number(),
                    count: z.number(),
                    limit: z.number().optional()
                })
                .optional(),
            error: z.string().optional()
        })
    },
    getById: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: MasterPaketTindakanSchemaCompat.optional().nullable(),
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
        if (args?.sortBy) {
            if (Array.isArray(args.sortBy)) {
                args.sortBy.forEach((field) => {
                    if (typeof field === 'string' && field.trim()) params.append('sortBy', field)
                })
            } else if (args.sortBy.trim()) {
                params.append('sortBy', args.sortBy)
            }
        }
        if (args?.sortOrder) params.append('sortOrder', args.sortOrder)
        if (args?.q) params.append('q', args.q)
        if (args?.kode) params.append('kode', args.kode)
        if (args?.nama) params.append('nama', args.nama)
        if (args?.kategori) params.append('kategori', args.kategori)
        if (args?.kodePaket) params.append('kodePaket', args.kodePaket)
        if (args?.namaPaket) params.append('namaPaket', args.namaPaket)
        if (args?.kategoriPaket) params.append('kategoriPaket', args.kategoriPaket)
        if (args?.kategoriBpjs) params.append('kategoriBpjs', args.kategoriBpjs)
        if (args?.status) params.append('status', args.status)
        if (args?.aktif !== undefined) params.append('aktif', String(args.aktif))
        if (args?.isPaketOk !== undefined) params.append('isPaketOk', String(args.isPaketOk))

        const queryString = params.toString()
        const url = `/api/masterpakettindakan${queryString ? `?${queryString}` : ''}`
        const res = await client.get(url)
        const ListSchema = BackendListSchema(MasterPaketTindakanSchemaCompat)
        const raw = await res.json().catch(() => ({ success: false, error: 'Invalid response' }))
        const parsed = ListSchema.safeParse(raw)

        if (!res.ok || !parsed.success || parsed.data.success === false) {
            if (parsed.success && parsed.data.success === false) {
                const msg = parsed.data.error || parsed.data.message || 'Gagal mengambil data master paket tindakan'
                throw new Error(String(msg))
            }
            const msg = parsed.success ? `HTTP ${res.status}` : parsed.error.message
            throw new Error(msg)
        }

        const normalized = (parsed.data.result ?? []).map((item) =>
            normalizeMasterPaket(item as MasterPaketTindakanData)
        )
        return {
            success: true,
            result: normalized,
            pagination: parsed.data.pagination
        }
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
            result: MasterPaketTindakanSchemaCompat.optional().nullable(),
            message: z.string().optional(),
            error: z.any().optional()
        })
        const result = (await parseBackendResponse(res, BackendReadSchema)) as MasterPaketTindakanData | null | undefined
        return { success: true, result: result ? normalizeMasterPaket(result) : result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
