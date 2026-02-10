import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'
import { ItemSchema, ItemWithIdSchema } from '@main/models/item'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({ success: z.boolean(), result: ItemWithIdSchema.array().optional(), message: z.string().optional() })
  },
  read: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), result: ItemWithIdSchema.optional(), message: z.string().optional() })
  },
  create: {
    args: ItemSchema.partial(),
    result: z.object({ success: z.boolean(), result: ItemWithIdSchema.optional(), message: z.string().optional() })
  },
  update: {
    args: ItemSchema.extend({ id: z.number() }),
    result: z.object({ success: z.boolean(), result: ItemWithIdSchema.optional(), message: z.string().optional() })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), message: z.string().optional() })
  }
} as const

const BackendDetailSchema: z.ZodSchema<{
	success: boolean
	result?: z.infer<typeof ItemWithIdSchema> | null
	message?: string
	error?: string
}> = z.object({
	success: z.boolean(),
	result: ItemWithIdSchema.nullable().optional(),
	message: z.string().optional(),
	error: z.any().optional()
})

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/item?items=100&depth=1')
  const result = await parseBackendResponse(res, BackendListSchema(ItemWithIdSchema))
  return { success: true, result }
}

export const read = async (ctx: IpcContext, args: z.infer<typeof schemas.read.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/item/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
	try {
		const client = createBackendClient(ctx)
		const basePayload = {
			nama: args.nama,
			kode: args.kode,
			kodeUnit: args.kodeUnit,
			kind: args.kind ?? null,
			itemCategoryId: args.itemCategoryId ?? null,
			buyingPrice: typeof args.buyingPrice === 'number' ? args.buyingPrice : undefined,
			sellingPrice: typeof args.sellingPrice === 'number' ? args.sellingPrice : undefined,
			buyPriceRules: Array.isArray(args.buyPriceRules) ? args.buyPriceRules : undefined,
			sellPriceRules: Array.isArray(args.sellPriceRules) ? args.sellPriceRules : undefined
		}
		const payload =
			typeof args.minimumStock === 'number'
				? { ...basePayload, minimumStock: args.minimumStock }
				: basePayload
		console.log('[item.create] payload', payload)
		const res = await client.post('/api/item', payload)
		const result = await parseBackendResponse(res, BackendDetailSchema)
		console.log('[item.create] backend result', result)
		return { success: true, result }
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		console.error('[item.create] error', msg)
		return { success: false, error: msg }
	}
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
	try {
		const client = createBackendClient(ctx)
		const basePayload = {
			nama: args.nama,
			kode: args.kode,
			kodeUnit: args.kodeUnit,
			kind: args.kind ?? null,
			itemCategoryId: args.itemCategoryId ?? null,
			buyingPrice: typeof args.buyingPrice === 'number' ? args.buyingPrice : undefined,
			sellingPrice: typeof args.sellingPrice === 'number' ? args.sellingPrice : undefined,
			buyPriceRules: Array.isArray(args.buyPriceRules) ? args.buyPriceRules : undefined,
			sellPriceRules: Array.isArray(args.sellPriceRules) ? args.sellPriceRules : undefined
		}
		const payload =
			typeof args.minimumStock === 'number'
				? { ...basePayload, minimumStock: args.minimumStock }
				: basePayload
		console.log('[item.update] payload', { id: args.id, ...payload })
		const res = await client.put(`/api/item/${args.id}`, payload)
		const result = await parseBackendResponse(res, BackendDetailSchema)
		console.log('[item.update] backend result', result)
		return { success: true, result }
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		console.error('[item.update] error', msg)
		return { success: false, error: msg }
	}
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
	try {
		const client = createBackendClient(ctx)
		const res = await client.delete(`/api/item/${args.id}`)
		const DeleteSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
		await parseBackendResponse(res, DeleteSchema)
		return { success: true }
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		return { success: false, error: msg }
	}
}
