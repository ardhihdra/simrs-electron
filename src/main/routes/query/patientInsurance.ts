import { createCrudRoutes } from '@main/utils/crud'
import z from 'zod'

export const requireSession = true

export const schemas = {
  list: {
    result: z.any()
  }
} as const

const routes = createCrudRoutes({
  entity: 'patientinsurance',
  schema: z.any()
})

export const { list, listAll, read: getById, create, update, delete: deleteById } = routes
