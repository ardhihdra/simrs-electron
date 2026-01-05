import z from 'zod'
import { AssetCategorySchema, AssetCategorySchemaWithId } from '@main/models/assetCategory'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({ success: z.boolean(), result: AssetCategorySchemaWithId.array().optional(), message: z.string().optional() })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), result: AssetCategorySchemaWithId.nullish(), message: z.string().optional() })
  },
  create: {
    args: AssetCategorySchema.partial(),
    result: z.object({ success: z.boolean(), result: AssetCategorySchemaWithId.nullish(), message: z.string().optional() })
  },
  update: {
    args: AssetCategorySchemaWithId,
    result: z.object({ success: z.boolean(), result: AssetCategorySchemaWithId.nullish(), message: z.string().optional() })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), message: z.string().optional() })
  }
} as const

const BackendResponseSchema = z.object({ success: z.boolean(), result: AssetCategorySchemaWithId.nullish(), message: z.string().optional(), error: z.any().optional() })

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/assetcategory?items=100')
  const result = await parseBackendResponse(res, BackendListSchema(AssetCategorySchemaWithId))
  return { success: true, result }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/assetcategory/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const client = createBackendClient(ctx)
  const payload = { name: args.name, type: args.type, requiresCalibration: args.requiresCalibration ?? false, depreciationYears: args.depreciationYears ?? null }
  const res = await client.post('/api/assetcategory', payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const client = createBackendClient(ctx)
  const payload = { name: args.name, type: args.type, requiresCalibration: args.requiresCalibration, depreciationYears: args.depreciationYears }
  const res = await client.put(`/api/assetcategory/${args.id}`, payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.delete(`/api/assetcategory/${args.id}`)
  const DeleteResponseSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
  await parseBackendResponse(res, DeleteResponseSchema)
  return { success: true }
}

