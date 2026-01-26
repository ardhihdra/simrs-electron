import { createCrudRoutes } from '@main/utils/crud'
import { EncounterSchema, PatientSchema } from 'simrs-types'
import z from 'zod'

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      data: z
        .array(
          EncounterSchema.extend({
            patient: PatientSchema.optional(),
            queueTicket: z.any().optional()
          })
        )
        .optional(),
      error: z.string().optional()
    }),
    args: z.object({
      filter: z.string(),
      equal: z.string(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      depth: z.number()
    })
  }
}

const routes = createCrudRoutes({
  entity: 'encounter',
  schema: z.any()
})

export const { list } = routes
