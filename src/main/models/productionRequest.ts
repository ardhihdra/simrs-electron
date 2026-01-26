import z from 'zod'

export const ProductionRequestStatusSchema = z.enum([
  'draft',
  'approved',
  'in_progress',
  'completed',
  'cancelled'
])

export const ProductionRequestSchema = z.object({
  code: z.string().min(1),
  finishedGoodMedicineId: z.number(),
  productionFormulaId: z.number(),
  qtyPlanned: z.number(),
  status: ProductionRequestStatusSchema.optional(),
  scheduledStartDate: z.string().nullable().optional(),
  scheduledEndDate: z.string().nullable().optional(),
  actualStartDate: z.string().nullable().optional(),
  actualEndDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
})

export const ProductionRequestWithIdSchema = ProductionRequestSchema.extend({
  qtyPlanned: z
    .union([z.number(), z.string()])
    .transform((value) => (typeof value === 'string' ? Number(value) : value)),
  id: z.number(),
  medicine: z
    .object({
      name: z.string()
    })
    .nullable()
    .optional(),
  formula: z
    .object({
      version: z.string()
    })
    .nullable()
    .optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional()
})
