import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse } from '@main/utils/backendClient'

export const requireSession = true

const BackofficeDOReceivedItemSchema = z.object({
  id: z.number(),
  kodeItemSent: z.string().nullable(),
  qtyReceived: z.number(),
  notes: z.string().nullable(),
  kodeReceiverUser: z.string().nullable(),
  receivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sentItem: z.object({
    id: z.number(),
    kodeDo: z.string(),
    kodeItem: z.string(),
    itemName: z.string(),
    qtySent: z.number()
  }).nullable().optional()
})

export const schemas = {
  list: {
    args: z
      .object({
        page: z.number().optional(),
        limit: z.number().optional()
      })
      .optional(),
    result: z.object({
      success: z.boolean(),
      result: BackofficeDOReceivedItemSchema.array().optional(),
      message: z.string().optional()
    })
  }
} as const

type ListArgs = z.infer<typeof schemas.list.args>

export const list = async (ctx: IpcContext, args?: ListArgs) => {
  const client = createBackendClient(ctx)
  const params = new URLSearchParams()
  if (args?.page) params.append('page', String(args.page))
  if (args?.limit) params.append('limit', String(args.limit))

  const url = `/api/backofficedoreceiveditem?${params.toString()}`
  const res = await client.get(url)
  
  // Custom schema for this endpoint as it matches the controller's return structure
  const ListSchema = z.object({
    success: z.boolean(),
    result: BackofficeDOReceivedItemSchema.array().optional(),
    message: z.string().optional()
  })
  
  const result = await parseBackendResponse(res, ListSchema)
  return { success: true, result: result?.result ? { result: result.result, success: true } : { success: false } }
}
