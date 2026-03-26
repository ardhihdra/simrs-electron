import z from 'zod'
import { MedicationDispenseStatus } from './enums/ResourceEnums'
import { MedicationRequestWithIdSchema } from './medicationRequest'

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
  name: z.union([
    z.string(),
    z.array(PatientNameEntrySchema)
  ]).optional(),
  identifier: z.array(PatientIdentifierSchema).optional(),
  mrNo: z.string().optional()
})

const PerformerSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional()
})

const DosageInstructionEntrySchema = z.object({
  text: z.string().optional()
})

export const MedicationDispenseSchema = z.object({
  status: z.nativeEnum(MedicationDispenseStatus),
  itemId: z.number().nullable().optional(),
  patientId: z.string(),
  encounterId: z.string().nullable().optional(),
  authorizingPrescriptionId: z.number().nullable().optional(),
  quantity: QuantitySchema.nullable().optional(),
  whenPrepared: z.string().or(z.date()).nullable().optional(),
  whenHandedOver: z.string().or(z.date()).nullable().optional(),
  performerId: z.number().nullable().optional(),
  dosageInstruction: z.array(DosageInstructionEntrySchema).nullable().optional(),
  note: z.array(z.object({ text: z.string().optional() }).passthrough()).nullable().optional(),
  receiver: z.array(z.object({ display: z.string().optional() }).passthrough()).nullable().optional()
})

export const MedicationDispenseWithIdSchema = MedicationDispenseSchema.extend({
  id: z.number(),
  fhirId: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional(),
  patient: PatientSchema.nullable().optional(),
  performer: PerformerSchema.nullable().optional(),
  medication: z.object({
    id: z.number().optional(),
    name: z.string().optional(),
    stock: z.number().nullable().optional(),
    uom: z.string().nullable().optional()
  }).nullable().optional(),
  authorizingPrescription: MedicationRequestWithIdSchema.nullable().optional(),
  encounter: z.object({
    encounterType: z.string().optional()
  }).nullable().optional()
})
