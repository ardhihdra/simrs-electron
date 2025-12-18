import z from 'zod'

export const ServiceRequestSchema = z.object({
  identifier: z.array(z.any()).nullable().optional(),
  instantiatesCanonical: z.array(z.string()).nullable().optional(),
  instantiatesUri: z.array(z.string()).nullable().optional(),
  basedOn: z.array(z.any()).nullable().optional(),
  replaces: z.array(z.any()).nullable().optional(),
  requisition: z.any().nullable().optional(),
  status: z.enum([
    'draft',
    'active',
    'on-hold',
    'revoked',
    'completed',
    'entered-in-error',
    'unknown'
  ]),
  intent: z.enum([
    'proposal',
    'plan',
    'directive',
    'order',
    'original-order',
    'reflex-order',
    'filler-order',
    'instance-order',
    'option'
  ]),
  category: z.array(z.any()).nullable().optional(),
  priority: z.enum(['routine', 'urgent', 'asap', 'stat']).nullable().optional(),
  doNotPerform: z.boolean().nullable().optional(),
  code: z.any().nullable().optional(),
  orderDetail: z.array(z.any()).nullable().optional(),
  quantity: z.any().nullable().optional(),
  subject: z.any(),
  focus: z.array(z.any()).nullable().optional(),
  encounter: z.any().nullable().optional(),
  occurrence: z.any().nullable().optional(),
  asNeeded: z.any().nullable().optional(),
  authoredOn: z.union([z.date(), z.string()]).nullable().optional(),
  requester: z.any().nullable().optional(),
  performerType: z.any().nullable().optional(),
  performer: z.array(z.any()).nullable().optional(),
  location: z.array(z.any()).nullable().optional(),
  reason: z.array(z.any()).nullable().optional(),
  insurance: z.array(z.any()).nullable().optional(),
  supportingInfo: z.array(z.any()).nullable().optional(),
  specimen: z.array(z.any()).nullable().optional(),
  bodySite: z.array(z.any()).nullable().optional(),
  bodyStructure: z.any().nullable().optional(),
  note: z.array(z.any()).nullable().optional(),
  patientInstruction: z.array(z.any()).nullable().optional(),
  relevantHistory: z.array(z.any()).nullable().optional(),
  resourceType: z.string().nullable().optional()
})

export const ServiceRequestSchemaWithId = ServiceRequestSchema.extend({
  id: z.number(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional()
})
