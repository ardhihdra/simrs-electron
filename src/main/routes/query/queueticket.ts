import { createCrudRoutes } from '@main/utils/crud'
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
  }
}

const routes = createCrudRoutes({
  entity: 'queueticket',
  schema: z.any()
})

export const { list, create, update, delete: remove, listAll, read } = routes
