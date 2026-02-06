import z from 'zod'

export const PharmacyPaymentMethodSchema = z.enum(['CASH', 'NONCASH', 'CREDIT'])

export const PharmacyTransactionSchema = z.object({
	fakturNumber: z.string().min(1),
	transactionDate: z.string().min(1),
	cashierName: z.string().nullable().optional(),
	patientId: z.string().nullable().optional(),
	paymentMethod: PharmacyPaymentMethodSchema,
	compoundingFee: z.number().nullable().optional(),
	otherFee: z.number().nullable().optional(),
	discountPercent: z.number().nullable().optional(),
	taxPercent: z.number().nullable().optional(),
	totalAmount: z.number(),
	grandTotal: z.number(),
	paidAmount: z.number(),
	changeAmount: z.number(),
	notes: z.string().nullable().optional()
})

export const PharmacyTransactionWithIdSchema = PharmacyTransactionSchema.extend({
	id: z.number(),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
	deletedAt: z.string().nullable().optional()
})

