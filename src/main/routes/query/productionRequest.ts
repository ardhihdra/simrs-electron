import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'
import { ProductionRequestSchema, ProductionRequestWithIdSchema } from '@main/models/productionRequest'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      result: ProductionRequestWithIdSchema.array().optional(),
      message: z.string().optional()
    })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      result: ProductionRequestWithIdSchema.optional(),
      message: z.string().optional()
    })
  },
  create: {
    args: ProductionRequestSchema,
    result: z.object({
      success: z.boolean(),
      result: ProductionRequestWithIdSchema.optional(),
      message: z.string().optional()
    })
  },
  update: {
    args: ProductionRequestSchema.extend({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      result: ProductionRequestWithIdSchema.optional(),
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
  result: ProductionRequestWithIdSchema.optional(),
  message: z.string().optional(),
  error: z.string().optional()
})

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/productionrequest?items=100&depth=1')
  const result = await parseBackendResponse(res, BackendListSchema(ProductionRequestWithIdSchema))
  return { success: true, result }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/productionrequest/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const client = createBackendClient(ctx)
  const payload = {
    code: args.code,
    finishedGoodMedicineId: args.finishedGoodMedicineId,
    productionFormulaId: args.productionFormulaId,
    qtyPlanned: args.qtyPlanned,
    status: args.status,
    scheduledStartDate: args.scheduledStartDate ?? null,
    scheduledEndDate: args.scheduledEndDate ?? null,
    actualStartDate: args.actualStartDate ?? null,
    actualEndDate: args.actualEndDate ?? null,
    notes: args.notes ?? null
  }
  const res = await client.post('/api/productionrequest', payload)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const client = createBackendClient(ctx)
  const payload = {
    code: args.code,
    finishedGoodMedicineId: args.finishedGoodMedicineId,
    productionFormulaId: args.productionFormulaId,
    qtyPlanned: args.qtyPlanned,
    status: args.status,
    scheduledStartDate: args.scheduledStartDate ?? null,
    scheduledEndDate: args.scheduledEndDate ?? null,
    actualStartDate: args.actualStartDate ?? null,
    actualEndDate: args.actualEndDate ?? null,
    notes: args.notes ?? null
  }
  const res = await client.put(`/api/productionrequest/${args.id}`, payload)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const deleteById = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.deleteById.args>
) => {
  const client = createBackendClient(ctx)
  const res = await client.delete(`/api/productionrequest/${args.id}`)
  const DeleteSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    error: z.string().optional()
  })
  await parseBackendResponse(res, DeleteSchema)
  return { success: true }
}

