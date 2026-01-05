import z from 'zod'

export const AssetMaintenanceSchema = z.object({
  assetId: z.number(),
  type: z.enum(['PREVENTIVE', 'REPAIR', 'CALIBRATION']),
  vendor: z.string().optional().nullable(),
  scheduleDate: z.string().optional().nullable(),
  actualDate: z.string().optional().nullable(),
  cost: z.number().optional().nullable(),
  nextDueDate: z.string().optional().nullable(),
  documentUrl: z.string().optional().nullable()
})

export const AssetMaintenanceSchemaWithId = AssetMaintenanceSchema.extend({
  id: z.number(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  deletedAt: z.string().optional().nullable()
})

