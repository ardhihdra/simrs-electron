import z from 'zod'
import { ServiceRequestSchema, ServiceRequestSchemaWithId } from '@main/models/service-request'
import { IpcContext } from '@main/ipc/router'

export const requireSession = true

export const schemas = {
  list: {
    args: z
      .object({
        q: z.string().optional()
      })
      .optional(),
    result: z.object({
      success: z.boolean(),
      data: ServiceRequestSchemaWithId.array().optional(),
      error: z.string().optional()
    })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      data: ServiceRequestSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  create: {
    args: ServiceRequestSchema,
    result: z.object({
      success: z.boolean(),
      data: ServiceRequestSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  update: {
    args: ServiceRequestSchemaWithId,
    result: z.object({
      success: z.boolean(),
      data: ServiceRequestSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), error: z.string().optional() })
  }
} as const

export const list = async (ctx: IpcContext, _args?: z.infer<typeof schemas.list.args>) => {
  // Suppress unused var warning
  void _args;
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) {
    return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    // Use 'servicerequest' as the entity name (lowercase, matching file name in simrs appModels)
    const url = `${root}/api/servicerequest?items=100`

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-access-token': token
      }
    })

    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))

    const BackendListSchema = z.object({
      success: z.boolean(),
      result: ServiceRequestSchemaWithId.array().optional(),
      data: ServiceRequestSchemaWithId.array().optional(),
      pagination: z.object({ page: z.number(), pages: z.number(), count: z.number() }).optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })

    const parsed = BackendListSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      console.error('ServiceRequest list error:', parsed.success ? parsed.data.message : parsed.error)
      return { success: false, error: parsed.success ? parsed.data.message : 'Invalid response' }
    }
    return { success: true, data: parsed.data.result || parsed.data.data || [] }
  } catch (err: unknown) {
    console.error('[serviceRequest] list exception:', err)
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export const exportCsv = async (
  ctx: IpcContext,
  args: {
    usePagination?: boolean;
    page?: number;
    items?: number;
    startDate?: string;
    endDate?: string;
  }
) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) {
    return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
  const params = new URLSearchParams()
  params.append('export', 'csv')
  if (args.usePagination) params.append('usePagination', 'true')
  if (typeof args.page === 'number') params.append('page', String(args.page))
  if (typeof args.items === 'number') params.append('items', String(args.items))
  if (args.startDate) params.append('startDate', args.startDate)
  if (args.endDate) params.append('endDate', args.endDate)
  params.append('token', token)
  const url = `${root}/api/servicerequest/export?${params.toString()}`
  return { success: true, url }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) {
    return { success: false, error: 'Token backend tidak ditemukan.' }
  }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    // Use /read/:id pattern as per backend appApi.ts
    const url = `${root}/api/servicerequest/read/${args.id}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-access-token': token
      }
    })
    const BackendDetailSchema = z.object({
      success: z.boolean(),
      result: ServiceRequestSchemaWithId.optional(),
      data: ServiceRequestSchemaWithId.optional(),
      message: z.string().optional()
    })
    const raw = await res.json()
    const parsed = BackendDetailSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      return { success: false, error: parsed.success ? parsed.data.message : 'Invalid response' }
    }
    return { success: true, data: parsed.data.result || parsed.data.data }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) {
    return { success: false, error: 'Token backend tidak ditemukan.' }
  }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/servicerequest`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-access-token': token
      },
      body: JSON.stringify(args)
    })
    const raw = await res.json()
    return { success: res.ok && raw.success, data: raw.result || raw.data, error: raw.message }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) {
    return { success: false, error: 'Token backend tidak ditemukan.' }
  }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/servicerequest/${args.id}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-access-token': token
      },
      body: JSON.stringify(args)
    })
    const raw = await res.json()
    return { success: res.ok && raw.success, data: raw.result || raw.data, error: raw.message }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) {
    return { success: false, error: 'Token backend tidak ditemukan.' }
  }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/servicerequest/${args.id}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-access-token': token
      }
    })
    const raw = await res.json()
    return { success: res.ok && raw.success, error: raw.message }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
