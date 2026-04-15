import { IpcContext } from '@main/ipc/router'
import { OperatingRoomSchemaWithId } from '@main/models/operatingRoom'
import {
  BackendListSchema,
  createBackendClient,
  parseBackendResponse
} from '@main/utils/backendClient'
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
      message: z.string().optional()
    })
  }
} as const

export const list = async (ctx: IpcContext, args?: z.infer<typeof schemas.list.args>) => {
  try {
    const client = createBackendClient(ctx)
    const params = new URLSearchParams()
    if (args?.status) params.append('status', args.status)

    const res = await client.get(`/api/operatingroom?${params.toString()}`)
    console.log("res", res)
    const result = await parseBackendResponse(res, BackendListSchema(OperatingRoomSchemaWithId))
    console.log("result", result)
    return { success: true, result }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
