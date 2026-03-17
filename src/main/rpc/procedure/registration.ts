import { ApiResponseSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

const BASE_URL = '/api/module/registration-v2'

// --- Schemas ---

const GetAvailableDoctorsInputSchema = z.object({
  date: z.string().optional(),
  poliId: z.number().optional(),
  doctorName: z.string().optional(),
  hour: z.string().optional()
})

const RegisterInputSchema = z.object({
  practitionerId: z.number(),
  queueDate: z.string(),
  visitDate: z.string().optional(),
  doctorScheduleId: z.number(),
  registrationType: z.string(),
  patientId: z.string().uuid(),
  assuranceCodeId: z.string().optional(),
  paymentMethod: z.string(),
  mitraId: z.number().optional(),
  mitraCodeNumber: z.string().optional(),
  mitraCodeExpiredDate: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional()
})

const GetQueuesInputSchema = z.object({
  practitionerId: z.number().optional(),
  queueDate: z.string().optional()
})

const UpdateQueueStatusInputSchema = z.object({
  queueId: z.union([z.string(), z.number()]),
  action: z.enum([
    'CHECK_IN',
    'CONFIRM_ATTENDANCE',
    'CALL',
    'CALL_PATIENT_WITH_NO_IDENTITY',
    'CREATE_SEP',
    'START_ENCOUNTER',
    'FINISH'
  ]),
  patientId: z.string().uuid().optional()
})

const CancelEncounterInputSchema = z.object({
  id: z.union([z.string(), z.number()]),
  reason: z.string()
})

const DischargeEncounterInputSchema = z.object({
  id: z.union([z.string(), z.number()]),
  endTime: z.string().optional(),
  dischargeDisposition: z.string().optional(),
  dischargeNote: z.string().optional()
})

const CreateAncillaryEncounterInputSchema = z.object({
  patientId: z.string().uuid(),
  parentEncounterId: z.string().uuid(),
  serviceUnitId: z.string(),
  serviceRequestId: z.string().optional(),
  category: z.enum(['LABORATORY', 'RADIOLOGY']),
  practitionerId: z.number(),
  requestedByPractitionerId: z.number()
})

const CreateSepInternalInputSchema = z.object({
  patientId: z.string(),
  encounterId: z.string(),
  referralId: z.string().nullish(),
  tglSep: z.string(),
  noKartu: z.string().nullish(),
  noMr: z.string().nullish(),
  participantName: z.string().nullish(),
  jnsPelayanan: z.string().nullish(),
  kelasRawatHak: z.string().nullish(),
  kelasRawatNaik: z.string().nullish(),
  pembiayaan: z.string().nullish(),
  penanggungJawab: z.string().nullish(),
  noRujukan: z.string().nullish(),
  asalRujukanType: z.string().nullish(),
  asalFaskesCode: z.string().nullish(),
  asalFaskesName: z.string().nullish(),
  poliTujuanCode: z.string().nullish(),
  poliTujuanName: z.string().nullish(),
  dpjpPractitionerId: z.string().nullish(),
  dpjpCode: z.string().nullish(),
  dpjpName: z.string().nullish(),
  diagAwalCode: z.string().nullish(),
  diagAwalName: z.string().nullish(),
  catatan: z.string().nullish(),
  tujuanKunjungan: z.string().nullish(),
  flagProcedure: z.string().nullish(),
  kdPenunjang: z.string().nullish(),
  assesmentPel: z.string().nullish(),
  createdBy: z.number().nullish()
})

const CreateSepExternalInputSchema = z.object({
  patientId: z.string(),
  referralId: z.string().nullish(),
  tglSep: z.string(),
  noKartu: z.string(),
  noMr: z.string().nullish(),
  participantName: z.string().nullish(),
  jnsPelayanan: z.string(),
  kelasRawatHak: z.string().nullish(),
  kelasRawatNaik: z.string().nullish(),
  pembiayaan: z.string().nullish(),
  penanggungJawab: z.string().nullish(),
  noRujukan: z.string(),
  asalRujukanType: z.string(),
  asalFaskesCode: z.string(),
  asalFaskesName: z.string().nullish(),
  poliTujuanCode: z.string().nullish(),
  poliTujuanName: z.string().nullish(),
  dpjpPractitionerId: z.string().nullish(),
  dpjpCode: z.string().nullish(),
  dpjpName: z.string().nullish(),
  diagAwalCode: z.string().nullish(),
  diagAwalName: z.string().nullish(),
  catatan: z.string().nullish(),
  tujuanKunjungan: z.string().nullish(),
  flagProcedure: z.string().nullish(),
  kdPenunjang: z.string().nullish(),
  assesmentPel: z.string().nullish(),
  createdBy: z.number().nullish()
})

const CreateScheduleInputSchema = z.object({
  doctorId: z.number(),
  poliId: z.number(),
  lokasiKerjaId: z.number(),
  kontrakKerjaId: z.number(),
  category: z.string(),
  name: z.string(),
  validFrom: z.string(),
  validTo: z.string().optional(),
  sessions: z.array(
    z.object({
      dayOfWeek: z.number(),
      sessionNumber: z.number(),
      startTime: z.string(),
      endTime: z.string(),
      quota: z.number()
    })
  )
})

const UpdateScheduleInputSchema = z.object({
  id: z.number(),
  category: z.string().optional(),
  name: z.string().optional(),
  status: z.string().optional(),
  sessions: z.array(z.any()).optional()
})

const CreateScheduleExceptionInputSchema = z.object({
  doctorScheduleId: z.number(),
  date: z.string(),
  type: z.string(),
  mode: z.string(),
  description: z.string().optional(),
  sessions: z.array(z.any()).optional()
})

const UpdateScheduleExceptionInputSchema = z.object({
  doctorScheduleId: z.number(),
  exceptionId: z.number(),
  date: z.string().optional(),
  type: z.string().optional(),
  mode: z.string().optional(),
  description: z.string().optional(),
  sessions: z.array(z.any()).optional()
})

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
    })
}
