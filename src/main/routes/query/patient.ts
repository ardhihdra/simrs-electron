import { PatientSchema } from '@main/models/patient'
import { createCrudRoutes } from '@main/utils/crud'
import z from 'zod'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      data: PatientSchema.array().optional(),
      error: z.string().optional()
    })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      data: PatientSchema.optional(),
      error: z.string().optional()
    })
  },
  create: {
    args: PatientSchema.partial(),
    result: z.object({
      success: z.boolean(),
      data: PatientSchema.optional(),
      error: z.string().optional()
    })
  },
  update: {
    args: PatientSchema,
    result: z.object({
      success: z.boolean(),
      data: PatientSchema.optional(),
      error: z.string().optional()
    })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), error: z.string().optional() })
  }
} as const

const routes = createCrudRoutes({
  entity: 'patient',
  schema: PatientSchema
})

export const { list, read: getById, create, update, delete: deleteById, listAll } = routes
