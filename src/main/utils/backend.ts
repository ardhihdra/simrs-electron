import z from 'zod'
import type { IpcContext } from '@main/ipc/router'

type HeadersMap = Record<string, string>

type BackendClient = {
  base: string
  token: string
  headers: HeadersMap
  get: (path: string) => Promise<Response>
  post: (path: string, body?: unknown) => Promise<Response>
  put: (path: string, body?: unknown) => Promise<Response>
  del: (path: string) => Promise<Response>
}

function normalizeBase(input: string): string {
  const s = String(input)
  return s.endsWith('/') ? s.slice(0, -1) : s
}

function joinPath(base: string, path: string): string {
  const b = normalizeBase(base)
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

export function createBackendClient(ctx: IpcContext): { ok: boolean; error?: string; client?: BackendClient } {
  const base = normalizeBase(process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810')
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) return { ok: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  const headers: HeadersMap = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-access-token': token
  }
  const client: BackendClient = {
    base,
    token,
    headers,
    get: (path) => fetch(joinPath(base, path), { method: 'GET', headers }),
    post: (path, body) => fetch(joinPath(base, path), { method: 'POST', headers, body: JSON.stringify(body ?? null) }),
    put: (path, body) => fetch(joinPath(base, path), { method: 'PUT', headers, body: JSON.stringify(body ?? null) }),
    del: (path) => fetch(joinPath(base, path), { method: 'DELETE', headers })
  }
  return { ok: true, client }
}

export async function parseBackendResponse<R>(res: Response, schema: z.ZodSchema<R>): Promise<{ ok: boolean; data?: R; error?: string }> {
  try {
    const raw = await res.json().catch(() => ({ success: false }))
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      const msg = parsed.error.message || `HTTP ${res.status}`
      return { ok: false, error: msg }
    }
    const obj = parsed.data as unknown as { success?: boolean; message?: string; error?: string }
    if (!res.ok || (typeof obj.success === 'boolean' && !obj.success)) {
      const msg = obj.error || obj.message || `HTTP ${res.status}`
      return { ok: false, error: msg }
    }
    return { ok: true, data: parsed.data }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

export function BackendListSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    success: z.boolean(),
    result: item.array().optional(),
    pagination: z.object({ page: z.number(), pages: z.number(), count: z.number() }).optional(),
    message: z.string().optional(),
    error: z.string().optional()
  })
}

