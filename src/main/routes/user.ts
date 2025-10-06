import { withError } from '../ipc/middleware'
import { User } from '../models/user'
import { z } from 'zod'

// Middlewares to apply to all handlers in this file
export const middlewares = [withError]
export const requireSession = true

// Public shape returned over IPC (exclude sensitive fields like password)
const userPublicSchema = z.object({ id: z.string(), username: z.string() })

// Per-handler schemas for args/result validation
export const schemas = {
  list: {
    args: z.object({}),
    result: z.array(userPublicSchema)
  },
  get: {
    args: z.string(),
    result: userPublicSchema.nullable()
  },
  create: {
    args: z.object({ username: z.string().min(1), password: z.string().min(6) }),
    result: userPublicSchema
  }
} as const

export async function list() {
  const users = await User.findAll({ raw: true })
  return users.map((u: any) => ({ id: u.id.toString(), username: u.username }))
}

export async function get(id: string) {
  const u: any = await User.findByPk(Number(id), { raw: true })
  return u ? { id: u.id.toString(), username: u.username } : null
}

export async function create(data: any) {
  const u = await User.create(data)
  return { id: (u as any).id.toString(), username: (u as any).username }
}
