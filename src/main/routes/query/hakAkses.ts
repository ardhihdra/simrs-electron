import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
    getByCode: {
        args: z.object({ code: z.string() }),
        result: z.object({
            success: z.boolean(),
            data: z.any().optional(),
            error: z.string().optional()
        })
    }
} as const

export const getByCode = async (ctx: IpcContext, args: z.infer<typeof schemas.getByCode.args>) => {
    try {
        const client = createBackendClient(ctx)
        // User specified endpoint: /api/hakakses?kode=...
        const res = await client.get(`/api/hakakses?kode=${args.code}`)

        const BackendResponseSchema = z.object({
            success: z.boolean(),
            result: z.any(),
            message: z.string().optional(),
            error: z.string().optional()
        })

        const result = await parseBackendResponse(res, BackendResponseSchema)

        // The result from backend list might be an array of HakAkses.
        // We want the one matching the code (should be unique).
        // If result is an array, we take the first one.
        let data = result
        if (Array.isArray(result)) {
            data = result.find((item: any) => item.kode === args.code) || result[0]
        }

        return { success: true, data }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'NO_BACKEND_TOKEN') {
            return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        }
        return { success: false, error: msg }
    }
}
