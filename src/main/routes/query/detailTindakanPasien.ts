import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { parseBackendResponse, BackendListSchema, getClient } from '@main/utils/backendClient'

export const requireSession = true

const KepegawaianSimpleSchema = z.object({
    id: z.number(),
    namaLengkap: z.string().optional().nullable(),
    nik: z.string().optional().nullable()
}).passthrough()

const MasterTindakanSimpleSchema = z.object({
    id: z.number(),
    kode: z.string(),
    nama: z.string(),
    kategori: z.string().optional().nullable()
})

const DetailTindakanPasienSchema = z.object({
    id: z.number(),
    encounterId: z.string(),
    patientId: z.string(),
    masterTindakanId: z.number(),
    tanggalTindakan: z.union([z.string(), z.date()]),
    jumlah: z.union([z.number(), z.string()]),
    satuan: z.string().optional().nullable(),
    cyto: z.boolean().optional().nullable(),
    catatanTambahan: z.string().optional().nullable(),
    dokterPemeriksaId: z.number().optional().nullable(),
    dokterDelegasiId: z.number().optional().nullable(),
    dokterAnestesiId: z.number().optional().nullable(),
    perawatId: z.number().optional().nullable(),
    perawat2Id: z.number().optional().nullable(),
    perawat3Id: z.number().optional().nullable(),
    status: z.string().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
    masterTindakan: MasterTindakanSimpleSchema.optional().nullable(),
    dokterPemeriksa: KepegawaianSimpleSchema.optional().nullable(),
    dokterDelegasi: KepegawaianSimpleSchema.optional().nullable(),
    dokterAnestesi: KepegawaianSimpleSchema.optional().nullable(),
    perawat: KepegawaianSimpleSchema.optional().nullable(),
    perawat2: KepegawaianSimpleSchema.optional().nullable(),
    perawat3: KepegawaianSimpleSchema.optional().nullable()
})

const CreateDetailTindakanSchema = z.object({
    encounterId: z.string(),
    patientId: z.string(),
    masterTindakanId: z.number(),
    tanggalTindakan: z.union([z.string(), z.date()]),
    jumlah: z.number().min(0.01),
    satuan: z.string().optional(),
    cyto: z.boolean().optional().default(false),
    catatanTambahan: z.string().optional(),
    dokterPemeriksaId: z.number().optional().nullable(),
    dokterDelegasiId: z.number().optional().nullable(),
    dokterAnestesiId: z.number().optional().nullable(),
    perawatId: z.number().optional().nullable(),
    perawat2Id: z.number().optional().nullable(),
    perawat3Id: z.number().optional().nullable()
})

export const schemas = {
    list: {
        args: z.object({
            encounterId: z.string().optional(),
            patientId: z.string().optional(),
            status: z.string().optional(),
            cyto: z.boolean().optional(),
            page: z.number().optional(),
            items: z.number().optional()
        }).optional(),
        result: z.any()
    },
    create: {
        args: CreateDetailTindakanSchema,
        result: z.object({
            success: z.boolean(),
            result: z.any().optional(),
            error: z.string().optional(),
            message: z.string().optional()
        })
    },
    update: {
        args: z.object({ id: z.number(), status: z.string().optional() }).passthrough(),
        result: z.object({
            success: z.boolean(),
            result: z.any().optional(),
            error: z.string().optional(),
            message: z.string().optional()
        })
    },
    byEncounter: {
        args: z.object({ encounterId: z.string() }),
        result: z.object({
            success: z.boolean(),
            result: DetailTindakanPasienSchema.array().optional(),
            error: z.string().optional()
        })
    }
} as const

export const list = async (ctx: IpcContext, args?: z.infer<typeof schemas.list.args>) => {
    try {
        const client = getClient(ctx)
        const params = new URLSearchParams()

        if (args?.encounterId) params.append('encounterId', args.encounterId)
        if (args?.patientId) params.append('patientId', args.patientId)
        if (args?.status) params.append('status', args.status)
        if (args?.cyto !== undefined) params.append('cyto', String(args.cyto))
        if (args?.page) params.append('page', args.page.toString())
        if (args?.items) params.append('items', args.items.toString())

        const queryString = params.toString()
        const url = `/api/detailtindakanpasien${queryString ? `?${queryString}` : ''}`
        const res = await client.get(url)

        const ListSchema = BackendListSchema(DetailTindakanPasienSchema)
        const result = await parseBackendResponse(res, ListSchema)
        return { success: true, result: result ?? [] }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const byEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.byEncounter.args>) => {
    try {
        const client = getClient(ctx)
        const url = `/api/detailtindakanpasien?encounterId=${args.encounterId}&items=100`
        const res = await client.get(url)

        const ListSchema = BackendListSchema(DetailTindakanPasienSchema)
        const result = await parseBackendResponse(res, ListSchema)
        return { success: true, result: result ?? [] }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg, result: [] }
    }
}

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

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
    try {
        const client = getClient(ctx)
        const { id, ...data } = args
        const res = await client.put(`/api/detailtindakanpasien/${id}`, data)
        const ResponseSchema = z.object({
            success: z.boolean(),
            result: z.any().optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
        const result = await parseBackendResponse(res, ResponseSchema)
        return { success: true, result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
