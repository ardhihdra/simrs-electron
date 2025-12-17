import z from 'zod'

import { IpcContext } from '../../ipc/router'
import { DiagnosticReportSchema, DiagnosticReportSchemaWithId } from '../../models/DiagnosticReport'

export const requireSession = true

export const schemas = {
  list: {
    args: z.any(),
    result: z.object({
      success: z.boolean(),
      data: DiagnosticReportSchemaWithId.array().optional(),
      error: z.string().optional()
    })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      data: DiagnosticReportSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  create: {
    args: DiagnosticReportSchema,
    result: z.object({
      success: z.boolean(),
      data: DiagnosticReportSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  update: {
    args: DiagnosticReportSchemaWithId,
    result: z.object({
      success: z.boolean(),
      data: DiagnosticReportSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), error: z.string().optional() })
  }
} as const

export const list = async (ctx: IpcContext, _args?: z.infer<typeof schemas.list.args>) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) {
    return {
      success: false,
      error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.'
    }
  }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/diagnosticreport?items=100&depth=1`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-access-token': token
      }
    })
    const BackendListSchema = z.any() // Adjust if backend has strict structure, for now use loose
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendListSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const rawError = parsed.success
        ? parsed.data.error || parsed.data.message
        : parsed.error.message
      const errMsg =
        typeof rawError === 'object'
          ? JSON.stringify(rawError)
          : String(rawError || `Gagal mengambil data diagnostic (HTTP ${res.status})`)
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result || [] }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  try {
    const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
    const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
    if (!token) {
      return {
        success: false,
        error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.'
      }
    }
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/diagnosticreport/${args.id}/read`
    console.log('FETCHING TO:', url)
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-access-token': token
      }
    })
    const BackendReadSchema = z.object({
      success: z.boolean(),
      result: DiagnosticReportSchemaWithId.optional().nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    console.log('[diagnostic.getById] raw response:', JSON.stringify(raw, null, 2))
    const parsed = BackendReadSchema.safeParse(raw)
    console.log('[diagnostic.getById] parsed:', parsed.success ? 'OK' : parsed.error)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const rawError = parsed.success
        ? parsed.data.error || parsed.data.message
        : parsed.error.message
      const errMsg =
        typeof rawError === 'object'
          ? JSON.stringify(rawError)
          : String(rawError || `Gagal mengambil detail diagnostic (HTTP ${res.status})`)
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  try {
    const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
    const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
    if (!token) {
      return {
        success: false,
        error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.'
      }
    }
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/diagnosticreport`

    const payload = {
      ...args,
      subjectId: String(args.subjectId),
      // Ensure dates are stringified
      effectiveDateTime:
        args.effectiveDateTime instanceof Date
          ? args.effectiveDateTime.toISOString()
          : args.effectiveDateTime,
      effectivePeriodStart:
        args.effectivePeriodStart instanceof Date
          ? args.effectivePeriodStart.toISOString()
          : args.effectivePeriodStart,
      effectivePeriodEnd:
        args.effectivePeriodEnd instanceof Date
          ? args.effectivePeriodEnd.toISOString()
          : args.effectivePeriodEnd,
      issued: args.issued instanceof Date ? args.issued.toISOString() : args.issued
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-access-token': token
      },
      body: JSON.stringify(payload)
    })
    const BackendCreateSchema = z.object({
      success: z.boolean(),
      result: DiagnosticReportSchemaWithId.optional().nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendCreateSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const rawError = parsed.success
        ? parsed.data.error || parsed.data.message
        : parsed.error.message
      const errMsg =
        typeof rawError === 'object'
          ? JSON.stringify(rawError)
          : String(rawError || `Gagal membuat diagnostic (HTTP ${res.status})`)
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  try {
    const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
    const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
    if (!token) {
      return {
        success: false,
        error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.'
      }
    }
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/diagnosticreport/${args.id}`

    const payload = {
      ...args,
      subjectId: String(args.subjectId),
      // Ensure dates are stringified
      effectiveDateTime:
        args.effectiveDateTime instanceof Date
          ? args.effectiveDateTime.toISOString()
          : args.effectiveDateTime,
      effectivePeriodStart:
        args.effectivePeriodStart instanceof Date
          ? args.effectivePeriodStart.toISOString()
          : args.effectivePeriodStart,
      effectivePeriodEnd:
        args.effectivePeriodEnd instanceof Date
          ? args.effectivePeriodEnd.toISOString()
          : args.effectivePeriodEnd,
      issued: args.issued instanceof Date ? args.issued.toISOString() : args.issued
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-access-token': token
      },
      body: JSON.stringify(payload)
    })
    const BackendUpdateSchema = z.object({
      success: z.boolean(),
      result: DiagnosticReportSchemaWithId.optional().nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendUpdateSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const rawError = parsed.success
        ? parsed.data.error || parsed.data.message
        : parsed.error.message
      const errMsg =
        typeof rawError === 'object'
          ? JSON.stringify(rawError)
          : String(rawError || `Gagal memperbarui diagnostic (HTTP ${res.status})`)
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const deleteById = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.deleteById.args>
) => {
  try {
    const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
    const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
    if (!token) {
      return {
        success: false,
        error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.'
      }
    }
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/diagnosticreport/${args.id}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-access-token': token
      }
    })
    const BackendDeleteSchema = z.object({
      success: z.boolean(),
      result: z.object({}).optional(),
      message: z.string().optional(),
      error: z.any().optional()
    })
    const raw = await res.json().catch(() => ({ success: res.ok }))
    const parsed = BackendDeleteSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const rawError = parsed.success
        ? parsed.data.error || parsed.data.message
        : parsed.error.message
      const errMsg =
        typeof rawError === 'object'
          ? JSON.stringify(rawError)
          : String(rawError || `Gagal menghapus diagnostic (HTTP ${res.status})`)
      return { success: false, error: errMsg }
    }
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
