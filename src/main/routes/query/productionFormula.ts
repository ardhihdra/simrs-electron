import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'
import { ProductionFormulaSchema, ProductionFormulaWithIdSchema } from '@main/models/productionFormula'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      result: ProductionFormulaWithIdSchema.array().optional(),
      message: z.string().optional()
    })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      result: ProductionFormulaWithIdSchema.optional(),
      message: z.string().optional()
    })
  },
  create: {
    args: ProductionFormulaSchema,
    result: z.object({
      success: z.boolean(),
      result: ProductionFormulaWithIdSchema.optional(),
      message: z.string().optional()
    })
  },
  update: {
    args: ProductionFormulaSchema.extend({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      result: ProductionFormulaWithIdSchema.optional(),
      message: z.string().optional()
    })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), message: z.string().optional() })
  }
} as const

const BackendDetailSchema = z.object({
  success: z.boolean(),
  result: ProductionFormulaWithIdSchema.optional(),
  message: z.string().optional(),
  error: z.string().optional()
})

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/productionformula?items=100&depth=1')
  const result = await parseBackendResponse(res, BackendListSchema(ProductionFormulaWithIdSchema))
  return { success: true, result }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/productionformula/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const client = createBackendClient(ctx)
  const payload = {
    finishedGoodMedicineId: args.finishedGoodMedicineId,
    version: args.version,
    status: args.status,
    notes: args.notes ?? null,
    items: args.items ?? null
  }
  const res = await client.post('/api/productionformula', payload)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const client = createBackendClient(ctx)
  const payload = {
    finishedGoodMedicineId: args.finishedGoodMedicineId,
    version: args.version,
    status: args.status,
    notes: args.notes ?? null,
    items: args.items ?? null
  }
  const res = await client.put(`/api/productionformula/${args.id}`, payload)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.delete(`/api/productionformula/${args.id}`)
  const DeleteSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
  await parseBackendResponse(res, DeleteSchema)
  return { success: true }
}

