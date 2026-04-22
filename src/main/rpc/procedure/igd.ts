import z from 'zod'

import { t } from '..'

const IgdDashboardInputSchema = z.object({}).default({})
const IgdRegistrationInputSchema = z.object({
  patientType: z.enum(['existing', 'new', 'temporary']),
  patientId: z.string().optional(),
  patientData: z.record(z.string(), z.any()).optional(),
  complaint: z.string().min(1),
  arrivalSource: z.enum(['Datang sendiri', 'Rujukan', 'Polisi']),
  paymentMethod: z.enum(['Umum', 'BPJS', 'Asuransi', 'Perusahaan']),
  arrivalDateTime: z.string().optional(),
  guarantor: z
    .object({
      name: z.string().optional(),
      relationship: z.string().optional(),
      nik: z.string().optional(),
      phone: z.string().optional()
    })
    .optional()
})

export function normalizeIgdDashboardResponse(payload: any) {
  if (payload?.result) {
    return payload.result
  }

  throw new Error('Invalid IGD dashboard response')
}

export function normalizeIgdRegistrationResponse(payload: any) {
  if (payload?.success === false) {
    throw new Error(payload?.error || payload?.message || 'IGD registration request failed')
  }

  if (payload?.data) {
    return payload.data
  }

  if (payload?.result) {
    return payload.result
  }

  throw new Error('Invalid IGD registration response')
}

export const igdRpc = {
  dashboard: t
    .input(IgdDashboardInputSchema)
    .output(z.any())
    .query(async ({ client }) => {
      const response = await client.get('/api/module/igd/dashboard')
      const payload = await response.json()
      return normalizeIgdDashboardResponse(payload)
    }),
  register: t
    .input(IgdRegistrationInputSchema)
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const response = await client.post('/api/module/igd/registrations', input)
      const payload = await response.json()
      return normalizeIgdRegistrationResponse(payload)
    })
}
