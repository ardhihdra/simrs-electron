import z from 'zod'
import { withError } from '../ipc/middleware'
import { Session as SessionStore } from '../ipc/protected/session-store'
import { IpcContext } from '../ipc/router'
import { User } from '../models/user'

type LoginArgs = { username: string; password: string }
type BackendLoginSuccess = {
  success: true
  result: {
    id: number
    email?: string
    namaLengkap?: string
    nik: string
    token: string
    hakAksesId?: string
  }
  message?: string
}
type BackendLoginFailure = { success: false; message?: string }

export type Session = {
  session: SessionStore
  user: {
    id: number
    username: string
  }
}

export const schemas = {
  getSession: {
    result: z.object({
      success: z.boolean(),
      session: z.object(),
      user: z
        .object({
          id: z.union([z.string(), z.number()]),
          username: z.string()
        })
        .optional()
    })
  }
} as const

export const middlewares = [withError]

// Token-based login: validates credentials and returns a session token
export async function login(ctx: IpcContext, data: LoginArgs) {
  const store = ctx.sessionStore
  if (!store) return { success: false, error: 'session store unavailable' }

  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const url = String(base).endsWith('/') ? `${String(base).slice(0, -1)}/api/login` : `${String(base)}/api/login`
  const body = JSON.stringify({ nik: data.username, password: data.password })
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
  if (!res.ok) {
    try {
      const errJson = (await res.json()) as BackendLoginFailure
      return { success: false, error: errJson.message ?? 'login failed' }
    } catch {
      return { success: false, error: `login failed (${res.status})` }
    }
  }
  const json = (await res.json()) as BackendLoginSuccess | BackendLoginFailure
  if (!json || json.success !== true) {
    return { success: false, error: (json as BackendLoginFailure)?.message ?? 'invalid response' }
  }
  const userId = json.result.id
  const username = json.result.nik
  const session = store.create(String(userId))
  if (typeof ctx.senderId === 'number') {
    store.authenticateWindow(ctx.senderId, session.token)
    store.setBackendTokenForWindow(ctx.senderId, json.result.token)
  }
  return { success: true, token: json.result.token, user: { id: userId, username } }
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
  const user = await User.findOne({ where: { id: Number(s.userId) }, raw: true })
  return { success: true, session: s, user }
}
