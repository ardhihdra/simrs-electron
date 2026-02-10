import z from 'zod'
import {
	MedicationRequestStatus,
	MedicationRequestIntent,
	MedicationRequestPriority
} from './enums/ResourceEnums'

const GroupIdentifierSchema = z.object({
	system: z.string().optional(),
	value: z.string().optional()
})

const QuantitySchema = z.object({
	value: z.number().optional(),
	unit: z.string().optional()
})

const DispenseRequestSchema = z
	.object({
		quantity: QuantitySchema.optional()
	})
	.nullable()
	.optional()

const CategoryEntrySchema = z.object({
	text: z.string().optional(),
	code: z.string().optional()
})

const SupportingInformationEntrySchema = z.object({
	type: z.string().optional(),
	itemId: z.number().optional(),
	unitCode: z.string().optional(),
	quantity: z.number().optional(),
	instruction: z.string().optional()
})

export const MedicationRequestSchema = z.object({
	status: z.nativeEnum(MedicationRequestStatus),
	intent: z.nativeEnum(MedicationRequestIntent),
	priority: z.nativeEnum(MedicationRequestPriority).optional(),
	itemId: z.number().nullable().optional(),
	patientId: z.string(),
	encounterId: z.string().nullable().optional(),
	requesterId: z.number().nullable().optional(),
	authoredOn: z.string().or(z.date()).optional(),
	dosageInstruction: z.any().nullable().optional(),
	note: z.string().nullable().optional(),
	groupIdentifier: GroupIdentifierSchema.nullable().optional(),
	category: CategoryEntrySchema.array().nullable().optional(),
	dispenseRequest: DispenseRequestSchema,
	supportingInformation: SupportingInformationEntrySchema.array().nullable().optional()
})

export const MedicationRequestWithIdSchema = MedicationRequestSchema.extend({
	id: z.number(),
	createdAt: z.string().nullable().optional(),
	updatedAt: z.string().nullable().optional(),
	deletedAt: z.string().nullable().optional(),
	patient: z.any().optional(),
	requester: z.any().optional(),
	encounter: z.any().optional(),
	item: z.any().optional()
})
