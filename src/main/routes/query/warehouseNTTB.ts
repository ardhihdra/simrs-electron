import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse } from '@main/utils/backendClient'

export const requireSession = true

const WarehouseNTTBSchema = z.object({
  id: z.number(),
  kode: z.string(),
  kodePo: z.string(),
  kodeItem: z.string(),
  kodeSuplier: z.string(),
  kodeStock: z.string().nullable().optional(),
  batchNumber: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  itemType: z.string(),
  hargaBeli: z.number().nullable().optional(),
  diskon1: z.number().nullable().optional(),
  diskon2: z.number().nullable().optional(),
  bonus: z.number().nullable().optional(),
  total: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  item: z.object({
    kode: z.string(),
    nama: z.string()
  }).nullable().optional(),
  suplier: z.object({
    kode: z.string(),
    nama: z.string()
  }).nullable().optional(),
  stock: z.object({
    kode: z.string().nullable().optional(),
    qty: z.number(),
    type: z.number().optional()
  }).nullable().optional(),
  po: z.object({
    kode: z.string(),
    note: z.string().nullable().optional()
  }).nullable().optional()
})

export const schemas = {
  list: {
    args: z
      .object({
        page: z.number().optional(),
        limit: z.number().optional(),
        depth: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        q: z.string().optional()
      })
      .optional(),
    result: z.object({
      success: z.boolean(),
      result: WarehouseNTTBSchema.array().optional(),
      message: z.string().optional(),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        pages: z.number()
      }).optional()
    })
  }
} as const

type ListArgs = z.infer<typeof schemas.list.args>

export const list = async (ctx: IpcContext, args?: ListArgs) => {
  const client = createBackendClient(ctx)
  const params = new URLSearchParams()
  if (args?.page) params.append('page', String(args.page))
  if (args?.limit) params.append('items', String(args.limit))
  if (args?.depth) params.append('depth', String(args.depth))
  if (args?.startDate) params.append('startDate', args.startDate)
  if (args?.endDate) params.append('endDate', args.endDate)
  if (args?.q) params.append('q', args.q)

  const url = `/api/warehousenttb?${params.toString()}`
  const res = await client.get(url)
  const rawData = await res.json()
  
  console.log('WarehouseNTTB RAW Response Length:', rawData.result?.length || 0)

  const ListSchema = z.object({
    success: z.boolean(),
    result: WarehouseNTTBSchema.array().optional(),
    message: z.string().optional(),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      count: z.number(),
      pages: z.number()
    }).optional()
  })
  
  const parsed = ListSchema.safeParse(rawData)
  
  if (!parsed.success) {
    console.error('Zod Validation Error:', JSON.stringify(parsed.error.format(), null, 2))
    throw new Error('Invalid response format from backend')
  }

  if (!parsed.data.success) {
    throw new Error(parsed.data.message || 'Unknown backend error')
  }
  
  const pagination = parsed.data.pagination ? {
    page: parsed.data.pagination.page,
    limit: parsed.data.pagination.limit,
    total: parsed.data.pagination.count,
    pages: parsed.data.pagination.pages
  } : undefined

  return { 
    success: true, 
    result: parsed.data.result,
    pagination
  }
}
