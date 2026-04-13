import { ApiResponseSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '..'

// Fallback schema if it's missing from simrs-types
const ApplicationConfigResultSchema = z.object({
  payment: z.object({
    requirePaymentBeforePrintingLabResult: z.boolean(),
    requirePaymentBeforeAction: z.boolean(),
    requirePaymentAfterAction: z.boolean()
  }),
  registration: z.object({
    requireIdentityNumberForRegistration: z.boolean(),
    allowWalkInRegistration: z.boolean(),
    requireDoctorSelectionBeforeQueue: z.boolean()
  }),
  laboratory: z.object({
    allowPrintingDraftResult: z.boolean()
  }),
  radiology: z.object({
    requirePaymentBeforePrintingResult: z.boolean(),
    allowPrintingDraftResult: z.boolean()
  }),
  pharmacy: z.object({
    requirePaymentBeforeDispensingMedication: z.boolean(),
    allowPartialDispensingMedication: z.boolean()
  }),
  cashier: z.object({
    autoGenerateInvoiceAfterEncounter: z.boolean(),
    allowZeroPriceInvoiceItem: z.boolean()
  }),
  queue: z.object({
    allowManualQueueNumberOverride: z.boolean(),
    allowCallPatientBeforeCheckIn: z.boolean()
  })
}).passthrough()

export const applicationConfigRpc = {
  get: t
    .input(z.void())
    .output(ApiResponseSchema(ApplicationConfigResultSchema))
    .query(async ({ client }) => {
      const res = await client.get('/api/module/app-config')
      return await res.json()
    })
}
