import z from 'zod'
import type { IpcContext } from '../../ipc/router'

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
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) return { success: false, data: [], error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/jadwalpraktekdokter?items=100&depth=1`
    const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-access-token': token } })
    const BackendListSchema = z.object({ success: z.boolean(), result: BackendScheduleSchema.array().optional(), pagination: z.object({ page: z.number(), pages: z.number(), count: z.number() }).optional(), message: z.string().optional(), error: z.string().optional() })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendListSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal mengambil data jadwal dokter (HTTP ${res.status})`
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
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/jadwalpraktekdokter/read/${args.id}?depth=1`
    const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-access-token': token } })
    const BackendReadSchema = z.object({ success: z.boolean(), result: BackendScheduleSchema.optional(), message: z.string().optional(), error: z.string().optional() })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendReadSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal mengambil detail jadwal dokter (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result ? toUiSchedule(parsed.data.result) : undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const findUrl = `${root}/api/kepegawaian?fields=namaLengkap&q=${encodeURIComponent(args.doctorName)}&hakAkses=doctor&items=1`
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-access-token': token }
    const resFind = await fetch(findUrl, { method: 'GET', headers })
    const BackendFindSchema = z.object({ success: z.boolean(), result: z.array(z.object({ id: z.number(), namaLengkap: z.string().optional() })).optional() })
    const rawFind = await resFind.json().catch(() => ({ success: false }))
    const parsedFind = BackendFindSchema.safeParse(rawFind)
    const pegawaiId = parsedFind.success && parsedFind.data.success && Array.isArray(parsedFind.data.result) && parsedFind.data.result.length > 0 ? parsedFind.data.result[0].id : undefined
    if (typeof pegawaiId !== 'number') {
      return { success: false, error: 'Dokter tidak ditemukan di data pegawai.' }
    }
    const url = `${root}/api/jadwalpraktekdokter`
    const payload = { pegawaiId, poli: args.poli, monday: args.monday ?? null, tuesday: args.tuesday ?? null, wednesday: args.wednesday ?? null, thursday: args.thursday ?? null, friday: args.friday ?? null, saturday: args.saturday ?? null, sunday: args.sunday ?? null }
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
    const BackendCreateSchema = z.object({ success: z.boolean(), result: BackendScheduleSchema.optional(), message: z.string().optional(), error: z.string().optional() })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendCreateSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal membuat jadwal dokter (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result ? toUiSchedule(parsed.data.result) : undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-access-token': token }
    let pegawaiId: number | undefined
    if (args.doctorName && args.doctorName.trim().length > 0) {
      const findUrl = `${root}/api/kepegawaian?fields=namaLengkap&q=${encodeURIComponent(args.doctorName)}&hakAkses=doctor&items=1`
      const resFind = await fetch(findUrl, { method: 'GET', headers })
      const BackendFindSchema = z.object({ success: z.boolean(), result: z.array(z.object({ id: z.number(), namaLengkap: z.string().optional() })).optional() })
      const rawFind = await resFind.json().catch(() => ({ success: false }))
      const parsedFind = BackendFindSchema.safeParse(rawFind)
      pegawaiId = parsedFind.success && parsedFind.data.success && Array.isArray(parsedFind.data.result) && parsedFind.data.result.length > 0 ? parsedFind.data.result[0].id : undefined
    }
    if (typeof pegawaiId !== 'number') {
      const readUrl = `${root}/api/jadwalpraktekdokter/read/${args.id}`
      const resRead = await fetch(readUrl, { method: 'GET', headers })
      const BackendReadSchema = z.object({ success: z.boolean(), result: BackendScheduleSchema.optional() })
      const rawRead = await resRead.json().catch(() => ({ success: false }))
      const parsedRead = BackendReadSchema.safeParse(rawRead)
      pegawaiId = parsedRead.success && parsedRead.data.success && parsedRead.data.result?.pegawaiId ? parsedRead.data.result.pegawaiId : undefined
    }
    if (typeof pegawaiId !== 'number') {
      return { success: false, error: 'Gagal menentukan pegawai untuk jadwal dokter.' }
    }
    const url = `${root}/api/jadwalpraktekdokter/${args.id}`
    const payload = { pegawaiId, poli: args.poli, monday: args.monday ?? null, tuesday: args.tuesday ?? null, wednesday: args.wednesday ?? null, thursday: args.thursday ?? null, friday: args.friday ?? null, saturday: args.saturday ?? null, sunday: args.sunday ?? null }
    const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(payload) })
    const BackendUpdateSchema = z.object({ success: z.boolean(), result: BackendScheduleSchema.optional(), message: z.string().optional(), error: z.string().optional() })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendUpdateSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal memperbarui jadwal dokter (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result ? toUiSchedule(parsed.data.result) : undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/jadwalpraktekdokter/${args.id}`
    const res = await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-access-token': token } })
    const BackendDeleteSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
    const raw = await res.json().catch(() => ({ success: res.ok }))
    const parsed = BackendDeleteSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal menghapus jadwal dokter (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
