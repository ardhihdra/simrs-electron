import { z } from 'zod'
import { t } from '../'

function getPublicBaseUrl() {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  return base.endsWith('/') ? base.slice(0, -1) : base
}

async function fetchPublic<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getPublicBaseUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    ...init
  })

  const payload = (await response.json().catch(() => null)) as {
    success?: boolean
    result?: T
    message?: string
    error?: string
  } | null

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || payload?.message || `HTTP ${response.status}`)
  }

  return payload.result as T
}

export const kioskaPublicRpc = {
  polis: t
    .input(z.object({}).passthrough())
    .output(z.any())
    .query(async () => {
      return await fetchPublic('/public/kioska/polis')
    }),

  availableDoctors: t
    .input(
      z.object({
        date: z.string(),
        poliId: z.coerce.number().int().positive()
      })
    )
    .output(z.any())
    .query(async (_ctx, input) => {
      const params = new URLSearchParams({
        date: input.date,
        poliId: String(input.poliId)
      })

      return await fetchPublic(`/public/kioska/available-doctors?${params.toString()}`)
    }),

  patients: t
    .input(
      z.object({
        medicalRecordNumber: z.string().min(1)
      })
    )
    .output(z.any())
    .query(async (_ctx, input) => {
      const params = new URLSearchParams({
        medicalRecordNumber: input.medicalRecordNumber
      })

      return await fetchPublic(`/public/kioska/patients?${params.toString()}`)
    }),

  register: t
    .input(
      z.object({
        queueDate: z.string().min(1),
        visitDate: z.string().min(1),
        practitionerId: z.coerce.number().int().positive(),
        doctorScheduleId: z.coerce.number().int().positive(),
        patientId: z.string().optional(),
        registrationType: z.literal('OFFLINE'),
        paymentMethod: z.literal('CASH'),
        reason: z.string().min(1),
        notes: z.string().optional()
      })
    )
    .output(z.any())
    .mutation(async (_ctx, input) => {
      return await fetchPublic('/public/kioska/register-kioska', {
        method: 'POST',
        body: JSON.stringify(input)
      })
    })
}
