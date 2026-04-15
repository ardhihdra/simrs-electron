import { IpcContext } from '@main/ipc/router'
import { OkRequestSchema, OkRequestSchemaWithId } from '@main/models/okRequest'
import {
  BackendListSchema,
  createBackendClient,
  parseBackendResponse
} from '@main/utils/backendClient'
import z from 'zod'

export const requireSession = true

const MODULE_ENDPOINT = '/api/module/ok-request'
const OkRequestCreateSchema = OkRequestSchema.partial().extend({
  status: z
    .enum(['draft', 'verified', 'rejected', 'in_progress', 'done', 'cancelled', 'diajukan'])
    .optional()
})

const BackendResponseSchema = z.object({
  success: z.boolean(),
  result: OkRequestSchemaWithId.optional(),
  message: z.string().optional(),
  error: z.string().optional()
})

export const schemas = {
  list: {
    args: z.object({
      encounterId: z.string().optional()
    }).optional(),
    result: z.object({
      success: z.boolean(),
      result: OkRequestSchemaWithId.array().optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
  },
  create: {
    args: OkRequestCreateSchema,
    result: BackendResponseSchema
  }
} as const

export const list = async (ctx: IpcContext, args?: z.infer<typeof schemas.list.args>) => {
  try {
    const client = createBackendClient(ctx)
    const params = new URLSearchParams()
    if (args?.encounterId) params.append('encounterId', args.encounterId)

    const queryString = params.toString()
    const path = queryString ? `${MODULE_ENDPOINT}?${queryString}` : MODULE_ENDPOINT
    const res = await client.get(path)
    const result = await parseBackendResponse(res, BackendListSchema(OkRequestSchemaWithId))
    return { success: true, result }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  try {
    const client = createBackendClient(ctx)
    const normalizedPayload = {
      ...args,
      status: args.status === 'diajukan' ? 'verified' : args.status
    }

    const res = await client.post(MODULE_ENDPOINT, normalizedPayload)
    const result = await parseBackendResponse(res, BackendResponseSchema)
    return { success: true, result }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
