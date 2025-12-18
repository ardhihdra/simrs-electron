import z from 'zod'
import { KepegawaianSchemaWithId } from '../../models/kepegawaian'
import type { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backend'

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
  const init = createBackendClient(ctx)
  if (!init.ok || !init.client) {
    return { success: false, error: init.error || 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const [resPegawai, resKontrak] = await Promise.all([
      init.client.get('/api/kepegawaian?items=1000'),
      init.client.get('/api/kontrakpegawai?items=1000')
    ])

    const BackendListPegawaiSchema = BackendListSchema(KepegawaianSchemaWithId)
    const BackendListKontrakSchema = BackendListSchema(ContractItemSchema)

    type PegawaiListSchema = z.infer<typeof BackendListPegawaiSchema>
    type KontrakListSchema = z.infer<typeof BackendListKontrakSchema>
    const parsedPegawai = await parseBackendResponse<PegawaiListSchema>(resPegawai, BackendListPegawaiSchema)
    const parsedKontrak = await parseBackendResponse<KontrakListSchema>(resKontrak, BackendListKontrakSchema)

    if (!parsedPegawai.ok || !parsedPegawai.data?.success) {
      const errMsg = parsedPegawai.error || parsedPegawai.data?.error || parsedPegawai.data?.message || 'Gagal mengambil data pegawai'
      return { success: false, error: errMsg }
    }

    const pegawaiList = parsedPegawai.data.result || []
    const kontrakList = parsedKontrak.ok && parsedKontrak.data?.success ? parsedKontrak.data.result || [] : []

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
  const init = createBackendClient(ctx)
  if (!init.ok || !init.client) {
    return { success: false, error: init.error || 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  try {
    const res = await init.client.get(`/api/kepegawaian/read/${args.id}`)
    const BackendReadSchema = z.object({
      success: z.boolean(),
      result: KepegawaianSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    type BackendReadResult = z.infer<typeof BackendReadSchema>
    const parsed = await parseBackendResponse<BackendReadResult>(res, BackendReadSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal mengambil detail pegawai'
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
      namaLengkap: args.namaLengkap,
      email: args.email,
      nik: args.nik,
      tanggalLahir: args.tanggalLahir instanceof Date ? args.tanggalLahir : new Date(String(args.tanggalLahir)),
      jenisKelamin: args.jenisKelamin,
      alamat: args.alamat ?? null,
      nomorTelepon: args.nomorTelepon ?? null,
      hakAkses: args.hakAkses ?? null
    }
    const res = await init.client.post('/api/kepegawaian', payload)
    const BackendCreateSchema = z.object({
      success: z.boolean(),
      result: KepegawaianSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    type BackendCreateResult = z.infer<typeof BackendCreateSchema>
    const parsed = await parseBackendResponse<BackendCreateResult>(res, BackendCreateSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal membuat data pegawai'
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
    const res = await init.client.put(`/api/kepegawaian/${args.id}`, payload)
    const BackendUpdateSchema = z.object({
      success: z.boolean(),
      result: KepegawaianSchemaWithId.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    type BackendUpdateResult = z.infer<typeof BackendUpdateSchema>
    const parsed = await parseBackendResponse<BackendUpdateResult>(res, BackendUpdateSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal memperbarui data pegawai'
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
    const res = await init.client.del(`/api/kepegawaian/${args.id}${args.forever ? '?forever=true' : ''}`)
    const BackendDeleteSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
    type BackendDeleteResult = z.infer<typeof BackendDeleteSchema>
    const parsed = await parseBackendResponse<BackendDeleteResult>(res, BackendDeleteSchema)
    if (!parsed.ok || !parsed.data?.success) {
      const errMsg = parsed.error || parsed.data?.error || parsed.data?.message || 'Gagal menghapus data pegawai'
      return { success: false, error: errMsg }
    }
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
