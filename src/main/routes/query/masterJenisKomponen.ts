import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { parseBackendResponse, BackendListSchema, getClient } from '@main/utils/backendClient'

export const requireSession = true

const MasterJenisKomponenSchema = z.object({
    id: z.number(),
    kode: z.string(),
    label: z.string(),
    isUntukMedis: z.boolean(),
    keterangan: z.string().optional().nullable(),
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
            label: z.string().optional(),
            isUntukMedis: z.boolean().optional(),
            status: z.string().optional()
        }).optional(),
        result: z.any()
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
        if (args?.label) params.append('label', args.label)
        if (args?.isUntukMedis !== undefined) params.append('isUntukMedis', args.isUntukMedis.toString())
        if (args?.status) params.append('status', args.status)

        const queryString = params.toString()
        const url = `/api/masterjeniskomponen${queryString ? `?${queryString}` : ''}`
        const res = await client.get(url)

        const ListSchema = BackendListSchema(MasterJenisKomponenSchema)
        const result = await parseBackendResponse(res, ListSchema)
        return { success: true, result: result ?? [] }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
