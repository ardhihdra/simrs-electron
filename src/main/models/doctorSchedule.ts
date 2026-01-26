import z from 'zod'

const DayScheduleSchema = z.object({
    enabled: z.boolean(),
    startTime: z.string(), // format: "HH:mm"
    endTime: z.string()    // format: "HH:mm"
})

export const DoctorScheduleSchemaWithId = z.object({
    id: z.number(),
    idPegawai: z.number(),
    idPoli: z.number(),
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
    poli: z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().optional().nullable(),
        location: z.string().optional().nullable()
    }).optional().nullable()
})

export const DoctorScheduleSchema = z.object({
    idPegawai: z.number(),
    idPoli: z.number(),
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
