import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
  list: {
    args: z.object({
      q: z.string().optional()
    }).optional(),
    result: z.any()
  }
} as const

export const list = async (ctx: IpcContext, args?: z.infer<typeof schemas.list.args>) => {
  try {
    const client = createBackendClient(ctx)
    const params: Record<string, string> = {}
    if (args?.q) params.q = args.q
    
    // Hit backend endpoint
    const res = await client.get('/api/module/master-racikan', params)
    
    // We use any for now to facilitate quick debugging, but we could use a strict schema
    const result = await res.json()
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
