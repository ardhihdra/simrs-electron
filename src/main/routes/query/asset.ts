import z from 'zod'
import { AssetSchema, AssetSchemaWithId } from '@main/models/asset'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
  list: { result: z.object({ success: z.boolean(), result: AssetSchemaWithId.array().optional(), message: z.string().optional() }) },
  getById: { args: z.object({ id: z.number() }), result: z.object({ success: z.boolean(), result: AssetSchemaWithId.nullish(), message: z.string().optional() }) },
  create: { args: AssetSchema.partial(), result: z.object({ success: z.boolean(), result: AssetSchemaWithId.nullish(), message: z.string().optional() }) },
  update: { args: AssetSchemaWithId, result: z.object({ success: z.boolean(), result: AssetSchemaWithId.nullish(), message: z.string().optional() }) },
  deleteById: { args: z.object({ id: z.number() }), result: z.object({ success: z.boolean(), message: z.string().optional() }) }
} as const

const BackendResponseSchema = z.object({ success: z.boolean(), result: AssetSchemaWithId.nullish(), message: z.string().optional(), error: z.any().optional() })

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/asset?items=100')
  const result = await parseBackendResponse(res, BackendListSchema(AssetSchemaWithId))
  return { success: true, result }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/asset/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const client = createBackendClient(ctx)
  const payload = {
    assetCode: args.assetCode,
    assetMasterId: args.assetMasterId,
    serialNumber: args.serialNumber ?? null,
    purchaseDate: args.purchaseDate ?? null,
    purchasePrice: args.purchasePrice ?? null,
    fundingSource: args.fundingSource ?? null,
    currentLocationId: args.currentLocationId ?? null,
    status: args.status,
    condition: args.condition
  }
  const res = await client.post('/api/asset', payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const client = createBackendClient(ctx)
  const payload = {
    assetCode: args.assetCode,
    assetMasterId: args.assetMasterId,
    serialNumber: args.serialNumber,
    purchaseDate: args.purchaseDate,
    purchasePrice: args.purchasePrice,
    fundingSource: args.fundingSource,
    currentLocationId: args.currentLocationId,
    status: args.status,
    condition: args.condition
  }
  const res = await client.put(`/api/asset/${args.id}`, payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.delete(`/api/asset/${args.id}`)
  const DeleteResponseSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
  await parseBackendResponse(res, DeleteResponseSchema)
  return { success: true }
}

