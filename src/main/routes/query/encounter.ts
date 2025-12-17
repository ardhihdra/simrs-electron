import z from 'zod'
import { EncounterSchema, EncounterSchemaWithId } from '../../models/encounter'
import { IpcContext } from '../../ipc/router'

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
      data: EncounterSchemaWithId.extend({
        patient: z
          .object({
            id: z.number(),
            kode: z.string().optional(),
            name: z.string()
          })
          .optional()
      })
        .array()
        .optional(),
      error: z.string().optional()
    })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      data: EncounterSchemaWithId.extend({
        patient: z
          .object({
            id: z.number(),
            kode: z.string().optional(),
            name: z.string()
          })
          .optional()
      }).optional(),
      error: z.string().optional()
    })
  },
  create: {
    args: EncounterSchema,
    result: z.object({
      success: z.boolean(),
      data: EncounterSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  update: {
    args: EncounterSchemaWithId,
    result: z.object({
      success: z.boolean(),
      data: EncounterSchemaWithId.optional(),
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
    return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/encounter?items=100&depth=1`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-access-token': token
      }
    })
    const BackendListSchema = z.object({
      success: z.boolean(),
      result: EncounterSchemaWithId.extend({
        patient: z
          .object({ id: z.number(), kode: z.string().optional(), name: z.string() })
          .optional()
      })
        .array()
        .optional(),
      pagination: z.object({ page: z.number(), pages: z.number(), count: z.number() }).optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendListSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal mengambil data encounter (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result || [] }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const getById = async (_ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  try {
    const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
    const token = _ctx?.sessionStore?.getBackendTokenForWindow?.(_ctx.senderId)
    if (!token) {
      return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
    }
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/encounter/read/${args.id}?depth=1`
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
      result: EncounterSchemaWithId.extend({
        patient: z
          .object({ id: z.number(), kode: z.string().optional(), name: z.string() })
          .optional()
      }).optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendReadSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal mengambil detail encounter (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const create = async (_ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  try {
    const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
    const token = _ctx?.sessionStore?.getBackendTokenForWindow?.(_ctx.senderId)
    if (!token) {
      return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
    }
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/encounter`
    const payload = {
      patientId: Number(args.patientId),
      visitDate: args.visitDate instanceof Date ? args.visitDate : new Date(String(args.visitDate)),
      serviceType: String(args.serviceType),
      reason: args.reason ?? null,
      note: args.note ?? null,
      status: String(args.status),
      resourceType: 'Encounter',
      period:
        args.period ?? {
          start: args.visitDate instanceof Date ? args.visitDate.toISOString() : String(args.visitDate) || undefined
        },
      subject: { reference: `Patient/${Number(args.patientId)}` },
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
      result: EncounterSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendCreateSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal membuat encounter (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const update = async (_ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  try {
    const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
    const token = _ctx?.sessionStore?.getBackendTokenForWindow?.(_ctx.senderId)
    if (!token) {
      return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
    }
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/encounter/${args.id}`
    const payload = {
      patientId: Number(args.patientId),
      visitDate: args.visitDate instanceof Date ? args.visitDate : new Date(String(args.visitDate)),
      serviceType: String(args.serviceType),
      reason: args.reason ?? null,
      note: args.note ?? null,
      status: String(args.status),
      period:
        args.period ?? {
          start: args.visitDate instanceof Date ? args.visitDate.toISOString() : String(args.visitDate) || undefined
        },
      subject: { reference: `Patient/${Number(args.patientId)}` },
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
      result: EncounterSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendUpdateSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal memperbarui encounter (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const deleteById = async (_ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  try {
    const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
    const token = _ctx?.sessionStore?.getBackendTokenForWindow?.(_ctx.senderId)
    if (!token) {
      return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
    }
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/encounter/${args.id}`
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
      error: z.string().optional()
    })
    const raw = await res.json().catch(() => ({ success: res.ok }))
    const parsed = BackendDeleteSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal menghapus encounter (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
