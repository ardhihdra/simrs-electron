import z from 'zod'
import type { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backend'

export const requireSession = true

const ScheduleSchema = z.object({
  id: z.number().optional(),
  doctorName: z.string(),
  poli: z.string(),
  monday: z.string().nullable().optional(),
  tuesday: z.string().nullable().optional(),
  wednesday: z.string().nullable().optional(),
  thursday: z.string().nullable().optional(),
  friday: z.string().nullable().optional(),
  saturday: z.string().nullable().optional(),
  sunday: z.string().nullable().optional()
})

const BackendScheduleSchema = z.object({
  id: z.number().optional(),
  pegawaiId: z.number(),
  poli: z.string(),
  monday: z.string().nullable().optional(),
  tuesday: z.string().nullable().optional(),
  wednesday: z.string().nullable().optional(),
  thursday: z.string().nullable().optional(),
  friday: z.string().nullable().optional(),
  saturday: z.string().nullable().optional(),
  sunday: z.string().nullable().optional(),
  dokter: z
    .object({ id: z.number().optional(), namaLengkap: z.string().optional() })
    .nullable()
    .optional()
})

function toUiSchedule(item: z.infer<typeof BackendScheduleSchema>) {
  const name = item.dokter?.namaLengkap ?? ''
  return {
    id: item.id,
    doctorName: name,
    poli: item.poli,
    monday: item.monday ?? null,
    tuesday: item.tuesday ?? null,
    wednesday: item.wednesday ?? null,
    thursday: item.thursday ?? null,
    friday: item.friday ?? null,
    saturday: item.saturday ?? null,
    sunday: item.sunday ?? null
  }
}

export const schemas = {
  list: {
    result: z.object({ success: z.boolean(), data: ScheduleSchema.array().optional(), error: z.string().optional() })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), data: ScheduleSchema.optional(), error: z.string().optional() })
  },
  create: {
    args: ScheduleSchema.omit({ id: true }),
    result: z.object({ success: z.boolean(), data: ScheduleSchema.optional(), error: z.string().optional() })
  },
  update: {
    args: ScheduleSchema.required({ id: true }),
    result: z.object({ success: z.boolean(), data: ScheduleSchema.optional(), error: z.string().optional() })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), error: z.string().optional() })
  }
} as const

