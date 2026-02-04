import z from 'zod'

import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse } from '@main/utils/backendClient'

const API_BASE_URL = 'http://localhost:8810/api'

export const schemas = {
    list: {
        result: z.object({
            success: z.boolean(),
            result: z.array(z.any()).nullable().optional(),
            message: z.string().optional()
        })
    }
}

export const list = async (ctx: IpcContext) => {
    try {
        const client = createBackendClient(ctx)

        // Use client.get() which handles auth headers
        const res = await client.get('/api/departemen')

        // Define simple schema for response parsing
        const DepartmentListSchema = z.object({
            success: z.boolean(),
            result: z.array(z.any()).nullable().optional(),
            message: z.string().optional()
        })

        const result = await parseBackendResponse(res, DepartmentListSchema)
        return { success: true, result }

    } catch (err) {
        console.error('[departemen.list] Error:', err)
        const msg = err instanceof Error ? err.message : String(err)
        if (msg === 'NO_BACKEND_TOKEN') {
            return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
        }
        return { success: false, error: msg }
    }
}
