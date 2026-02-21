import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'
import { KfaCodeSchema, KfaCodeWithIdSchema } from '@main/models/kfaCode'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      result: KfaCodeWithIdSchema.array().optional(),
      message: z.string().optional()
    })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      result: KfaCodeWithIdSchema.optional(),
      message: z.string().optional()
    })
  },
  create: {
    args: KfaCodeSchema.partial(),
    result: z.object({
      success: z.boolean(),
      result: KfaCodeWithIdSchema.optional(),
      message: z.string().optional()
    })
  },
  update: {
    args: KfaCodeWithIdSchema,
    result: z.object({
      success: z.boolean(),
      result: KfaCodeWithIdSchema.optional(),
      message: z.string().optional()
    })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), message: z.string().optional() })
  }
} as const

const BackendResponseSchema = z.object({
  success: z.boolean(),
  result: KfaCodeWithIdSchema.optional(),
  message: z.string().optional(),
  error: z.string().optional()
})

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/kfacode?items=100')
  const result = await parseBackendResponse(res, BackendListSchema(KfaCodeWithIdSchema))
  return { success: true, result }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/kfacode/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const client = createBackendClient(ctx)
  const payload = { code: args.code ?? 0, display: args.display ?? '' }
  const res = await client.post('/api/kfacode', payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const client = createBackendClient(ctx)
  const payload = { code: args.code, display: args.display }
  const res = await client.put(`/api/kfacode/${args.id}`, payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.delete(`/api/kfacode/${args.id}`)
  const DeleteResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    error: z.string().optional()
  })
  await parseBackendResponse(res, DeleteResponseSchema)
  return { success: true }
}
