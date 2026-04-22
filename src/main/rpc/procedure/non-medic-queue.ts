import { ApiResponseSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

const BASE_URL = '/api/module/non-medic-queue'

const QueueDateSchema = z.string().optional()

const GetBoardInputSchema = z.object({
  lokasiKerjaId: z.number().int().positive(),
  serviceTypeCode: z.string().min(1),
  queueDate: QueueDateSchema
})

const GetServiceTypesInputSchema = z.object({
  isActive: z.boolean().optional()
})

const GetConfigsInputSchema = z.object({
  lokasiKerjaId: z.number().int().positive(),
  serviceTypeCode: z.string().optional(),
  isActive: z.boolean().optional()
})

const GetServicePointsInputSchema = z.object({
  lokasiKerjaId: z.number().int().positive(),
  serviceTypeCode: z.string().optional(),
  isActive: z.boolean().optional()
})

const CreateTicketInputSchema = z.object({
  lokasiKerjaId: z.number().int().positive().optional(),
  serviceTypeCode: z.string().min(1),
  queueDate: QueueDateSchema,
  patientId: z.string().optional(),
  encounterId: z.string().optional(),
  sourceChannel: z.string().optional(),
  priorityType: z.string().optional()
})

const UpsertServicePointInputSchema = z.object({
  lokasiKerjaId: z.number().int().positive(),
  serviceTypeCode: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  displayName: z.string().optional(),
  isActive: z.boolean().optional()
})

const UpdateServicePointInputSchema = UpsertServicePointInputSchema.extend({
  id: z.number().int().positive()
})

const CallNextInputSchema = z.object({
  servicePointId: z.number().int().positive(),
  queueDate: QueueDateSchema
})

const TicketActionInputSchema = z.object({
  ticketId: z.string().min(1)
})

export const nonMedicQueueRpc = {
  getBoard: t
    .input(GetBoardInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      params.append('lokasiKerjaId', String(input.lokasiKerjaId))
      params.append('serviceTypeCode', input.serviceTypeCode)
      if (input.queueDate) {
        params.append('queueDate', input.queueDate)
      }

      const response = await client.get(`${BASE_URL}/board?${params.toString()}`)
      return await response.json()
    }),

  getServiceTypes: t
    .input(GetServiceTypesInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (typeof input.isActive === 'boolean') {
        params.append('isActive', String(input.isActive))
      }

      const response = await client.get(
        `${BASE_URL}/service-types${params.toString() ? `?${params.toString()}` : ''}`
      )
      return await response.json()
    }),

  getConfigs: t
    .input(GetConfigsInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      params.append('lokasiKerjaId', String(input.lokasiKerjaId))
      if (input.serviceTypeCode) {
        params.append('serviceTypeCode', input.serviceTypeCode)
      }
      if (typeof input.isActive === 'boolean') {
        params.append('isActive', String(input.isActive))
      }

      const response = await client.get(`${BASE_URL}/configs?${params.toString()}`)
      return await response.json()
    }),

  getServicePoints: t
    .input(GetServicePointsInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      params.append('lokasiKerjaId', String(input.lokasiKerjaId))
      if (input.serviceTypeCode) {
        params.append('serviceTypeCode', input.serviceTypeCode)
      }
      if (typeof input.isActive === 'boolean') {
        params.append('isActive', String(input.isActive))
      }

      const response = await client.get(`${BASE_URL}/service-points?${params.toString()}`)
      const res = await response.json()
      console.log('[RES] : ', res)
      return res
    }),

  createTicket: t
    .input(CreateTicketInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      try {
        const response = await client.post(`${BASE_URL}/tickets`, input)
        return await response.json()
      } catch (error) {
        console.log(error)
        throw error
      }
    }),

  createServicePoint: t
    .input(UpsertServicePointInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const response = await client.post(`${BASE_URL}/service-points`, input)
      return await response.json()
    }),

  updateServicePoint: t
    .input(UpdateServicePointInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { id, ...input }) => {
      const response = await client.put(`${BASE_URL}/service-points/${id}`, input)
      return await response.json()
    }),

  callNext: t
    .input(CallNextInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { servicePointId, ...input }) => {
      const response = await client.post(
        `${BASE_URL}/service-points/${servicePointId}/call-next`,
        input
      )
      return await response.json()
    }),

  serveTicket: t
    .input(TicketActionInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { ticketId }) => {
      const response = await client.post(`${BASE_URL}/tickets/${ticketId}/serve`, {})
      return await response.json()
    }),

  completeTicket: t
    .input(TicketActionInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { ticketId }) => {
      const response = await client.post(`${BASE_URL}/tickets/${ticketId}/complete`, {})
      return await response.json()
    }),

  skipTicket: t
    .input(TicketActionInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { ticketId }) => {
      const response = await client.post(`${BASE_URL}/tickets/${ticketId}/skip`, {})
      return await response.json()
    }),

  cancelTicket: t
    .input(TicketActionInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { ticketId }) => {
      const response = await client.post(`${BASE_URL}/tickets/${ticketId}/cancel`, {})
      return await response.json()
    })
}
