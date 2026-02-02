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
    args: z
      .object({
        itemType: z.enum(['item', 'substance', 'medicine']).optional()
      })
      .optional(),
    result: z.object({
      success: z.boolean(),
      result: InventoryStockItemSchema.array().optional(),
      message: z.string().optional()
    })
  }
} as const

type ListArgs = z.infer<typeof schemas.list.args>

export const list = async (ctx: IpcContext, args?: ListArgs) => {
  const client = createBackendClient(ctx)
  const params = new URLSearchParams()
  params.append('items', '1000')
  params.append('depth', '1')

  const effectiveItemType = args?.itemType
  if (effectiveItemType) {
    params.append('itemType', effectiveItemType)
  }

  const url = `/api/inventorystock?${params.toString()}`
  const res = await client.get(url)
  const ListSchema = BackendListSchema(InventoryStockItemSchema)
  const result = await parseBackendResponse(res, ListSchema)
  return { success: true, result }
}
