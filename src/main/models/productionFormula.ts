import z from 'zod'

export const FormulaStatusSchema = z.enum(['draft', 'active', 'archived'])

export const ProductionFormulaItemSchema = z.object({
  rawMaterialId: z.number(),
  qty: z.number(),
  uom: z.string()
})

export const ProductionFormulaSchema = z.object({
  finishedGoodMedicineId: z.number(),
  version: z.string().min(1),
  status: FormulaStatusSchema,
  notes: z.string().nullable().optional(),
  items: ProductionFormulaItemSchema.array().nullable().optional()
})

export const ProductionFormulaWithIdSchema = ProductionFormulaSchema.extend({
  id: z.number(),
  medicine: z
    .object({
      name: z.string()
    })
    .nullable()
    .optional(),
  updatedAt: z.string().nullable().optional()
})

