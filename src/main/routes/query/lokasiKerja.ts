import { createCrudRoutes } from '@main/utils/crud'
import z from 'zod'

export const requireSession = true

export const schemas = {
  list: {
    result: z.any()
  },
  listAll: {
    result: z.any()
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.any()
  }
} as const

const crud = createCrudRoutes({
  entity: 'lokasikerja',
  schema: z.any()
})

export const { list, listAll, read: getById } = crud
