import z from 'zod'
import { KepegawaianSchemaWithId } from './kepegawaian'

export const DoctorLeaveSchema = z.object({
    idPegawai: z.number(),
    tanggalMulai: z.union([z.string(), z.date()]),
    tanggalSelesai: z.union([z.string(), z.date()]),
    keterangan: z.string().optional().nullable(),
    status: z.enum(['active', 'cancelled']).default('active'),
    createdBy: z.number().optional().nullable(),
    updatedBy: z.number().optional().nullable(),
    deletedBy: z.number().optional().nullable()
})

export const DoctorLeaveSchemaWithId = DoctorLeaveSchema.extend({
    id: z.number(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    deleted_at: z.string().optional().nullable(),
    pegawai: KepegawaianSchemaWithId.optional().nullable()
})
