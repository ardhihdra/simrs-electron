import z from 'zod'
import { MedicationDispenseStatus } from './enums/ResourceEnums'

const QuantitySchema = z.object({
  value: z.number().optional(),
  unit: z.string().optional()
})

const PatientIdentifierSchema = z.object({
  system: z.string().optional(),
  value: z.string().optional()
})

const PatientNameEntrySchema = z.object({
  text: z.string().optional(),
  given: z.array(z.string()).optional(),
  family: z.string().optional()
})

const PatientSchema = z.object({
  id: z.string().optional(),
  name: z.array(PatientNameEntrySchema).optional(),
  identifier: z.array(PatientIdentifierSchema).optional(),
  mrNo: z.string().optional()
})

const MedicationSchema = z.object({
	id: z.number().optional(),
	name: z.string().optional()
})

const PerformerSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional()
})

export const MedicationDispenseSchema = z.object({
	status: z.nativeEnum(MedicationDispenseStatus),
	medicationId: z.number().nullable().optional(),
	patientId: z.string(),
	encounterId: z.string().nullable().optional(),
	authorizingPrescriptionId: z.number().nullable().optional(),
	quantity: QuantitySchema.nullable().optional(),
	whenPrepared: z.string().or(z.date()).nullable().optional(),
	whenHandedOver: z.string().or(z.date()).nullable().optional(),
	performerId: z.number().nullable().optional()
})

export const MedicationDispenseWithIdSchema = MedicationDispenseSchema.extend({
  id: z.number(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional(),
	patient: PatientSchema.optional(),
	medication: MedicationSchema.nullable().optional(),
	performer: PerformerSchema.nullable().optional()
})
