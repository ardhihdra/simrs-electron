import z from 'zod'

export const OkRequestSchema = z.object({
  id: z.number().optional(),
  kode: z.string().optional().nullable(),
  encounterId: z.string(),
  sourceUnit: z.enum(['rajal', 'ranap', 'igd', 'vk']),
  dpjpId: z.number(),
  surgeonId: z.number().optional().nullable(),
  anesthesiologistId: z.number().optional().nullable(),
  referrerId: z.number().optional().nullable(),
  operatingRoomId: z.number().optional().nullable(),
  requestedAt: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  estimatedDurationMinutes: z.number().optional().nullable(),
  priority: z.enum(['elective', 'urgent', 'emergency']),
  status: z.enum(['draft', 'verified', 'rejected', 'in_progress', 'done', 'cancelled']),
  mainDiagnosis: z.string().optional().nullable(),
  plannedProcedureSummary: z.string().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  markers: z.any().optional().nullable(),
  dokumenPendukung: z.string().optional().nullable(),
  createdBy: z.number().optional().nullable(),
  updatedBy: z.number().optional().nullable()
})

export const OkRequestSchemaWithId = OkRequestSchema.extend({
  id: z.number(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
  deleted_at: z.string().optional().nullable()
})
