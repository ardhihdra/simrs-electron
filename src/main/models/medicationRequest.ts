import z from 'zod'
import {
  MedicationRequestStatus,
  MedicationRequestIntent,
  MedicationRequestPriority
} from './enums/ResourceEnums'

export const MedicationRequestSchema = z.object({
  status: z.nativeEnum(MedicationRequestStatus),
  intent: z.nativeEnum(MedicationRequestIntent),
  priority: z.nativeEnum(MedicationRequestPriority).optional(),
  medicationId: z.number().nullable().optional(),
  patientId: z.string(),
  encounterId: z.string().nullable().optional(),
  requesterId: z.number().nullable().optional(),
  authoredOn: z.string().or(z.date()).optional(),
  dosageInstruction: z.any().nullable().optional(),
  note: z.string().nullable().optional()
})

export const MedicationRequestWithIdSchema = MedicationRequestSchema.extend({
  id: z.number(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional(),
  patient: z.any().optional(),
  requester: z.any().optional(),
  encounter: z.any().optional(),
  medication: z.any().optional()
})
