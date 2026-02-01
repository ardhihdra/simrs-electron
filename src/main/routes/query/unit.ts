import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'
import { UnitWithIdSchema } from '@main/models/unit'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      result: UnitWithIdSchema.array().optional(),
      message: z.string().optional()
    })
  }
} as const

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  console.log('[ipc][unit.list] request /api/unit?items=200')
  const res = await client.get('/api/unit?items=200')
  const result = await parseBackendResponse(res, BackendListSchema(UnitWithIdSchema))
  if (Array.isArray(result)) {
    console.log('[ipc][unit.list] success, count', result.length)
  } else {
    console.log('[ipc][unit.list] success, non-array result')
  }
  return { success: true, result }
}
