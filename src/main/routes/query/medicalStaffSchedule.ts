import z from 'zod'
import { MedicalStaffScheduleSchema, MedicalStaffScheduleSchemaWithId } from '@main/models/medicalStaffSchedule'
import { IpcContext } from '@main/ipc/router'

export const requireSession = true

export const schemas = {
    list: {
        result: z.object({
            success: z.boolean(),
            result: MedicalStaffScheduleSchemaWithId.array().optional(),
            message: z.string().optional()
        })
    },
    getById: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: MedicalStaffScheduleSchemaWithId.optional(),
            message: z.string().optional()
        })
    },
    create: {
        args: MedicalStaffScheduleSchema.partial(),
        result: z.object({
            success: z.boolean(),
            result: MedicalStaffScheduleSchemaWithId.optional(),
            message: z.string().optional()
        })
    },
    update: {
        args: MedicalStaffScheduleSchemaWithId,
        result: z.object({
            success: z.boolean(),
            result: MedicalStaffScheduleSchemaWithId.optional(),
            message: z.string().optional()
        })
    },
    deleteById: {
        args: z.object({ id: z.number() }),
        result: z.object({ success: z.boolean(), message: z.string().optional() })
    }
} as const

export const list = async (ctx: IpcContext) => {
    const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
    const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
    console.log('[ipc:medicalStaffSchedule.list] senderId=', ctx.senderId, 'apiBase=', base)
    if (!token) {
        console.warn('[ipc:medicalStaffSchedule.list] missing token for senderId=', ctx.senderId)
        return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
    }
    try {
        const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
        const url = `${root}/api/jadwalPraktekPetugasMedis?items=100`
        console.log('[ipc:medicalStaffSchedule.list] GET', url)
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'x-access-token': token
            }
        })
        console.log('[ipc:medicalStaffSchedule.list] status=', res.status, 'ok=', res.ok)
        const BackendListSchema = z.object({
            success: z.boolean(),
            result: MedicalStaffScheduleSchemaWithId.array().optional(),
            pagination: z
                .object({ page: z.number(), pages: z.number(), count: z.number() })
                .optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
        const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
        console.log('[ipc:medicalStaffSchedule.list] keys=', Object.keys(raw || {}))
        const parsed = BackendListSchema.safeParse(raw)
        if (!res.ok || !parsed.success || !parsed.data.success) {
            const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal mengambil data jadwal praktik (HTTP ${res.status})`
            console.warn('[ipc:medicalStaffSchedule.list] error=', errMsg)
            return { success: false, error: errMsg }
        }
        const result = parsed.data.result || []
        console.log('[ipc:medicalStaffSchedule.list] received=', Array.isArray(result) ? result.length : 0)
        return { success: true, result }
    } catch (err) {
        const msg = (err instanceof Error ? err.message : String(err))
        console.error('[ipc:medicalStaffSchedule.list] exception=', msg)
        return { success: false, error: msg }
    }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
    try {
        const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
        const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
        if (!token) {
            return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        }
        const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
        const url = `${root}/api/jadwalPraktekPetugasMedis/read/${args.id}`
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
            result: MedicalStaffScheduleSchemaWithId.optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
        const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
        const parsed = BackendReadSchema.safeParse(raw)
        if (!res.ok || !parsed.success || !parsed.data.success) {
            const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal mengambil detail jadwal praktik (HTTP ${res.status})`
            return { success: false, error: errMsg }
        }
        return { success: true, result: parsed.data.result }
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
            return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        }
        const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
        const url = `${root}/api/jadwalPraktekPetugasMedis`
        const payload = {
            idPegawai: args.idPegawai,
            kodeDepartemen: args.kodeDepartemen,
            kategori: args.kategori ?? null,
            senin: args.senin,
            selasa: args.selasa,
            rabu: args.rabu,
            kamis: args.kamis,
            jumat: args.jumat,
            sabtu: args.sabtu,
            minggu: args.minggu,
            status: args.status ?? 'active',
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
            result: MedicalStaffScheduleSchemaWithId.optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
        const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
        const parsed = BackendCreateSchema.safeParse(raw)
        if (!res.ok || !parsed.success || !parsed.data.success) {
            const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal membuat jadwal praktik (HTTP ${res.status})`
            return { success: false, error: errMsg }
        }
        return { success: true, result: parsed.data.result }
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
            return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        }
        const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
        const url = `${root}/api/jadwalPraktekPetugasMedis/${args.id}`
        const payload = {
            idPegawai: args.idPegawai,
            kodeDepartemen: args.kodeDepartemen,
            kategori: args.kategori,
            senin: args.senin,
            selasa: args.selasa,
            rabu: args.rabu,
            kamis: args.kamis,
            jumat: args.jumat,
            sabtu: args.sabtu,
            minggu: args.minggu,
            status: args.status,
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
            result: MedicalStaffScheduleSchemaWithId.optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
        const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
        const parsed = BackendUpdateSchema.safeParse(raw)
        if (!res.ok || !parsed.success || !parsed.data.success) {
            const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal memperbarui jadwal praktik (HTTP ${res.status})`
            return { success: false, error: errMsg }
        }
        return { success: true, result: parsed.data.result }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
    try {
        const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
        const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
        if (!token) {
            return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        }
        const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
        const url = `${root}/api/jadwalPraktekPetugasMedis/${args.id}`
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
            const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal menghapus jadwal praktik (HTTP ${res.status})`
            return { success: false, error: errMsg }
        }
        return { success: true }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
