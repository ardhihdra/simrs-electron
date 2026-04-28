/**
 * purpose: Prosedur RPC renderer untuk modul IGD (dashboard, registrasi, rebind) dengan validasi payload input.
 * main callers: Hook/query client renderer (`client.igd.*`).
 * key dependencies: Router helper RPC `t` dan validator `zod`.
 * main/public functions: `igdRpc`, `normalizeIgdDashboardResponse`, `normalizeIgdRegistrationResponse`.
 * side effects: HTTP call ke endpoint backend IGD via RPC client.
 */
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
    .optional(),
  quickTriage: z
    .object({
      level: z.number().int().min(0),
      conditionKey: z.string().min(1),
      effectiveDateTime: z.string().min(1)
    })
    .optional()
})
const IgdPatientRebindInputSchema = z.object({
  encounterId: z.string().min(1),
  patientId: z.string().min(1)
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

export function normalizeIgdPatientRebindResponse(payload: any) {
  return normalizeIgdRegistrationResponse(payload)
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
    }),
  rebindPatient: t
    .input(IgdPatientRebindInputSchema)
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const response = await client.put(`/api/module/igd/encounters/${input.encounterId}/patient`, {
        patientId: input.patientId
      })
      const payload = await response.json()
      return normalizeIgdPatientRebindResponse(payload)
    })
}
