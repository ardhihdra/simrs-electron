import z from 'zod'

export const OperatingRoomSchema = z.object({
  id: z.number().optional(),
  kode: z.string(),
  nama: z.string(),
  lokasiKerjaId: z.number().optional().nullable(),
  kelas: z.string().optional().nullable(),
  kapasitas: z.number().optional().nullable(),
  status: z.string().optional().nullable(),
  fasilitas: z.any().optional().nullable(),
  createdBy: z.number().optional().nullable(),
  updatedBy: z.number().optional().nullable(),
  deletedBy: z.number().optional().nullable()
})

export const OperatingRoomSchemaWithId = OperatingRoomSchema.extend({
  id: z.number(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
  deleted_at: z.string().optional().nullable()
})
