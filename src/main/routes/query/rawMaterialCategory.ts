import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'
import { RawMaterialCategorySchema, RawMaterialCategoryWithIdSchema } from '@main/models/rawMaterialCategory'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({ success: z.boolean(), result: RawMaterialCategoryWithIdSchema.array().optional(), message: z.string().optional() })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), result: RawMaterialCategoryWithIdSchema.optional(), message: z.string().optional() })
  },
  create: {
    args: RawMaterialCategorySchema.partial(),
    result: z.object({ success: z.boolean(), result: RawMaterialCategoryWithIdSchema.optional(), message: z.string().optional() })
  },
  update: {
    args: RawMaterialCategorySchema.extend({ id: z.number() }),
    result: z.object({ success: z.boolean(), result: RawMaterialCategoryWithIdSchema.optional(), message: z.string().optional() })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), message: z.string().optional() })
  }
} as const

const BackendDetailSchema = z.object({ success: z.boolean(), result: RawMaterialCategoryWithIdSchema.optional(), message: z.string().optional(), error: z.string().optional() })

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/rawmaterialcategory?items=100')
  const result = await parseBackendResponse(res, BackendListSchema(RawMaterialCategoryWithIdSchema))
  return { success: true, result }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/rawmaterialcategory/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const client = createBackendClient(ctx)
  const payload = { name: args.name, status: args.status ?? true }
  const res = await client.post('/api/rawmaterialcategory', payload)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const client = createBackendClient(ctx)
  const payload = { name: args.name, status: args.status ?? true }
  const res = await client.put(`/api/rawmaterialcategory/${args.id}`, payload)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.delete(`/api/rawmaterialcategory/${args.id}`)
  const DeleteSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
  await parseBackendResponse(res, DeleteSchema)
  return { success: true }
}

