import {
  ApiResponseSchema,
  GetAvailableDoctorsInputSchema,
  RegisterInputSchema,
  GetQueuesInputSchema,
  UpdateQueueStatusInputSchema,
  CancelEncounterInputSchema,
  DischargeEncounterInputSchema,
  CreateAncillaryEncounterInputSchema,
  CreateStandaloneAncillaryEncounterInputSchema,
  CreateSepInternalInputSchema,
  CreateSepExternalInputSchema,
  ReferPatientInputSchema,
  GetDoctorContractsInputSchema,
  GetScheduleEditorInputSchema,
  SaveScheduleInfoInputSchema,
  UpdateScheduleInfoInputSchema,
  SaveScheduleSessionsInputSchema,
  SaveScheduleExceptionsInputSchema,
  CreateScheduleInputSchema,
  UpdateScheduleInputSchema,
  CreateScheduleExceptionInputSchema,
  UpdateScheduleExceptionInputSchema,
  SyncScheduleQuotaInputSchema
} from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

const BASE_URL = '/api/module/registration-v2'

// --- Schemas are now in simrs-types ---

// --- RPC Procedures ---

export const registrationRpc = {
  getAvailableDoctors: t
    .input(GetAvailableDoctorsInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.date) params.append('date', input.date)
      if (input.poliId) params.append('poliId', String(input.poliId))
      if (input.doctorName) params.append('doctorName', input.doctorName)
      if (input.hour) params.append('hour', input.hour)

      const response = await client.get(`${BASE_URL}/available-doctors?${params.toString()}`)
      return await response.json()
    }),

  register: t
    .input(RegisterInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const response = await client.post(`${BASE_URL}/register`, input)
      return await response.json()
    }),

  getQueues: t
    .input(GetQueuesInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.practitionerId) params.append('practitionerId', String(input.practitionerId))
      if (input.queueDate) params.append('queueDate', input.queueDate)
      if (input.queueNumber) params.append('queueNumber', String(input.queueNumber))
      if (input.status) {
        if (Array.isArray(input.status)) {
          input.status.forEach((s) => params.append('status', s))
        } else {
          params.append('status', input.status)
        }
      }

      const response = await client.get(`${BASE_URL}/queues?${params.toString()}`)
      return await response.json()
    }),

  updateQueueStatus: t
    .input(UpdateQueueStatusInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { queueId, ...input }) => {
      const response = await client.put(`${BASE_URL}/queues/${queueId}/status`, input)
      return await response.json()
    }),

  cancelEncounter: t
    .input(CancelEncounterInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { id, ...input }) => {
      const response = await client.put(`${BASE_URL}/encounters/${id}/cancel`, input)
      return await response.json()
    }),

  dischargeEncounter: t
    .input(DischargeEncounterInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { id, ...input }) => {
      const response = await client.put(`${BASE_URL}/encounters/${id}/discharge`, input)
      return await response.json()
    }),

  createAncillaryEncounter: t
    .input(CreateAncillaryEncounterInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const response = await client.post(`${BASE_URL}/encounters/ancillary`, input)
      return await response.json()
    }),

  createLaboratoryEncounter: t
    .input(CreateStandaloneAncillaryEncounterInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const response = await client.post(`${BASE_URL}/encounters/laboratory`, input)
      return await response.json()
    }),

  createRadiologyEncounter: t
    .input(CreateStandaloneAncillaryEncounterInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const response = await client.post(`${BASE_URL}/encounters/radiology`, input)
      return await response.json()
    }),

  createSepInternal: t
    .input(CreateSepInternalInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const response = await client.post(`${BASE_URL}/sep/internal`, input)
      return await response.json()
    }),

  createSepExternal: t
    .input(CreateSepExternalInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const response = await client.post(`${BASE_URL}/sep/external`, input)
      return await response.json()
    }),

  referPatient: t
    .input(ReferPatientInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { encounterId, ...input }) => {
      const response = await client.post(`${BASE_URL}/encounters/${encounterId}/refer`, input)
      return await response.json()
    }),

  getScheduleEditorReferenceData: t
    .input(z.object({}))
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }) => {
      const response = await client.get(`${BASE_URL}/editor/reference-data`)
      return await response.json()
    }),

  getDoctorContracts: t
    .input(GetDoctorContractsInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, { doctorId }) => {
      const response = await client.get(`${BASE_URL}/editor/doctors/${doctorId}/contracts`)
      return await response.json()
    }),

  getScheduleEditorSummary: t
    .input(GetScheduleEditorInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, { scheduleId }) => {
      const response = await client.get(`${BASE_URL}/editor/${scheduleId}/summary`)
      return await response.json()
    }),

  getScheduleInfo: t
    .input(GetScheduleEditorInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, { scheduleId }) => {
      const response = await client.get(`${BASE_URL}/editor/${scheduleId}/info`)
      return await response.json()
    }),

  createScheduleInfo: t
    .input(SaveScheduleInfoInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const response = await client.post(`${BASE_URL}/editor/info`, input)
      return await response.json()
    }),

  updateScheduleInfo: t
    .input(UpdateScheduleInfoInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { scheduleId, ...input }) => {
      const response = await client.put(`${BASE_URL}/editor/${scheduleId}/info`, input)
      return await response.json()
    }),

  getScheduleSessions: t
    .input(GetScheduleEditorInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, { scheduleId }) => {
      const response = await client.get(`${BASE_URL}/editor/${scheduleId}/sessions`)
      return await response.json()
    }),

  saveScheduleSessions: t
    .input(SaveScheduleSessionsInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { scheduleId, ...input }) => {
      const response = await client.put(`${BASE_URL}/editor/${scheduleId}/sessions`, input)
      return await response.json()
    }),

  getScheduleQuotas: t
    .input(GetScheduleEditorInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, { scheduleId }) => {
      const response = await client.get(`${BASE_URL}/editor/${scheduleId}/quotas`)
      return await response.json()
    }),

  saveScheduleQuotas: t
    .input(SyncScheduleQuotaInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { scheduleId, ...input }) => {
      const response = await client.put(`${BASE_URL}/editor/${scheduleId}/quotas`, input)
      return await response.json()
    }),

  getScheduleExceptions: t
    .input(GetScheduleEditorInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, { scheduleId }) => {
      const response = await client.get(`${BASE_URL}/editor/${scheduleId}/exceptions`)
      return await response.json()
    }),

  saveScheduleExceptions: t
    .input(SaveScheduleExceptionsInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { scheduleId, ...input }) => {
      const response = await client.put(`${BASE_URL}/editor/${scheduleId}/exceptions`, input)
      return await response.json()
    }),

  // Schedule Management
  createSchedule: t
    .input(CreateScheduleInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const response = await client.post(`${BASE_URL}/`, input)
      return await response.json()
    }),

  updateSchedule: t
    .input(UpdateScheduleInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { id, ...input }) => {
      const response = await client.put(`${BASE_URL}/${id}`, input)
      return await response.json()
    }),

  createScheduleException: t
    .input(CreateScheduleExceptionInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { doctorScheduleId, ...input }) => {
      const response = await client.post(`${BASE_URL}/${doctorScheduleId}/exceptions`, input)
      return await response.json()
    }),

  updateScheduleException: t
    .input(UpdateScheduleExceptionInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { doctorScheduleId, exceptionId, ...input }) => {
      const response = await client.put(
        `${BASE_URL}/${doctorScheduleId}/exceptions/${exceptionId}`,
        input
      )
      return await response.json()
    }),

  syncScheduleQuota: t
    .input(SyncScheduleQuotaInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, { scheduleId, ...input }) => {
      const response = await client.put(`${BASE_URL}/${scheduleId}/quota`, input)
      return await response.json()
    })
}
