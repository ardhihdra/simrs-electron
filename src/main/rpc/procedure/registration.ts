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
  queueDate: z.string().optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  queueNumber: z.number().optional()
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
    'CALL_TO_TRIAGE',
    'TRIAGE_DONE',
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
  dischargeDisposition: z.enum([
    'home',
    'alt-home',
    'other-hcf',
    'hosp',
    'long',
    'aadvice',
    'exp',
    'psy',
    'rehab',
    'snf',
    'oth'
  ]).optional(),
  dischargeNote: z.string().optional()
})

const AncillaryArrivalTypeSchema = z.enum(['WALK_IN', 'REFERRAL', 'EMERGENCY', 'APPOINTMENT', 'INTERNAL_ORDER'])

const CreateAncillaryEncounterInputSchema = z.object({
  patientId: z.string().uuid(),
  parentEncounterId: z.string().uuid(),
  serviceUnitId: z.string(),
  serviceRequestId: z.string().uuid().optional(),
  category: z.enum(['LABORATORY', 'RADIOLOGY']),
  practitionerId: z.number(),
  requestedByPractitionerId: z.number(),
  items: z.array(z.object({
    testCodeId: z.string(),
    priority: z.string()
  })).optional()
})

const CreateStandaloneAncillaryEncounterInputSchema = z.object({
  patientId: z.string().uuid(),
  serviceRequestId: z.string().min(1).optional(),
  serviceUnitId: z.string().optional(),
  practitionerId: z.number(),
  requestedByPractitionerId: z.number().optional(),
  episodeOfCareId: z.string().uuid().optional(),
  createdBy: z.number().optional(),
  arrivalType: AncillaryArrivalTypeSchema.optional()
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
const ReferPatientInputSchema = z.object({
  encounterId: z.string().uuid(),
  referringPractitionerId: z.number(),
  referringPractitionerName: z.string(),
  internalTargetType: z.enum(['POLI', 'LABORATORY', 'RADIOLOGY']).optional(),
  targetOrganizationId: z.string().optional(),
  targetOrganizationName: z.string().optional(),
  targetDepartemenId: z.number().optional(),
  targetPractitionerId: z.string().optional(),
  targetPractitionerName: z.string().optional(),
  referralDate: z.string(),
  diagnosisCode: z.string().optional(),
  diagnosisText: z.string().optional(),
  keadaanKirim: z.string().optional(),
  reasonForReferral: z.string().optional(),
  doctorScheduleId: z.number().optional(),
  direction: z.enum(['incoming', 'outgoing']),
  referralType: z.enum(['internal', 'external'])
})

const CreateScheduleInputSchema = z.object({
  doctorId: z.number(),
  poliId: z.number(),
  lokasiKerjaId: z.number(),
  kontrakKerjaId: z.number(),
  category: z.string(),
  name: z.string().optional(),
  validFrom: z.string(),
  validTo: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  remark: z.string().optional(),
  sessions: z.array(
    z.object({
      dayOfWeek: z.number(),
      sessionNumber: z.number(),
      startTime: z.string(),
      endTime: z.string(),
      quota: z.number().optional(),
      isActive: z.boolean().optional()
    })
  )
})

const UpdateScheduleInputSchema = z.object({
  id: z.number(),
  doctorId: z.number().optional(),
  poliId: z.number().optional(),
  lokasiKerjaId: z.number().optional(),
  kontrakKerjaId: z.number().optional(),
  category: z.string().optional(),
  name: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  status: z.string().optional(),
  remark: z.string().optional(),
  sessions: z.array(
    z.object({
      dayOfWeek: z.number(),
      sessionNumber: z.number(),
      startTime: z.string(),
      endTime: z.string(),
      quota: z.number().optional(),
      isActive: z.boolean().optional()
    })
  ).optional()
})

const CreateScheduleExceptionInputSchema = z.object({
  doctorScheduleId: z.number(),
  date: z.string(),
  type: z.string(),
  mode: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sessions: z.array(
    z.object({
      sessionNumber: z.number(),
      startTime: z.string(),
      endTime: z.string(),
      quota: z.number().optional(),
      isActive: z.boolean().optional()
    })
  ).optional()
})

const UpdateScheduleExceptionInputSchema = z.object({
  doctorScheduleId: z.number(),
  exceptionId: z.number(),
  date: z.string().optional(),
  type: z.string().optional(),
  mode: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sessions: z.array(
    z.object({
      sessionNumber: z.number(),
      startTime: z.string(),
      endTime: z.string(),
      quota: z.number().optional(),
      isActive: z.boolean().optional()
    })
  ).optional()
})

const SyncScheduleQuotaInputSchema = z.object({
  scheduleId: z.number(),
  doctorId: z.number(),
  status: z.enum(['active', 'inactive']).optional(),
  values: z.array(
    z.object({
      hari: z.number(),
      source: z.enum(['online', 'offline']),
      paymentMethod: z.enum(['cash', 'asuransi', 'company', 'bpjs']),
      quotaValue: z.number().nullable().optional()
    })
  )
})

const GetDoctorContractsInputSchema = z.object({
  doctorId: z.number()
})

const GetScheduleEditorInputSchema = z.object({
  scheduleId: z.number()
})

const SaveScheduleInfoInputSchema = z.object({
  doctorId: z.number(),
  poliId: z.number(),
  lokasiKerjaId: z.number(),
  kontrakKerjaId: z.number(),
  category: z.string(),
  name: z.string().optional(),
  validFrom: z.string(),
  validTo: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  remark: z.string().optional()
})

const UpdateScheduleInfoInputSchema = SaveScheduleInfoInputSchema.extend({
  scheduleId: z.number()
})

const SaveScheduleSessionsInputSchema = z.object({
  scheduleId: z.number(),
  sessions: z.array(
    z.object({
      dayOfWeek: z.number(),
      sessionNumber: z.number(),
      startTime: z.string(),
      endTime: z.string(),
      quota: z.number().nullable().optional(),
      isActive: z.boolean().optional()
    })
  )
})

const SaveScheduleExceptionsInputSchema = z.object({
  scheduleId: z.number(),
  exceptions: z.array(
    z.object({
      date: z.string(),
      type: z.string(),
      mode: z.string(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
      sessions: z.array(
        z.object({
          sessionNumber: z.number(),
          startTime: z.string(),
          endTime: z.string(),
          quota: z.number().nullable().optional(),
          isActive: z.boolean().optional()
        })
      ).optional()
    })
  )
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
