import { RoomWithIdSchema } from '@main/models/room'
import { createCrudRoutes } from '@main/utils/crud'
import z from 'zod'

export const requireSession = true

export const schemas = {
  list: {
    result: z.any()
  },
  listAll: {
    result: z.any()
  }
} as const

const crud = createCrudRoutes({
  entity: 'room/rooms',
  schema: RoomWithIdSchema
})

export const { list, listAll } = crud
