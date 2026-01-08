import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'
import { RawMaterialSchema, RawMaterialWithIdSchema } from '@main/models/rawMaterial'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({ success: z.boolean(), result: RawMaterialWithIdSchema.array().optional(), message: z.string().optional() })
  },
  read: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), result: RawMaterialWithIdSchema.optional(), message: z.string().optional() })
  },
  create: {
    args: RawMaterialSchema.partial(),
    result: z.object({ success: z.boolean(), result: RawMaterialWithIdSchema.optional(), message: z.string().optional() })
  },
  update: {
    args: RawMaterialSchema.extend({ id: z.number() }),
    result: z.object({ success: z.boolean(), result: RawMaterialWithIdSchema.optional(), message: z.string().optional() })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), message: z.string().optional() })
  }
} as const

const BackendDetailSchema = z.object({ success: z.boolean(), result: RawMaterialWithIdSchema.optional(), message: z.string().optional(), error: z.string().optional() })

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/rawmaterial?items=100&depth=1')
  const result = await parseBackendResponse(res, BackendListSchema(RawMaterialWithIdSchema))
  return { success: true, result }
}

export const read = async (ctx: IpcContext, args: z.infer<typeof schemas.read.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/rawmaterial/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const client = createBackendClient(ctx)
  const payload = {
    name: args.name,
    materialType: args.materialType,
    internalCode: args.internalCode ?? null,
    casCode: args.casCode ?? null,
    rawMaterialCategoryId: args.rawMaterialCategoryId ?? null,
    supplierId: args.supplierId ?? null,
    status: args.status ?? true,
    description: args.description ?? null
  }
  const res = await client.post('/api/rawmaterial', payload)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const client = createBackendClient(ctx)
  const payload = {
    name: args.name,
    materialType: args.materialType,
    internalCode: args.internalCode ?? null,
    casCode: args.casCode ?? null,
    rawMaterialCategoryId: args.rawMaterialCategoryId ?? null,
    supplierId: args.supplierId ?? null,
    status: args.status ?? true,
    description: args.description ?? null
  }
  const res = await client.put(`/api/rawmaterial/${args.id}`, payload)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.delete(`/api/rawmaterial/${args.id}`)
  const DeleteSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
  await parseBackendResponse(res, DeleteSchema)
  return { success: true }
}

