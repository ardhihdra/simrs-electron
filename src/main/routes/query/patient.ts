import z from 'zod'
import { PatientSchema, PatientSchemaWithId } from '../../models/patient'
import type { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backend'

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
  const init = createBackendClient(ctx)
  if (!init.ok || !init.client) {
    return { success: false, error: init.error || 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const res = await init.client.get('/api/patient?items=100')
    const ListSchema = BackendListSchema(PatientSchemaWithId)
    type BackendListResult = z.infer<typeof ListSchema>
    const parsed = await parseBackendResponse<BackendListResult>(res, ListSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal mengambil data pasien'
      return { success: false, error: errMsg }
    }
    const data = parsed.data.result || []
    return { success: true, data }
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
    const res = await init.client.get(`/api/patient/read/${args.id}`)
    const ReadSchema = z.object({ success: z.boolean(), result: PatientSchemaWithId.optional(), message: z.string().optional(), error: z.string().optional() })
    type BackendReadResult = z.infer<typeof ReadSchema>
    const parsed = await parseBackendResponse<BackendReadResult>(res, ReadSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal mengambil detail pasien'
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
    const res = await init.client.post('/api/patient', payload)
    const BackendCreateSchema = z.object({
      success: z.boolean(),
      result: PatientSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    type BackendCreateResult = z.infer<typeof BackendCreateSchema>
    const parsed = await parseBackendResponse<BackendCreateResult>(res, BackendCreateSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal membuat pasien'
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
    const res = await init.client.put(`/api/patient/${args.id}`, payload)
    const BackendUpdateSchema = z.object({
      success: z.boolean(),
      result: PatientSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    type BackendUpdateResult = z.infer<typeof BackendUpdateSchema>
    const parsed = await parseBackendResponse<BackendUpdateResult>(res, BackendUpdateSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal memperbarui pasien'
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
    const res = await init.client.del(`/api/patient/${args.id}`)
    const BackendDeleteSchema = z.object({
      success: z.boolean(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    type BackendDeleteResult = z.infer<typeof BackendDeleteSchema>
    const parsed = await parseBackendResponse<BackendDeleteResult>(res, BackendDeleteSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal menghapus pasien'
      return { success: false, error: errMsg }
    }
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
