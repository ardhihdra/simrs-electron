import { createCrudRoutes } from '@main/utils/crud'
import { PatientDomainSchema } from 'simrs-types'
import z from 'zod'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      data: PatientDomainSchema.array().optional(),
      error: z.string().optional()
    }),
    args: z.object({
      nik: z.string().optional()
    })
  }
}

const routes = createCrudRoutes({
  entity: 'module/registration/patients',
  schema: PatientDomainSchema
})

export const { list, listAll, read, create, update, delete: deleteById } = routes
