import { createCrudRoutes } from '@main/utils/crud'
import z from 'zod'

const routes = createCrudRoutes({
  entity: 'module/registration/queue-tickets',
  schema: z.any()
})

export const { list, create } = routes
