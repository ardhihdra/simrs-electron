import z from 'zod'

const DoctorScheduleStatusSchema = z.enum(['active', 'inactive'])
const DoctorScheduleSessionSchema = z.object({
    id: z.number(),
    idJadwalDokter: z.number(),
    hari: z.number(),
    sesiKe: z.number(),
    jamMulai: z.string(),
    jamSelesai: z.string(),
    kuota: z.number().nullable().optional(),
    isActive: z.boolean(),
    keterangan: z.string().nullable().optional(),
    createdBy: z.number().nullable().optional(),
    updatedBy: z.number().nullable().optional(),
    deletedBy: z.number().nullable().optional(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
    deletedAt: z.string().nullable().optional(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    deleted_at: z.string().nullable().optional()
})

const DoctorScheduleExceptionSessionSchema = z.object({
    id: z.number(),
    idJadwalDokterException: z.number(),
    sesiKe: z.number(),
    jamMulai: z.string(),
    jamSelesai: z.string(),
    kuota: z.number().nullable().optional(),
    isActive: z.boolean(),
    createdBy: z.number().nullable().optional(),
    updatedBy: z.number().nullable().optional(),
    deletedBy: z.number().nullable().optional(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
    deletedAt: z.string().nullable().optional(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    deleted_at: z.string().nullable().optional()
})

const DoctorScheduleExceptionSchema = z.object({
    id: z.number(),
    idJadwalDokter: z.number(),
    tanggal: z.string(),
    jenis: z.string(),
    mode: z.string(),
    keterangan: z.string().nullable().optional(),
    isActive: z.boolean(),
    createdBy: z.number().nullable().optional(),
    updatedBy: z.number().nullable().optional(),
    deletedBy: z.number().nullable().optional(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
    deletedAt: z.string().nullable().optional(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    deleted_at: z.string().nullable().optional(),
    sesiOverride: DoctorScheduleExceptionSessionSchema.array().optional()
})

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
        .nullable(),
    sesi: DoctorScheduleSessionSchema.array().optional(),
    exceptions: DoctorScheduleExceptionSchema.array().optional()
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
