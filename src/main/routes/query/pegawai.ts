import z from 'zod'
import { KepegawaianSchemaWithId } from '../../models/kepegawaian'
import { IpcContext } from '../../ipc/router'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      data: KepegawaianSchemaWithId.array().optional(),
      error: z.string().optional()
    })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), data: KepegawaianSchemaWithId.optional(), error: z.string().optional() })
  },
  create: {
    args: z.object({
      namaLengkap: z.string().min(1),
      email: z.string().email(),
      nik: z.string().min(1),
      tanggalLahir: z.union([z.date(), z.string()]),
      jenisKelamin: z.enum(['L', 'P']),
      alamat: z.string().nullable().optional(),
      nomorTelepon: z.string().nullable().optional(),
      hakAkses: z
        .enum(['administrator','manager','admin','admin_backoffice','operator_gudang','doctor','nurse','pharmacist','receptionist','lab_technician','radiologist','accountant','patient'])
        .nullable()
        .optional()
    }),
    result: z.object({ success: z.boolean(), data: KepegawaianSchemaWithId.optional(), error: z.string().optional() })
  },
  update: {
    args: z.object({
      id: z.number(),
      namaLengkap: z.string().min(1).optional(),
      email: z.string().email().optional(),
      nik: z.string().min(1).optional(),
      tanggalLahir: z.union([z.date(), z.string()]).optional(),
      jenisKelamin: z.enum(['L', 'P']).optional(),
      alamat: z.string().nullable().optional(),
      nomorTelepon: z.string().nullable().optional(),
      hakAkses: z
        .enum(['administrator','manager','admin','admin_backoffice','operator_gudang','doctor','nurse','pharmacist','receptionist','lab_technician','radiologist','accountant','patient'])
        .nullable()
        .optional()
    }),
    result: z.object({ success: z.boolean(), data: KepegawaianSchemaWithId.optional(), error: z.string().optional() })
  },
  deleteById: {
    args: z.object({ id: z.number(), forever: z.boolean().optional() }),
    result: z.object({ success: z.boolean(), error: z.string().optional() })
  }
} as const

const ContractItemSchema = z.object({
  id: z.number().optional(),
  pegawaiId: z.number().optional(),
  active: z.boolean().optional(),
  jenisKontrak: z.string().optional(),
  role: z.string().optional()
})

