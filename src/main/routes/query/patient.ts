import z from 'zod'
import { PatientSchema, PatientSchemaWithId } from '../../models/patient'
import { IpcContext } from '../../ipc/router'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      data: PatientSchemaWithId.array().optional(),
      error: z.string().optional()
    })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      data: PatientSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  create: {
    args: PatientSchema.partial(),
    result: z.object({
      success: z.boolean(),
      data: PatientSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  update: {
    args: PatientSchemaWithId,
    result: z.object({
      success: z.boolean(),
      data: PatientSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), error: z.string().optional() })
  }
} as const

export const list = async (ctx: IpcContext) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  console.log('[ipc:patient.list] senderId=', ctx.senderId, 'apiBase=', base)
  if (!token) {
    console.warn('[ipc:patient.list] missing token for senderId=', ctx.senderId)
    return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/patient?items=100`
    console.log('[ipc:patient.list] GET', url)
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-access-token': token
      }
    })
    console.log('[ipc:patient.list] status=', res.status, 'ok=', res.ok)
    const BackendListSchema = z.object({
      success: z.boolean(),
      result: PatientSchemaWithId.array().optional(),
      pagination: z
        .object({ page: z.number(), pages: z.number(), count: z.number() })
        .optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    console.log('[ipc:patient.list] keys=', Object.keys(raw || {}))
    const parsed = BackendListSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal mengambil data pasien (HTTP ${res.status})`
      console.warn('[ipc:patient.list] error=', errMsg)
      return { success: false, error: errMsg }
    }
    const data = parsed.data.result || []
    console.log('[ipc:patient.list] received=', Array.isArray(data) ? data.length : 0)
    return { success: true, data }
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err))
    console.error('[ipc:patient.list] exception=', msg)
    return { success: false, error: msg }
  }
}

export const getById = async (_ctx, args: z.infer<typeof schemas.getById.args>) => {
  try {
    const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
    const token = _ctx?.sessionStore?.getBackendTokenForWindow?.(_ctx.senderId)
    if (!token) {
      return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
    }
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/patient/read/${args.id}`
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
      result: PatientSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendReadSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal mengambil detail pasien (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const create = async (_ctx, args: z.infer<typeof schemas.create.args>) => {
  try {
    const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
    const token = _ctx?.sessionStore?.getBackendTokenForWindow?.(_ctx.senderId)
    if (!token) {
      return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
    }
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/patient`
    const payload = {
      active: args.active ?? true,
      identifier: args.identifier ?? null,
      kode: String(args.kode),
      name: String(args.name),
      gender: String(args.gender),
      birthDate: args.birthDate instanceof Date ? args.birthDate : new Date(args.birthDate || ''),
      placeOfBirth: args.placeOfBirth ?? null,
      phone: args.phone ?? null,
      email: args.email ?? null,
      addressLine: args.addressLine ?? null,
      province: args.province ?? null,
      city: args.city ?? null,
      district: args.district ?? null,
      village: args.village ?? null,
      postalCode: args.postalCode ?? null,
      country: args.country ?? null,
      maritalStatus: args.maritalStatus ?? null,
      createdBy: args.createdBy ?? null
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
      result: PatientSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendCreateSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal membuat pasien (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const update = async (_ctx, args: z.infer<typeof schemas.update.args>) => {
  try {
    const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
    const token = _ctx?.sessionStore?.getBackendTokenForWindow?.(_ctx.senderId)
    if (!token) {
      return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
    }
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/patient/${args.id}`
    const payload = {
      active: args.active,
      identifier: args.identifier,
      kode: args.kode,
      name: args.name,
      gender: args.gender,
      birthDate: args.birthDate instanceof Date ? args.birthDate : new Date(args.birthDate || ''),
      placeOfBirth: args.placeOfBirth,
      phone: args.phone,
      email: args.email,
      addressLine: args.addressLine,
      province: args.province,
      city: args.city,
      district: args.district,
      village: args.village,
      postalCode: args.postalCode,
      country: args.country,
      maritalStatus: args.maritalStatus,
      updatedBy: args.updatedBy ?? null
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
      result: PatientSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendUpdateSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal memperbarui pasien (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const deleteById = async (_ctx, args: z.infer<typeof schemas.deleteById.args>) => {
  try {
    const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
    const token = _ctx?.sessionStore?.getBackendTokenForWindow?.(_ctx.senderId)
    if (!token) {
      return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
    }
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/patient/${args.id}`
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
      message: z.string().optional(),
      error: z.string().optional()
    })
    const raw = await res.json().catch(() => ({ success: res.ok }))
    const parsed = BackendDeleteSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal menghapus pasien (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
