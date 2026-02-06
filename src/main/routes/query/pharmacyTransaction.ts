import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse } from '@main/utils/backendClient'
import { PharmacyTransactionSchema, PharmacyTransactionWithIdSchema } from '@main/models/pharmacyTransaction'

export const requireSession = true

export const schemas = {
	create: {
		args: PharmacyTransactionSchema,
		result: z.object({
			success: z.boolean(),
			result: PharmacyTransactionWithIdSchema.optional(),
			message: z.string().optional()
		})
	}
} as const

type CreateArgs = z.infer<typeof schemas.create.args>

export const create = async (ctx: IpcContext, args: CreateArgs) => {
	try {
		const client = createBackendClient(ctx)
		const payload = {
			fakturNumber: args.fakturNumber,
			transactionDate: args.transactionDate,
			cashierName: args.cashierName,
			patientId: args.patientId,
			paymentMethod: args.paymentMethod,
			compoundingFee: args.compoundingFee ?? null,
			otherFee: args.otherFee ?? null,
			discountPercent: args.discountPercent ?? null,
			taxPercent: args.taxPercent ?? null,
			totalAmount: args.totalAmount,
			grandTotal: args.grandTotal,
			paidAmount: args.paidAmount,
			changeAmount: args.changeAmount,
			notes: args.notes ?? null
		}
		const res = await client.post('/api/pharmacytransaction', payload)
		const BackendSchema = z.object({
			success: z.boolean(),
			result: PharmacyTransactionWithIdSchema.nullable().optional(),
			message: z.string().optional(),
			error: z.string().optional()
		})
		const result = await parseBackendResponse(res, BackendSchema)
		return { success: true, result }
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)
		return { success: false, error: message }
	}
}

