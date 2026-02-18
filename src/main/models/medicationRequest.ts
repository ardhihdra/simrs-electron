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
	supportingInformation: SupportingInformationEntrySchema.array().nullable().optional(),
	medicationId: z.number().nullable().optional(),
	resourceType: z.string().optional(),
	identifier: z.any().nullable().optional(),
	statusReason: z.any().nullable().optional(),
	doNotPerform: z.boolean().nullable().optional(),
	performerId: z.number().nullable().optional(),
	performerType: z.any().nullable().optional(),
	recorderId: z.number().nullable().optional(),
	reasonCode: z.any().nullable().optional(),
	reasonReference: z.any().nullable().optional(),
	instantiatesCanonical: z.any().nullable().optional(),
	instantiatesUri: z.any().nullable().optional(),
	basedOn: z.any().nullable().optional(),
	courseOfTherapyType: z.any().nullable().optional(),
	insurance: z.any().nullable().optional(),
	substitution: z.any().nullable().optional(),
	priorPrescription: z.any().nullable().optional(),
	detectedIssue: z.any().nullable().optional(),
	eventHistory: z.any().nullable().optional(),
	createdBy: z.number().nullable().optional(),
	updatedBy: z.number().nullable().optional(),
	deletedBy: z.number().nullable().optional()
})

export const MedicationRequestWithIdSchema = MedicationRequestSchema.extend({
	id: z.number(),
	created_at: z.string().or(z.date()).nullable().optional(),
	updated_at: z.string().or(z.date()).nullable().optional(),
	deleted_at: z.string().or(z.date()).nullable().optional(),
	patient: z.any().optional(),
	requester: z.any().optional(),
	encounter: z.any().optional(),
	item: z.any().optional()
})
