import z from 'zod'

const DoctorScheduleStatusSchema = z.enum(['active', 'inactive'])

const DoctorScheduleAssociationSchema = {
    pegawai: z
        .object({
            id: z.number(),
            namaLengkap: z.string(),
            email: z.string().optional().nullable(),
            nik: z.string().optional().nullable()
        })
        .optional()
        .nullable(),
    poli: z
        .object({
            id: z.number(),
            name: z.string(),
            description: z.string().optional().nullable(),
            location: z.string().optional().nullable()
        })
        .optional()
        .nullable()
} as const

export const DoctorScheduleSchemaWithId = z.object({
    id: z.number(),
    idPegawai: z.number(),
    idPoli: z.number(),
    idLokasiKerja: z.number(),
    idKontrakKerja: z.number(),
    kategori: z.string(),
    namaJadwal: z.string().nullable().optional(),
    berlakuDari: z.string(),
    berlakuSampai: z.string().nullable().optional(),
    status: DoctorScheduleStatusSchema,
    keterangan: z.string().nullable().optional(),
    createdBy: z.number().nullable().optional(),
    updatedBy: z.number().nullable().optional(),
    deletedBy: z.number().nullable().optional(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
    deletedAt: z.string().nullable().optional(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    deleted_at: z.string().nullable().optional(),
    ...DoctorScheduleAssociationSchema
})

export const DoctorScheduleSchema = z.object({
    idPegawai: z.number(),
    idPoli: z.number(),
    idLokasiKerja: z.number(),
    idKontrakKerja: z.number(),
    kategori: z.string(),
    namaJadwal: z.string().nullable().optional(),
    berlakuDari: z.string(),
    berlakuSampai: z.string().nullable().optional(),
    status: DoctorScheduleStatusSchema,
    keterangan: z.string().nullable().optional(),
    createdBy: z.number().nullable().optional(),
    updatedBy: z.number().nullable().optional()
})
