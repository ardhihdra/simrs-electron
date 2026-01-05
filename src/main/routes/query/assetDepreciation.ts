import z from 'zod'
import { AssetDepreciationSchema, AssetDepreciationSchemaWithId } from '@main/models/assetDepreciation'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
  list: { result: z.object({ success: z.boolean(), result: AssetDepreciationSchemaWithId.array().optional(), message: z.string().optional() }) },
  getById: { args: z.object({ id: z.number() }), result: z.object({ success: z.boolean(), result: AssetDepreciationSchemaWithId.nullish(), message: z.string().optional() }) },
  create: { args: AssetDepreciationSchema.partial(), result: z.object({ success: z.boolean(), result: AssetDepreciationSchemaWithId.nullish(), message: z.string().optional() }) },
  update: { args: AssetDepreciationSchemaWithId, result: z.object({ success: z.boolean(), result: AssetDepreciationSchemaWithId.nullish(), message: z.string().optional() }) },
  deleteById: { args: z.object({ id: z.number() }), result: z.object({ success: z.boolean(), message: z.string().optional() }) }
} as const

const BackendResponseSchema = z.object({ success: z.boolean(), result: AssetDepreciationSchemaWithId.nullish(), message: z.string().optional(), error: z.any().optional() })

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/assetdepreciation?items=100')
  const result = await parseBackendResponse(res, BackendListSchema(AssetDepreciationSchemaWithId))
  return { success: true, result }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/assetdepreciation/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const client = createBackendClient(ctx)
  const payload = { assetId: args.assetId, year: args.year, bookValue: args.bookValue, depreciationValue: args.depreciationValue }
  const res = await client.post('/api/assetdepreciation', payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const client = createBackendClient(ctx)
  const payload = { assetId: args.assetId, year: args.year, bookValue: args.bookValue, depreciationValue: args.depreciationValue }
  const res = await client.put(`/api/assetdepreciation/${args.id}`, payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.delete(`/api/assetdepreciation/${args.id}`)
  const DeleteResponseSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
  await parseBackendResponse(res, DeleteResponseSchema)
  return { success: true }
}

