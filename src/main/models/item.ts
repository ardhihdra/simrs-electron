import z from 'zod'

export const ItemKindSchema = z.enum(['DEVICE', 'CONSUMABLE', 'NUTRITION', 'GENERAL'])

const ItemCategorySchema = z.object({
	id: z.number(),
	name: z.string(),
	status: z.boolean().optional(),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
	deletedAt: z.string().nullable().optional()
})

export const ItemSchema = z.object({
	nama: z.string().min(1),
	kode: z.string().min(1),
	kodeUnit: z.string().min(1),
	kind: ItemKindSchema.nullable().optional(),
	minimumStock: z.number().nullable().optional(),
	stock: z.number().nullable().optional(),
	itemCategoryId: z.number().nullable().optional()
})

export const ItemWithIdSchema = ItemSchema.extend({
	id: z.number(),
	unit: z
		.object({ id: z.number().optional(), kode: z.string(), nama: z.string() })
		.nullable()
		.optional(),
	category: ItemCategorySchema.nullable().optional(),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
	deletedAt: z.string().nullable().optional()
})
