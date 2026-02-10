import z from 'zod'
import { MedicineBrandWithIdSchema } from './medicineBrand'
import { MedicineCategoryWithIdSchema } from './medicineCategory'

export const MedicineSchema = z.object({
  name: z.string().min(1),
  medicineCategoryId: z.number(),
  medicineBrandId: z.number(),
  saltComposition: z.string().nullable().optional(),
  buyingPrice: z.coerce.number(),
  sellingPrice: z.coerce.number(),
  sideEffects: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  minimumStock: z.number().nullable().optional(),
  stock: z.number().optional()
})

export const MedicineWithIdSchema = MedicineSchema.extend({
  id: z.number(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional(),
  category: MedicineCategoryWithIdSchema.optional(),
  brand: MedicineBrandWithIdSchema.optional()
})

