import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { parseBackendResponse, BackendListSchema, getClient } from '@main/utils/backendClient'
import { DetailTindakanPasienSchema } from 'simrs-types'

export const requireSession = true

const DetailTindakanPasienSchemaCompat = DetailTindakanPasienSchema as unknown as z.ZodTypeAny

const PetugasListSchema = z.object({
    pegawaiId: z.number(),
    roleTenaga: z.string()
})

const TindakanPaketListSchema = z.object({
    masterTindakanId: z.number(),
    paketId: z.number(),
    paketDetailId: z.number().optional().nullable(),
    kelas: z.string().optional().nullable(),
    jumlah: z.number().min(0.01),
    satuan: z.string().optional().nullable(),
    cyto: z.boolean()
})

const TindakanSatuanListSchema = z.object({
    masterTindakanId: z.number(),
    kelas: z.string().optional().nullable(),
    jumlah: z.number().min(0.01),
    satuan: z.string().optional().nullable(),
    cyto: z.boolean()
})

const BhpSatuanListSchema = z.object({
    itemId: z.number(),
    jumlah: z.number(),
    satuan: z.string().optional().nullable()
})

const BhpPaketListSchema = z.object({
    paketBhpId: z.number(),
    paketBhpDetailId: z.number(),
    itemId: z.number(),
    jumlah: z.number(),
    satuan: z.string().optional().nullable()
})

const CreateDetailTindakanSchema = z.object({
    encounterId: z.string(),
    patientId: z.string(),
    tanggalTindakan: z.union([z.string(), z.date()]),
    cyto: z.boolean().optional().nullable(),
    catatanTambahan: z.string().optional().nullable(),
    petugasList: z.array(PetugasListSchema),
    tindakanPaketList: z.array(TindakanPaketListSchema).optional(),
    tindakanSatuanList: z.array(TindakanSatuanListSchema).optional(),
    bhpSatuanList: z.array(BhpSatuanListSchema).optional(),
    bhpPaketList: z.array(BhpPaketListSchema).optional()
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
        result: z.object({
            success: z.boolean(),
            result: z.array(DetailTindakanPasienSchemaCompat).optional(),
            error: z.string().optional()
        })
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
    remove: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            error: z.string().optional(),
            message: z.string().optional()
        })
    },
    byEncounter: {
        args: z.object({ encounterId: z.string() }),
        result: z.object({
            success: z.boolean(),
            result: z.array(DetailTindakanPasienSchemaCompat).optional(),
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

        const ListSchema = BackendListSchema(DetailTindakanPasienSchemaCompat)
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
        const url = `/api/detailtindakanpasien/read/${args.encounterId}`
        const res = await client.get(url)

        const ListSchema = BackendListSchema(DetailTindakanPasienSchemaCompat)
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

export const remove = async (ctx: IpcContext, args: z.infer<typeof schemas.remove.args>) => {
    try {
        const client = getClient(ctx)
        const res = await client.delete(`/api/detailtindakanpasien/${args.id}`)
        const ResponseSchema = z.object({
            success: z.boolean(),
            message: z.string().optional(),
            error: z.string().optional()
        })
        const result = await parseBackendResponse(res, ResponseSchema)
        return {
            success: true,
            message: (result as any)?.message,
            error: (result as any)?.error
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
