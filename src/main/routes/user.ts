import { withError } from '@main/ipc/middleware'
import { User, UserSchema } from '@main/models/user'
import { z } from 'zod'

// Middlewares to apply to all handlers in this file
export const middlewares = [withError]
export const requireSession = true

// Per-handler schemas for args/result validation
export const schemas = {
  list: {
    args: z.object({}),
    result: z.array(UserSchema)
  },
  get: {
    args: z.string(),
    result: UserSchema.nullable()
  },
  create: {
    args: z.object({ username: z.string().min(1), password: z.string().min(6) }),
    result: UserSchema
  }
} as const

export async function list() {
  const users = await User.findAll({ raw: true })
  return users
}

export async function get(id: string) {
  const u: any = await User.findByPk(id, { raw: true })
  return u
}

export async function create(data: any) {
  const u = await User.create(data)
  return u
}
