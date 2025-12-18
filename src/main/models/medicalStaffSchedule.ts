import z from 'zod'

const DayScheduleSchema = z.object({
    enabled: z.boolean(),
    startTime: z.string(), // format: "HH:mm"
    endTime: z.string()    // format: "HH:mm"
})

export const MedicalStaffScheduleSchemaWithId = z.object({
    id: z.number(),
    idPegawai: z.number(),
    kodeDepartemen: z.string(),
    kategori: z.string().nullable().optional(),
    senin: DayScheduleSchema.optional(),
    selasa: DayScheduleSchema.optional(),
    rabu: DayScheduleSchema.optional(),
    kamis: DayScheduleSchema.optional(),
    jumat: DayScheduleSchema.optional(),
    sabtu: DayScheduleSchema.optional(),
    minggu: DayScheduleSchema.optional(),
    status: z.string().optional(),
    createdBy: z.number().nullable().optional(),
    updatedBy: z.number().nullable().optional(),
    deletedBy: z.number().nullable().optional(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    deleted_at: z.string().nullable().optional(),
    pegawai: z.object({
        id: z.number(),
        namaLengkap: z.string(),
        email: z.string().optional().nullable(),
        nik: z.string().optional().nullable()
    }).optional().nullable(),
    departemen: z.object({
        kode: z.string(),
        nama: z.string()
    }).optional().nullable()
})

export const MedicalStaffScheduleSchema = z.object({
    idPegawai: z.number(),
    kodeDepartemen: z.string(),
    kategori: z.string().nullable().optional(),
    senin: DayScheduleSchema.optional(),
    selasa: DayScheduleSchema.optional(),
    rabu: DayScheduleSchema.optional(),
    kamis: DayScheduleSchema.optional(),
    jumat: DayScheduleSchema.optional(),
    sabtu: DayScheduleSchema.optional(),
    minggu: DayScheduleSchema.optional(),
    status: z.string().optional(),
    createdBy: z.number().nullable().optional(),
    updatedBy: z.number().nullable().optional()
})
