import z from 'zod'

export const PharmacyPaymentMethodSchema = z.enum(['CASH', 'NONCASH', 'CREDIT'])

export const PharmacyTransactionItemSchema = z.object({
	itemKode: z.string().min(1),
	quantity: z.coerce.number().positive(),
	unitPrice: z.coerce.number().nonnegative(),
	discountAmount: z.coerce.number().nonnegative().optional().default(0),
	taxAmount: z.coerce.number().nonnegative().optional().default(0),
})

export const PharmacyTransactionSchema = z.object({
	fakturNumber: z.string().min(1),
	transactionDate: z.string().min(1),
	cashierName: z.string().nullable().optional(),
	patientId: z.string().nullable().optional(),
	paymentMethod: PharmacyPaymentMethodSchema,
	compoundingFee: z.coerce.number().nullable().optional(),
	otherFee: z.coerce.number().nullable().optional(),
	discountPercent: z.coerce.number().nullable().optional(),
	taxPercent: z.coerce.number().nullable().optional(),
	totalAmount: z.coerce.number(),
	grandTotal: z.coerce.number(),
	paidAmount: z.coerce.number(),
	changeAmount: z.coerce.number(),
	notes: z.string().nullable().optional(),
	items: PharmacyTransactionItemSchema.array().optional().default([])
})

export const PharmacyTransactionWithIdSchema = PharmacyTransactionSchema.extend({
	id: z.number(),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
	deletedAt: z.string().nullable().optional()
})
