import z from 'zod'

import { t } from '..'

const InpatientAdmissionSourceSchema = z.enum(['rajal', 'igd', 'rujukan'])
const InpatientAdmissionPaymentMethodSchema = z.enum(['bpjs', 'cash', 'asuransi', 'company'])

const CreateRawatInapAdmissionInputSchema = z.object({
  patientId: z.string().min(1),
  source: InpatientAdmissionSourceSchema,
  sourceEncounterId: z.string().optional(),
  serviceUnitId: z.string().min(1),
  practitionerId: z.number().int().positive().optional(),
  paymentMethod: InpatientAdmissionPaymentMethodSchema.optional(),
  patientInsuranceId: z.number().int().positive().optional(),
  admissionDateTime: z.string().min(1),
  diagnosis: z.object({
    code: z.string().min(1),
    text: z.string().min(1)
  }),
  indication: z.string().min(1),
  sep: z
    .object({
      noKartu: z.string().min(1),
      noRujukan: z.string().optional(),
      kelasRawatHak: z.string().optional(),
      kelasRawatNaik: z.string().optional(),
      pembiayaan: z.string().optional(),
      penanggungJawab: z.string().optional()
    })
    .optional(),
  planningOnly: z.boolean().optional(),
  placement: z.object({
    roomCodeId: z.string().min(1),
    bedCodeId: z.string().min(1),
    classOfCareCodeId: z.string().min(1)
  })
})

export type CreateRawatInapAdmissionInput = z.infer<typeof CreateRawatInapAdmissionInputSchema>

const CheckInRawatInapAdmissionInputSchema = CreateRawatInapAdmissionInputSchema.extend({
  encounterId: z.string().min(1)
})

export type CheckInRawatInapAdmissionInput = z.infer<typeof CheckInRawatInapAdmissionInputSchema>

export function normalizeRawatInapAdmissionResponse(payload: any) {
  if (payload?.success === false) {
    throw new Error(payload?.error || payload?.message || 'Admisi rawat inap gagal diproses')
  }

  if (payload?.data) {
    return payload.data
  }

  if (payload?.result) {
    return payload.result
  }

  throw new Error('Invalid rawat inap admission response')
}

export const rawatInapAdmissionRpc = {
  create: t
    .input(CreateRawatInapAdmissionInputSchema)
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const response = await client.post('/api/module/rawat-inap-admission/admissions', input)
      const payload = await response.json()
      return normalizeRawatInapAdmissionResponse(payload)
    }),
  checkIn: t
    .input(CheckInRawatInapAdmissionInputSchema)
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const { encounterId, ...body } = input
      const response = await client.patch(
        `/api/module/rawat-inap-admission/admissions/${encounterId}/checkin`,
        body
      )
      const payload = await response.json()
      return normalizeRawatInapAdmissionResponse(payload)
    })
}
