import z from 'zod'
import { CATEGORY_TYPES } from '@shared/category'

export const MedicineCategorySchema = z.object({
	name: z.string().min(1),
	status: z.boolean().optional(),
	categoryType: z.enum(CATEGORY_TYPES as unknown as [string, ...string[]]).optional().nullable()
})

export const MedicineCategoryWithIdSchema = MedicineCategorySchema.extend({
	id: z.number(),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
	deletedAt: z.string().nullable().optional()
})

