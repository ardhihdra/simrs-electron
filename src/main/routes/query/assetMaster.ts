import z from 'zod'
import { AssetMasterSchema, AssetMasterSchemaWithId } from '@main/models/assetMaster'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
  list: { result: z.object({ success: z.boolean(), result: AssetMasterSchemaWithId.array().optional(), message: z.string().optional() }) },
  getById: { args: z.object({ id: z.number() }), result: z.object({ success: z.boolean(), result: AssetMasterSchemaWithId.nullish(), message: z.string().optional() }) },
  create: { args: AssetMasterSchema.partial(), result: z.object({ success: z.boolean(), result: AssetMasterSchemaWithId.nullish(), message: z.string().optional() }) },
  update: { args: AssetMasterSchemaWithId, result: z.object({ success: z.boolean(), result: AssetMasterSchemaWithId.nullish(), message: z.string().optional() }) },
  deleteById: { args: z.object({ id: z.number() }), result: z.object({ success: z.boolean(), message: z.string().optional() }) }
} as const

const BackendResponseSchema = z.object({ success: z.boolean(), result: AssetMasterSchemaWithId.nullish(), message: z.string().optional(), error: z.any().optional() })

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/assetmaster?items=100')
  const result = await parseBackendResponse(res, BackendListSchema(AssetMasterSchemaWithId))
  return { success: true, result }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/assetmaster/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const client = createBackendClient(ctx)
  const payload = { categoryId: args.categoryId, name: args.name, brand: args.brand ?? null, model: args.model ?? null, spec: args.spec ?? null }
  const res = await client.post('/api/assetmaster', payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const client = createBackendClient(ctx)
  const payload = { categoryId: args.categoryId, name: args.name, brand: args.brand, model: args.model, spec: args.spec }
  const res = await client.put(`/api/assetmaster/${args.id}`, payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.delete(`/api/assetmaster/${args.id}`)
  const DeleteResponseSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
  await parseBackendResponse(res, DeleteResponseSchema)
  return { success: true }
}