export const list = async (ctx: IpcContext) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) {
    return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const pegawaiUrl = `${root}/api/kepegawaian?items=1000`
    const kontrakUrl = `${root}/api/kontrakpegawai?items=1000`
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-access-token': token
    }
    const [resPegawai, resKontrak] = await Promise.all([
      fetch(pegawaiUrl, { method: 'GET', headers }),
      fetch(kontrakUrl, { method: 'GET', headers })
    ])

    const BackendListPegawaiSchema = z.object({
      success: z.boolean(),
      result: KepegawaianSchemaWithId.array().optional(),
      pagination: z
        .object({ page: z.number(), pages: z.number(), count: z.number() })
        .optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })

    const BackendListKontrakSchema = z.object({
      success: z.boolean(),
      result: ContractItemSchema.array().optional(),
      pagination: z
        .object({ page: z.number(), pages: z.number(), count: z.number() })
        .optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })

    const rawPegawai = await resPegawai.json().catch(() => ({ success: false, error: `HTTP ${resPegawai.status}` }))
    const rawKontrak = await resKontrak.json().catch(() => ({ success: false, error: `HTTP ${resKontrak.status}` }))
    const parsedPegawai = BackendListPegawaiSchema.safeParse(rawPegawai)
    const parsedKontrak = BackendListKontrakSchema.safeParse(rawKontrak)

    if (!resPegawai.ok || !parsedPegawai.success || !parsedPegawai.data.success) {
      const errMsg = (parsedPegawai.success ? parsedPegawai.data.error || parsedPegawai.data.message : parsedPegawai.error.message) || `Gagal mengambil data pegawai (HTTP ${resPegawai.status})`
      return { success: false, error: errMsg }
    }

    const pegawaiList = parsedPegawai.data.result || []
    const kontrakList = parsedKontrak.success && parsedKontrak.data.success ? parsedKontrak.data.result || [] : []

    const allowedRoles = new Set(['doctor', 'nurse', 'pharmacist', 'lab_technician', 'radiologist'])
    const kontrakActiveByPegawaiId = new Map<number, boolean>()
    const kontrakRoleByPegawaiId = new Map<number, string>()
    for (const k of kontrakList) {
      const id = typeof k.pegawaiId === 'number' ? k.pegawaiId : undefined
      if (id === undefined) continue
      const active = k.active === true
      const role = typeof k.role === 'string' ? k.role : undefined
      if (active) kontrakActiveByPegawaiId.set(id, true)
      if (role) kontrakRoleByPegawaiId.set(id, role)
    }

    const hasKontrak = kontrakList.length > 0
    const filtered = hasKontrak
      ? pegawaiList.filter((p) => {
          const id = typeof p.id === 'number' ? p.id : undefined
          const role = typeof p.hakAkses === 'string' ? p.hakAkses.toLowerCase() : undefined
          const kontrakActive = id !== undefined ? kontrakActiveByPegawaiId.get(id) === true : false
          const kontrakRole = id !== undefined ? String(kontrakRoleByPegawaiId.get(id)).toLowerCase() : ''
          const fromKontrakRole = kontrakActive && allowedRoles.has(kontrakRole)
          const fromHakAkses = role ? allowedRoles.has(role) : false
          return fromKontrakRole || fromHakAkses
        })
      : pegawaiList.filter((p) => p.removed !== true)

    return { success: true, data: filtered }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) {
    return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/kepegawaian/read/${args.id}`
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-access-token': token }
    })
    const BackendReadSchema = z.object({
      success: z.boolean(),
      result: KepegawaianSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendReadSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal mengambil detail pegawai (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) {
    return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/kepegawaian`
    const payload = {
      namaLengkap: args.namaLengkap,
      email: args.email,
      nik: args.nik,
      tanggalLahir: args.tanggalLahir instanceof Date ? args.tanggalLahir : new Date(String(args.tanggalLahir)),
      jenisKelamin: args.jenisKelamin,
      alamat: args.alamat ?? null,
      nomorTelepon: args.nomorTelepon ?? null,
      hakAkses: args.hakAkses ?? null
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-access-token': token },
      body: JSON.stringify(payload)
    })
    const BackendCreateSchema = z.object({
      success: z.boolean(),
      result: KepegawaianSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendCreateSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal membuat data pegawai (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) {
    return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/kepegawaian/${args.id}`
    const payload = {
      namaLengkap: args.namaLengkap,
      email: args.email,
      nik: args.nik,
      tanggalLahir: args.tanggalLahir instanceof Date ? args.tanggalLahir : args.tanggalLahir ? new Date(String(args.tanggalLahir)) : undefined,
      tanggal_lahir: args.tanggalLahir instanceof Date ? args.tanggalLahir : args.tanggalLahir ? new Date(String(args.tanggalLahir)) : undefined,
      jenisKelamin: args.jenisKelamin,
      jenis_kelamin: args.jenisKelamin,
      alamat: args.alamat ?? null,
      nomorTelepon: args.nomorTelepon ?? null,
      nomor_telepon: args.nomorTelepon ?? null,
      hakAkses: args.hakAkses ?? null
    }
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-access-token': token },
      body: JSON.stringify(payload)
    })
    const BackendUpdateSchema = z.object({
      success: z.boolean(),
      result: KepegawaianSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
    const parsed = BackendUpdateSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal memperbarui data pegawai (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true, data: parsed.data.result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) {
    return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
    const url = `${root}/api/kepegawaian/${args.id}${args.forever ? '?forever=true' : ''}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-access-token': token }
    })
    const BackendDeleteSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
    const raw = await res.json().catch(() => ({ success: res.ok }))
    const parsed = BackendDeleteSchema.safeParse(raw)
    if (!res.ok || !parsed.success || !parsed.data.success) {
      const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal menghapus data pegawai (HTTP ${res.status})`
      return { success: false, error: errMsg }
    }
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
