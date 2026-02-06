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

const InventoryExpiryItemSchema = z.object({
	kodeItem: z.string(),
	namaItem: z.string(),
	unit: z.string(),
	availableStock: z.number(),
	earliestExpiryDate: z.string()
})

const AdjustItemStockResultSchema = z.object({
	id: z.number().optional(),
	kode: z.string().optional(),
	stock: z.number().optional()
})

const ItemAdjustmentSchema = z.object({
	id: z.number(),
	kodeItem: z.string(),
	type: z.number(),
	qty: z.number(),
	batchNumber: z.string().nullable(),
	expiryDate: z.string().nullable(),
	adjustReason: z.string().nullable(),
	note: z.string().nullable(),
	previousStock: z.number(),
	newStock: z.number(),
	createdAt: z.string(),
	createdBy: z.string().nullable(),
	createdByName: z.string().nullable().optional(),
	updatedAt: z.string().nullable(),
	updatedBy: z.string().nullable()
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
	},
		expirySummary: {
		args: z
			.object({
				itemType: z.enum(['item', 'substance', 'medicine']).optional(),
				limit: z.number().optional()
			})
			.optional(),
			result: z.object({
				success: z.boolean(),
				result: InventoryExpiryItemSchema.array().optional(),
				message: z.string().optional()
			})
		},
		adjustItemStock: {
			args: z.object({
				itemId: z.number(),
				newStock: z.number(),
				adjustReason: z.string().optional(),
				note: z.string().optional()
			}),
			result: z.object({
				success: z.boolean(),
				result: AdjustItemStockResultSchema.optional(),
				message: z.string().optional()
			})
		},
		itemAdjustments: {
			args: z
				.object({
					itemId: z.number().optional()
				})
				.optional(),
			result: z.object({
				success: z.boolean(),
				result: ItemAdjustmentSchema.array().nullable().optional(),
				message: z.string().optional()
			})
		}
} as const

type ListArgs = z.infer<typeof schemas.list.args>

type ExpirySummaryArgs = z.infer<typeof schemas.expirySummary.args>
type AdjustItemStockArgs = z.infer<typeof schemas.adjustItemStock.args>
type ItemAdjustmentsArgs = z.infer<typeof schemas.itemAdjustments.args>

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

export const expirySummary = async (ctx: IpcContext, args?: ExpirySummaryArgs) => {
	const client = createBackendClient(ctx)
	const params = new URLSearchParams()
	const limit = typeof args?.limit === 'number' && Number.isFinite(args.limit) ? args.limit : 20
	params.append('items', String(limit))
	params.append('depth', '1')

	const effectiveItemType = args?.itemType
	if (effectiveItemType) {
		params.append('itemType', effectiveItemType)
	}

	const url = `/api/inventorystock/expiry-summary?${params.toString()}`
	const res = await client.get(url)
	const ListSchema = BackendListSchema(InventoryExpiryItemSchema)
	const result = await parseBackendResponse(res, ListSchema)
	return { success: true, result }
}

export const adjustItemStock = async (ctx: IpcContext, args: AdjustItemStockArgs) => {
	try {
		const client = createBackendClient(ctx)
		const res = await client.post('/api/inventorystock/adjust-item-stock', args)
		const BackendAdjustSchema = z.object({
			success: z.boolean(),
			result: AdjustItemStockResultSchema.optional(),
			message: z.string().optional(),
			error: z.string().optional()
		})
		const result = await parseBackendResponse(res, BackendAdjustSchema)
		return { success: true, result }
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		return { success: false as const, error: msg }
	}
}

export const itemAdjustments = async (ctx: IpcContext, args?: ItemAdjustmentsArgs) => {
	const client = createBackendClient(ctx)
	const params = new URLSearchParams()
	const rawItemId = args && typeof args.itemId === 'number' ? args.itemId : undefined
	if (typeof rawItemId === 'number' && Number.isFinite(rawItemId) && rawItemId > 0) {
		params.append('itemId', String(rawItemId))
	}

	const queryString = params.toString()
	const url = queryString.length > 0
		? `/api/inventorystock/item-adjustments?${queryString}`
		: '/api/inventorystock/item-adjustments'
	const res = await client.get(url)
	const BackendSchema = z.object({
		success: z.boolean(),
		result: ItemAdjustmentSchema.array().nullable().optional(),
		message: z.string().optional()
	})
	const result = await parseBackendResponse(res, BackendSchema)
	return { success: true, result }
}
