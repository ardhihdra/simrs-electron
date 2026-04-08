import { IpcContext } from '@main/ipc/router'
import {
  BackendListSchema,
  createBackendClient,
  parseBackendResponse
} from '@main/utils/backendClient'
import { OperatingRoomSchemaWithId } from 'simrs-types'
import z from 'zod'

export const requireSession = true

export const schemas = {
  list: {
    args: z.object({
      status: z.string().optional()
    }).optional(),
    result: z.object({
      success: z.boolean(),
      result: OperatingRoomSchemaWithId.array().optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
  }
} as const

export const list = async (ctx: IpcContext, args?: z.infer<typeof schemas.list.args>) => {
  try {
    const client = createBackendClient(ctx)
    const params = new URLSearchParams()
    if (args?.status) params.append('status', args.status)

    const res = await client.get(`/api/operatingroom?${params.toString()}`)
    const result = await parseBackendResponse(res, BackendListSchema(OperatingRoomSchemaWithId))
    return { success: true, result }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      message: 'Gagal memuat daftar ruang OK',
      error: message
    }
  }
}
