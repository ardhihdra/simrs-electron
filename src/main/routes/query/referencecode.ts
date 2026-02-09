import { createCrudRoutes } from '@main/utils/crud'
import z from 'zod'

const crud = createCrudRoutes({
  entity: 'referencecode',
  schema: z.any()
})

export const { list, listAll, read, create, update, delete: remove } = crud
