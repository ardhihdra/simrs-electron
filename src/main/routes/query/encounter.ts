import z from 'zod'
import { EncounterSchema, EncounterSchemaWithId } from '../../models/encounter'
import type { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backend'

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
  const init = createBackendClient(ctx)
  if (!init.ok || !init.client) {
    return { success: false, error: init.error || 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const res = await init.client.get('/api/encounter?items=100&depth=1')
    const ItemSchema = EncounterSchemaWithId.extend({
      patient: z.object({ id: z.number(), kode: z.string().optional(), name: z.string() }).optional()
    })
    const ListSchema = BackendListSchema(ItemSchema)
    type BackendListResult = z.infer<typeof ListSchema>
    const parsed = await parseBackendResponse<BackendListResult>(res, ListSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal mengambil data encounter'
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result || [] }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const init = createBackendClient(ctx)
  if (!init.ok || !init.client) {
    return { success: false, error: init.error || 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const res = await init.client.get(`/api/encounter/read/${args.id}?depth=1`)
    const ReadSchema = z.object({
      success: z.boolean(),
      result: EncounterSchemaWithId.extend({
        patient: z.object({ id: z.number(), kode: z.string().optional(), name: z.string() }).optional()
      }).optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    type BackendReadResult = z.infer<typeof ReadSchema>
    const parsed = await parseBackendResponse<BackendReadResult>(res, ReadSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal mengambil detail encounter'
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const init = createBackendClient(ctx)
  if (!init.ok || !init.client) {
    return { success: false, error: init.error || 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
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
    const res = await init.client.post('/api/encounter', payload)
    const BackendCreateSchema = z.object({
      success: z.boolean(),
      result: EncounterSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    type BackendCreateResult = z.infer<typeof BackendCreateSchema>
    const parsed = await parseBackendResponse<BackendCreateResult>(res, BackendCreateSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal membuat encounter'
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const init = createBackendClient(ctx)
  if (!init.ok || !init.client) {
    return { success: false, error: init.error || 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
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
    const res = await init.client.put(`/api/encounter/${args.id}`, payload)
    const BackendUpdateSchema = z.object({
      success: z.boolean(),
      result: EncounterSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    type BackendUpdateResult = z.infer<typeof BackendUpdateSchema>
    const parsed = await parseBackendResponse<BackendUpdateResult>(res, BackendUpdateSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal memperbarui encounter'
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const init = createBackendClient(ctx)
  if (!init.ok || !init.client) {
    return { success: false, error: init.error || 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const res = await init.client.del(`/api/encounter/${args.id}`)
    const BackendDeleteSchema = z.object({
      success: z.boolean(),
      result: z.object({}).optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    type BackendDeleteResult = z.infer<typeof BackendDeleteSchema>
    const parsed = await parseBackendResponse<BackendDeleteResult>(res, BackendDeleteSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal menghapus encounter'
      return { success: false, error: errMsg }
    }
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
