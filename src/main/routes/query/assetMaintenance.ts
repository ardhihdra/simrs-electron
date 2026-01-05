import z from 'zod'
import { AssetMaintenanceSchema, AssetMaintenanceSchemaWithId } from '@main/models/assetMaintenance'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
  list: { result: z.object({ success: z.boolean(), result: AssetMaintenanceSchemaWithId.array().optional(), message: z.string().optional() }) },
  getById: { args: z.object({ id: z.number() }), result: z.object({ success: z.boolean(), result: AssetMaintenanceSchemaWithId.nullish(), message: z.string().optional() }) },
  create: { args: AssetMaintenanceSchema.partial(), result: z.object({ success: z.boolean(), result: AssetMaintenanceSchemaWithId.nullish(), message: z.string().optional() }) },
  update: { args: AssetMaintenanceSchemaWithId, result: z.object({ success: z.boolean(), result: AssetMaintenanceSchemaWithId.nullish(), message: z.string().optional() }) },
  deleteById: { args: z.object({ id: z.number() }), result: z.object({ success: z.boolean(), message: z.string().optional() }) }
} as const

const BackendResponseSchema = z.object({ success: z.boolean(), result: AssetMaintenanceSchemaWithId.nullish(), message: z.string().optional(), error: z.any().optional() })

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/assetmaintenance?items=100')
  const result = await parseBackendResponse(res, BackendListSchema(AssetMaintenanceSchemaWithId))
  return { success: true, result }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/assetmaintenance/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const client = createBackendClient(ctx)
  const payload = { assetId: args.assetId, type: args.type, vendor: args.vendor ?? null, scheduleDate: args.scheduleDate ?? null, actualDate: args.actualDate ?? null, cost: args.cost ?? null, nextDueDate: args.nextDueDate ?? null, documentUrl: args.documentUrl ?? null }
  const res = await client.post('/api/assetmaintenance', payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const client = createBackendClient(ctx)
  const payload = { assetId: args.assetId, type: args.type, vendor: args.vendor, scheduleDate: args.scheduleDate, actualDate: args.actualDate, cost: args.cost, nextDueDate: args.nextDueDate, documentUrl: args.documentUrl }
  const res = await client.put(`/api/assetmaintenance/${args.id}`, payload)
  const result = await parseBackendResponse(res, BackendResponseSchema)
  return { success: true, result }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.delete(`/api/assetmaintenance/${args.id}`)
  const DeleteResponseSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
  await parseBackendResponse(res, DeleteResponseSchema)
  return { success: true }
}

