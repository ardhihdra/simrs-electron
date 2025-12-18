import z from 'zod'
import { JaminanSchema, JaminanSchemaWithId } from '@main/models/jaminan'
import { IpcContext } from '@main/ipc/router'

export const requireSession = true

export const schemas = {
    list: {
        result: z.object({
            success: z.boolean(),
            result: JaminanSchemaWithId.array().optional(),
            message: z.string().optional()
        })
    },
    getById: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: JaminanSchemaWithId.optional(),
            message: z.string().optional()
        })
    },
    create: {
        args: JaminanSchema.partial(),
        result: z.object({
            success: z.boolean(),
            result: JaminanSchemaWithId.optional(),
            message: z.string().optional()
        })
    },
    update: {
        args: JaminanSchemaWithId,
        result: z.object({
            success: z.boolean(),
            result: JaminanSchemaWithId.optional(),
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
    console.log('[ipc:jaminan.list] senderId=', ctx.senderId, 'apiBase=', base)
    if (!token) {
        console.warn('[ipc:jaminan.list] missing token for senderId=', ctx.senderId)
        return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
    }
    try {
        const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
        const url = `${root}/api/jaminan?items=100`
        console.log('[ipc:jaminan.list] GET', url)
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'x-access-token': token
            }
        })
        console.log('[ipc:jaminan.list] status=', res.status, 'ok=', res.ok)
        const BackendListSchema = z.object({
            success: z.boolean(),
            result: JaminanSchemaWithId.array().optional(),
            pagination: z
                .object({ page: z.number(), pages: z.number(), count: z.number() })
                .optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
        const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
        console.log('[ipc:jaminan.list] keys=', Object.keys(raw || {}))
        const parsed = BackendListSchema.safeParse(raw)
        if (!res.ok || !parsed.success || !parsed.data.success) {
            const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal mengambil data jaminan (HTTP ${res.status})`
            console.warn('[ipc:jaminan.list] error=', errMsg)
            return { success: false, error: errMsg }
        }
        const result = parsed.data.result || []
        console.log('[ipc:jaminan.list] received=', Array.isArray(result) ? result.length : 0)
        return { success: true, result }
    } catch (err) {
        const msg = (err instanceof Error ? err.message : String(err))
        console.error('[ipc:jaminan.list] exception=', msg)
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
        const url = `${root}/api/jaminan/read/${args.id}`
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
            result: JaminanSchemaWithId.optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
        const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
        const parsed = BackendReadSchema.safeParse(raw)
        if (!res.ok || !parsed.success || !parsed.data.success) {
            const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal mengambil detail jaminan (HTTP ${res.status})`
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
        const url = `${root}/api/jaminan`
        const payload = {
            nama: args.nama,
            kode: args.kode,
            keterangan: args.keterangan ?? null,
            status: args.status ?? 'active'
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
            result: JaminanSchemaWithId.optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
        const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
        const parsed = BackendCreateSchema.safeParse(raw)
        if (!res.ok || !parsed.success || !parsed.data.success) {
            const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal membuat jaminan (HTTP ${res.status})`
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
        const url = `${root}/api/jaminan/${args.id}`
        const payload = {
            nama: args.nama,
            kode: args.kode,
            keterangan: args.keterangan,
            status: args.status
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
            result: JaminanSchemaWithId.optional(),
            message: z.string().optional(),
            error: z.string().optional()
        })
        const raw = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
        const parsed = BackendUpdateSchema.safeParse(raw)
        if (!res.ok || !parsed.success || !parsed.data.success) {
            const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal memperbarui jaminan (HTTP ${res.status})`
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
        const url = `${root}/api/jaminan/${args.id}`
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
            const errMsg = (parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message) || `Gagal menghapus jaminan (HTTP ${res.status})`
            return { success: false, error: errMsg }
        }
        return { success: true }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { success: false, error: msg }
    }
}
