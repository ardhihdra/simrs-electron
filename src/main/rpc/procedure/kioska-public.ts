import { z } from 'zod'

import { serializeKioskaPublicError } from '../../../shared/kioska-public-error'
import { t } from '../'

const KIOSKA_PUBLIC_RPC_ERROR_CODE = 'KIOSKA_PUBLIC_ERROR'

function getPublicBaseUrl() {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  return base.endsWith('/') ? base.slice(0, -1) : base
}

async function fetchPublic<T>(
  path: string,
  init?: RequestInit,
  options?: { serializeError?: boolean }
): Promise<T> {
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
    const message = payload?.error || payload?.message || `HTTP ${response.status}`

    if (options?.serializeError) {
      throw {
        code: KIOSKA_PUBLIC_RPC_ERROR_CODE,
        message: serializeKioskaPublicError({
          status: response.status,
          message
        })
      }
    }

    throw new Error(message)
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

  registrationLocation: t
    .input(
      z
        .object({
          serviceTypeCode: z.enum(['REGISTRASI', 'REGISTRASI_ASURANSI']).optional()
        })
        .passthrough()
    )
    .output(z.any())
    .query(async (_ctx, input) => {
      const params = new URLSearchParams()
      if (input.serviceTypeCode) {
        params.set('serviceTypeCode', input.serviceTypeCode)
      }

      const suffix = params.size ? `?${params.toString()}` : ''
      return await fetchPublic(`/public/kioska/registration-location${suffix}`)
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
        paymentMethod: z.enum(['CASH', 'ASURANSI']),
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
    }),

  registrationTicket: t
    .input(
      z.object({
        lokasiKerjaId: z.coerce.number().int().positive(),
        serviceTypeCode: z.enum(['REGISTRASI', 'REGISTRASI_ASURANSI']),
        queueDate: z.string().min(1),
        sourceChannel: z.literal('KIOSK')
      })
    )
    .output(z.any())
    .mutation(async (_ctx, input) => {
      return await fetchPublic('/public/kioska/registration-ticket', {
        method: 'POST',
        body: JSON.stringify(input)
      })
    }),

  checkin: t
    .input(
      z.object({
        queueNumber: z.string().min(1)
      })
    )
    .output(z.any())
    .mutation(async (_ctx, input) => {
      try {
        return await fetchPublic(
          `/public/kioska/checkin/${input.queueNumber}`,
          {
            method: 'POST',
            body: JSON.stringify(input)
          },
          { serializeError: true }
        )
      } catch (error) {
        console.error('Failed to checkin:', error)
        throw error
      }
    })
}
