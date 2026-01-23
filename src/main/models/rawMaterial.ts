import z from 'zod'

export const MaterialTypeSchema = z.enum(['active', 'excipient', 'solvent'])

export const RawMaterialSchema = z.object({
  name: z.string().min(1),
  materialType: MaterialTypeSchema,
  internalCode: z.string().nullable().optional(),
  casCode: z.string().nullable().optional(),
  rawMaterialCategoryId: z.number().nullable().optional(),
  supplierId: z.number().nullable().optional(),
  defaultUom: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  storageTempMin: z.number().nullable().optional(),
  storageTempMax: z.number().nullable().optional(),
  storageHumidityMax: z.number().nullable().optional(),
  isLightSensitive: z.boolean().optional(),
  isControlledSubstance: z.boolean().optional(),
  molecularWeight: z.number().nullable().optional(),
  density: z.number().nullable().optional(),
  hazardClass: z.string().nullable().optional(),
  msdsUrl: z.string().nullable().optional(),
  status: z.boolean().optional(),
  description: z.string().nullable().optional(),
  stock: z.number().optional()
})

export const RawMaterialWithIdSchema = RawMaterialSchema.extend({
  id: z.number(),
  category: z
    .object({ name: z.string() })
    .nullable()
    .optional(),
  defaultSupplier: z
    .object({ nama: z.string() })
    .nullable()
    .optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional()
})
