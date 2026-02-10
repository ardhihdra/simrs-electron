import { PatientSchema } from '@main/models/patient'
import { createCrudRoutes } from '@main/utils/crud'
import z from 'zod'

export const requireSession = true

export const schemas = {
  list: {
    result: z.any()
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.any()
  },
  create: {
    args: PatientSchema.partial(),
    result: z.any()
  },
  update: {
    args: PatientSchema,
    result: z.any()
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.any()
  }
} as const

const routes = createCrudRoutes({
  entity: 'patient',
  schema: z.any()
})

export const { list, read: getById, create, update, delete: deleteById, listAll } = routes
