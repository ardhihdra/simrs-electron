import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'
import { MedicineSchema, MedicineWithIdSchema } from '@main/models/medicine'

export const requireSession = true

export const schemas = {
  list: { result: z.object({ success: z.boolean(), result: MedicineWithIdSchema.array().optional(), message: z.string().optional() }) },
  getById: { args: z.object({ id: z.number() }), result: z.object({ success: z.boolean(), result: MedicineWithIdSchema.optional(), message: z.string().optional() }) },
  create: { args: MedicineSchema.partial(), result: z.object({ success: z.boolean(), result: MedicineWithIdSchema.optional(), message: z.string().optional() }) },
  update: { args: MedicineWithIdSchema, result: z.object({ success: z.boolean(), result: MedicineWithIdSchema.optional(), message: z.string().optional() }) },
  deleteById: { args: z.object({ id: z.number() }), result: z.object({ success: z.boolean(), message: z.string().optional() }) }
} as const

const BackendResponseSchema = z.object({ success: z.boolean(), result: MedicineWithIdSchema.optional(), message: z.string().optional(), error: z.string().optional() })

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/medicine?items=100&depth=1')
  const json = await res.json()
  // console.log('Medicine List Raw Response with depth=1:', JSON.stringify(json, null, 2))
  
  // Re-wrap for schema parsing
  const mockRes = {
    ok: res.ok,
    json: async () => json
  } as Response

  const result = await parseBackendResponse(mockRes, BackendListSchema(MedicineWithIdSchema))
  return { success: true, result }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/medicine/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const client = createBackendClient(ctx)
  const payload = {
    name: args.name,
    medicineCategoryId: args.medicineCategoryId,
    medicineBrandId: args.medicineBrandId,
    saltComposition: args.saltComposition ?? null,
    buyingPrice: args.buyingPrice,
    sellingPrice: args.sellingPrice,
    sideEffects: args.sideEffects ?? null,
    description: args.description ?? null,
    minimumStock:
      typeof args.minimumStock === 'number' && args.minimumStock >= 0
        ? args.minimumStock
        : undefined
  }
  const res = await client.post('/api/medicine', payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const client = createBackendClient(ctx)
  const payload = {
    name: args.name,
    medicineCategoryId: args.medicineCategoryId,
    medicineBrandId: args.medicineBrandId,
    saltComposition: args.saltComposition ?? null,
    buyingPrice: args.buyingPrice,
    sellingPrice: args.sellingPrice,
    sideEffects: args.sideEffects ?? null,
    description: args.description ?? null,
    minimumStock:
      typeof args.minimumStock === 'number' && args.minimumStock >= 0
        ? args.minimumStock
        : undefined
  }
  const res = await client.put(`/api/medicine/${args.id}`, payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.delete(`/api/medicine/${args.id}`)
  const DeleteResponseSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
  await parseBackendResponse(res, DeleteResponseSchema)
  return { success: true }
}

