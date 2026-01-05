import z from 'zod'

export const AssetSchema = z.object({
  assetCode: z.string().min(1),
  assetMasterId: z.number(),
  serialNumber: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.number().optional().nullable(),
  fundingSource: z.enum(['BLUD', 'APBN', 'HIBAH']).optional().nullable(),
  currentLocationId: z.number().optional().nullable(),
  status: z.enum(['REGISTERED', 'IN_USE', 'MAINTENANCE', 'BROKEN', 'DISPOSED']).default('REGISTERED'),
  condition: z.enum(['GOOD', 'FAIR', 'POOR']).default('GOOD')
})

export const AssetSchemaWithId = AssetSchema.extend({
  id: z.number(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  deletedAt: z.string().optional().nullable()
})

