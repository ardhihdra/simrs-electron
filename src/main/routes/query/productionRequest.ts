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

const BackendDetailSchema: z.ZodSchema<{
	success: boolean
	result?: z.infer<typeof ProductionRequestWithIdSchema> | null
	message?: string
	error?: string
}> = z.object({
	success: z.boolean(),
	result: ProductionRequestWithIdSchema.nullable().optional(),
	message: z.string().optional(),
	error: z.string().optional()
})

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  console.log('[IPC][productionRequest][list] request /api/productionrequest?items=100&depth=1')
  const res = await client.get('/api/productionrequest?items=100&depth=1')
  console.log('[IPC][productionRequest][list] raw response', res)
  const result = await parseBackendResponse(res, BackendListSchema(ProductionRequestWithIdSchema))
  console.log('[IPC][productionRequest][list] parsed result', result)
  return { success: true, result }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const client = createBackendClient(ctx)
  console.log('[IPC][productionRequest][getById] args', args)
  const res = await client.get(`/api/productionrequest/read/${args.id}`)
  console.log('[IPC][productionRequest][getById] raw response', res)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  console.log('[IPC][productionRequest][getById] parsed result', result)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const client = createBackendClient(ctx)
  console.log('[IPC][productionRequest][create] args', args)
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
  console.log('[IPC][productionRequest][create] payload', payload)
  const res = await client.post('/api/productionrequest', payload)
  console.log('[IPC][productionRequest][create] raw response', res)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  console.log('[IPC][productionRequest][create] parsed result', result)
  return { success: true, result }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const client = createBackendClient(ctx)
  console.log('[IPC][productionRequest][update] args', args)
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
  console.log('[IPC][productionRequest][update] payload', payload)
  const res = await client.put(`/api/productionrequest/${args.id}`, payload)
  console.log('[IPC][productionRequest][update] raw response', res)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  console.log('[IPC][productionRequest][update] parsed result', result)
  return { success: true, result }
}

export const deleteById = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.deleteById.args>
) => {
  const client = createBackendClient(ctx)
  console.log('[IPC][productionRequest][deleteById] args', args)
  const res = await client.delete(`/api/productionrequest/${args.id}`)
  console.log('[IPC][productionRequest][deleteById] raw response', res)
  const DeleteSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    error: z.string().optional()
  })
  await parseBackendResponse(res, DeleteSchema)
  return { success: true }
}