export const list = async (ctx: IpcContext) => {
  const init = createBackendClient(ctx)
  if (!init.ok || !init.client) return { success: false, data: [], error: init.error || 'Gagal inisialisasi client backend.' }
  try {
    const res = await init.client.get('/api/jadwalpraktekdokter?items=100&depth=1')
    const ListSchema = BackendListSchema(BackendScheduleSchema)
    type BackendListResult = z.infer<typeof ListSchema>
    const parsed = await parseBackendResponse<BackendListResult>(res, ListSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal mengambil data jadwal dokter'
      return { success: false, data: [], error: errMsg }
    }
    const items = (parsed.data.result || []).map(toUiSchedule)
    return { success: true, data: items }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, data: [], error: msg }
  }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const init = createBackendClient(ctx)
  if (!init.ok || !init.client) return { success: false, error: init.error || 'Gagal inisialisasi client backend.' }
  try {
    const res = await init.client.get(`/api/jadwalpraktekdokter/read/${args.id}?depth=1`)
    const ReadSchema = z.object({ success: z.boolean(), result: BackendScheduleSchema.optional(), message: z.string().optional(), error: z.string().optional() })
    type BackendReadResult = z.infer<typeof ReadSchema>
    const parsed = await parseBackendResponse<BackendReadResult>(res, ReadSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal mengambil detail jadwal dokter'
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result ? toUiSchedule(parsed.data.result) : undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const init = createBackendClient(ctx)
  if (!init.ok || !init.client) return { success: false, error: init.error || 'Gagal inisialisasi client backend.' }
  try {
    const findRes = await init.client.get(`/api/kepegawaian?fields=namaLengkap&q=${encodeURIComponent(args.doctorName)}&hakAkses=doctor&items=1`)
    const FindSchema = BackendListSchema(z.object({ id: z.number(), namaLengkap: z.string().optional() }))
    type BackendFindResult = z.infer<typeof FindSchema>
    const parsedFind = await parseBackendResponse<BackendFindResult>(findRes, FindSchema)
    const pegawaiId = parsedFind.ok && parsedFind.data?.success && parsedFind.data.result && parsedFind.data.result.length > 0 ? parsedFind.data.result[0].id : undefined
    if (typeof pegawaiId !== 'number') {
      return { success: false, error: 'Dokter tidak ditemukan di data pegawai.' }
    }
    const payload = { pegawaiId, poli: args.poli, monday: args.monday ?? null, tuesday: args.tuesday ?? null, wednesday: args.wednesday ?? null, thursday: args.thursday ?? null, friday: args.friday ?? null, saturday: args.saturday ?? null, sunday: args.sunday ?? null }
    const res = await init.client.post('/api/jadwalpraktekdokter', payload)
    const CreateSchema = z.object({ success: z.boolean(), result: BackendScheduleSchema.optional(), message: z.string().optional(), error: z.string().optional() })
    type BackendCreateResult = z.infer<typeof CreateSchema>
    const parsed = await parseBackendResponse<BackendCreateResult>(res, CreateSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal membuat jadwal dokter'
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result ? toUiSchedule(parsed.data.result) : undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const init = createBackendClient(ctx)
  if (!init.ok || !init.client) return { success: false, error: init.error || 'Gagal inisialisasi client backend.' }
  try {
    let pegawaiId: number | undefined
    if (args.doctorName && args.doctorName.trim().length > 0) {
      const findRes = await init.client.get(`/api/kepegawaian?fields=namaLengkap&q=${encodeURIComponent(args.doctorName)}&hakAkses=doctor&items=1`)
      const FindSchema = BackendListSchema(z.object({ id: z.number(), namaLengkap: z.string().optional() }))
      type BackendFindResult = z.infer<typeof FindSchema>
      const parsedFind = await parseBackendResponse<BackendFindResult>(findRes, FindSchema)
      pegawaiId = parsedFind.ok && parsedFind.data?.success && parsedFind.data.result && parsedFind.data.result.length > 0 ? parsedFind.data.result[0].id : undefined
    }
    if (typeof pegawaiId !== 'number') {
      const readRes = await init.client.get(`/api/jadwalpraktekdokter/read/${args.id}`)
      const ReadSchema = z.object({ success: z.boolean(), result: BackendScheduleSchema.optional() })
      type BackendReadResult = z.infer<typeof ReadSchema>
      const parsedRead = await parseBackendResponse<BackendReadResult>(readRes, ReadSchema)
      pegawaiId = parsedRead.ok && parsedRead.data?.success && parsedRead.data.result?.pegawaiId ? parsedRead.data.result.pegawaiId : undefined
    }
    if (typeof pegawaiId !== 'number') {
      return { success: false, error: 'Gagal menentukan pegawai untuk jadwal dokter.' }
    }
    const payload = { pegawaiId, poli: args.poli, monday: args.monday ?? null, tuesday: args.tuesday ?? null, wednesday: args.wednesday ?? null, thursday: args.thursday ?? null, friday: args.friday ?? null, saturday: args.saturday ?? null, sunday: args.sunday ?? null }
    const res = await init.client.put(`/api/jadwalpraktekdokter/${args.id}`, payload)
    const UpdateSchema = z.object({ success: z.boolean(), result: BackendScheduleSchema.optional(), message: z.string().optional(), error: z.string().optional() })
    type BackendUpdateResult = z.infer<typeof UpdateSchema>
    const parsed = await parseBackendResponse<BackendUpdateResult>(res, UpdateSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal memperbarui jadwal dokter'
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result ? toUiSchedule(parsed.data.result) : undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const init = createBackendClient(ctx)
  if (!init.ok || !init.client) return { success: false, error: init.error || 'Gagal inisialisasi client backend.' }
  try {
    const res = await init.client.del(`/api/jadwalpraktekdokter/${args.id}`)
    const DeleteSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
    type BackendDeleteResult = z.infer<typeof DeleteSchema>
    const parsed = await parseBackendResponse<BackendDeleteResult>(res, DeleteSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal menghapus jadwal dokter'
      return { success: false, error: errMsg }
    }
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
