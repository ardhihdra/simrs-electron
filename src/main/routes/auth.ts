import { User } from '../models/user'
import { IpcContext } from '../ipc/router'
import { withError } from '../ipc/middleware'
import { Session as SessionStore } from '../ipc/protected/session-store'
import z from 'zod'

export type Session = {
  session: SessionStore
  user: {
    id: number
    username: string
  }
}

export const schemas = {
  getSession: {
    args: z.object({}),
    result: z.object({
      success: z.boolean(),
      session: z.string().optional(),
      user: z
        .object({
          id: z.number(),
          username: z.string()
        })
        .optional()
    })
  }
} as const

export const middlewares = [withError]

// Token-based login: validates credentials and returns a session token
export async function login(ctx: IpcContext, data: { username: string; password: string }) {
  // seed user
  const admin = await User.findOne({ where: { username: 'admin' } })
  if (!admin) {
    await User.create({ username: 'admin', password: 'admin' })
  }

  const store = ctx.sessionStore
  if (!store) return { success: false, error: 'session store unavailable' }

  const user: any = await User.findOne({ where: { username: data.username }, raw: true })
  if (!user || user.password !== data.password) {
    return { success: false, error: 'invalid credentials' }
  }

  const session = store.create(user.id)
  // Associate this window with the session for node-only auth usage
  if (typeof ctx.senderId === 'number') {
    store.authenticateWindow(ctx.senderId, session.token)
  }
  return {
    success: true,
    token: session.token,
    user: { id: user.id, username: user.username }
  }
}

// Logout for current window: delete its associated session token
export async function logout(ctx: IpcContext) {
  const store = ctx.sessionStore
  if (!store) return { success: false, error: 'session store unavailable' }
  if (typeof ctx.senderId !== 'number') {
    return { success: false, error: 'no sender window id' }
  }
  const s = store.getWindowSession(ctx.senderId)
  if (!s) return { success: false, error: 'no session for window' }
  store.delete(s.token)
  store.clearWindow(ctx.senderId)
  return { success: true }
}

// Status by token: return whether token is valid
export async function status(ctx: IpcContext, args: { token?: string }) {
  const store = ctx.sessionStore
  if (!store) return { success: false, error: 'session store unavailable' }
  const token = args?.token
  if (!token) return { success: false, authenticated: false }
  const s = store.get(token)
  if (!s) return { success: false, authenticated: false }
  return { success: true, authenticated: true, userId: s.userId }
}

export async function getSession(ctx: IpcContext) {
  const store = ctx.sessionStore
  if (!store) return { success: false, error: 'session store unavailable' }
  // Resolve session purely on the node side using window→token mapping
  if (typeof ctx.senderId !== 'number') {
    return { success: false, error: 'no sender window id' }
  }
  const s = store.getWindowSession(ctx.senderId)
  if (!s) return { success: false, error: 'no session for window' }
  const user = await User.findOne({ where: { id: s.userId }, raw: true })
  return { success: true, session: s, user }
}
