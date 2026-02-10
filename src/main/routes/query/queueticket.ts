import { createCrudRoutes } from '@main/utils/crud'
import { QueueTicketResponseSchema } from 'simrs-types'
import z from 'zod'

export const schemas = {
  list: {
    args: z
      .object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        items: z.number().optional(),
        page: z.number().optional()
      })
      .optional(),
    result: z.object({
      success: z.boolean(),
      data: z.array(z.any()).optional(),
      message: z.string().optional(),
      error: z.any().optional()
    })
  },
  listAll: {
    args: z
      .object({
        filter: z.string().optional(),
        equal: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        depth: z.number().optional()
      })
      .optional(),
    result: z.object({
      success: z.boolean(),
      data: z.array(QueueTicketResponseSchema),
      message: z.string().optional(),
      error: z.string().optional()
    })
  }
}

const routes = createCrudRoutes({
  entity: 'queueticket',
  schema: z.any()
})

export const { list, create, update, delete: remove, listAll, read } = routes
