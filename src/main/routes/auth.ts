import { withError } from '@main/ipc/middleware'
import { Session as SessionStore } from '@main/ipc/protected/session-store'
import { IpcContext } from '@main/ipc/router'
import { notificationService } from '@main/services/notification-service'
import z from 'zod'

type LoginArgs = { username: string; password: string }
type BackendLoginSuccess = {
  success: true
  result: {
    id: number
    email?: string
    namaLengkap?: string
    username: string
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
    hakAksesId?: string
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
          username: z.string(),
          hakAksesId: z.string().optional()
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
  const url = String(base).endsWith('/')
    ? `${String(base).slice(0, -1)}/api/login`
    : `${String(base)}/api/login`
  const body = JSON.stringify({ username: data.username, password: data.password })
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  })
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
  
  // Extract token from cookie header since the API returns token via cookie
  const cookieHeader = res.headers.get('set-cookie')
  let token: string | null = null
  
  if (cookieHeader) {
    const cookies = cookieHeader.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'token') {
        token = value
        break
      }
    }
  }
  
  if (!token) {
    return { success: false, error: 'No authentication token received' }
  }
  
  const userId = json.result.id
  const username = json.result.username
  store.setUser({ id: userId,  username, hakAksesId: json.result.hakAksesId });
  const session = store.create(String(userId))
  if (typeof ctx.senderId === 'number') {
    store.authenticateWindow(ctx.senderId, session.token)
    store.setBackendTokenForWindow(ctx.senderId, token)
    notificationService.connect(token)
  }
  return { success: true, token: token, user: { id: userId, username } }
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
  // FIX ME: Temporary password for admin user, NEED BETTER LOGIN MECHANISM
  const storedUser = store.getUser();
  if (!storedUser) return { success: false, error: 'no user found' }
  return {
    success: true,
    session: s,
    user: {
      id: Number(s.userId),
      username: storedUser.username,
      hakAksesId: storedUser.hakAksesId
    }
  }
}
