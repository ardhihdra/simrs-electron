import z from 'zod'

const KontrakPegawaiSchema = z.object({
    id: z.number(),
    idPegawai: z.number(),
    kodeJabatan: z.string(),
    kodeDepartemen: z.string(),
    kodeLokasiKerja: z.string(),
    tanggalMulai: z.string(),
    tanggalSelesai: z.string().nullable().optional(),
    status: z.string(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
    deletedAt: z.string().optional().nullable()
})

export const KepegawaianSchema = z.object({
    email: z.string(),
    namaLengkap: z.string().min(1),
    nik: z.string().min(1),
    tanggalLahir: z.string(),
    jenisKelamin: z.enum(['L', 'P']),
    alamat: z.string().nullable().optional(),
    nomorTelepon: z.string().nullable().optional(),
    hakAksesId: z.string().nullable().optional(),
    emailVerified: z.boolean().optional(),
    createdBy: z.number().nullable().optional(),
    updatedBy: z.number().nullable().optional(),
    deletedBy: z.number().nullable().optional()
})

export const KepegawaianSchemaWithId = KepegawaianSchema.extend({
    id: z.number(),
    removed: z.boolean().optional(),
    token: z.string().nullable().optional(),
    tokenExpiredAt: z.string().nullable().optional(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    deleted_at: z.string().optional().nullable(),
    kontrakPegawai: z.array(KontrakPegawaiSchema).optional()
}).passthrough()
