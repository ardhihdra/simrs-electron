import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'

export const requireSession = true

const InventoryStockItemSchema = z.object({
  kodeItem: z.string(),
  namaItem: z.string(),
  unit: z.string(),
  stockIn: z.number(),
  stockOut: z.number(),
  availableStock: z.number()
})

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      result: InventoryStockItemSchema.array().optional(),
      message: z.string().optional()
    })
  }
} as const

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/inventorystock?items=1000&depth=1')
  const ListSchema = BackendListSchema(InventoryStockItemSchema)
  const result = await parseBackendResponse(res, ListSchema)
  return { success: true, result }
}

