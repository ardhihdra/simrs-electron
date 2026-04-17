import {
  ApiResponseSchema,
  CancelEncounterInputSchema,
  CreateAncillaryEncounterInputSchema,
  CreateScheduleExceptionInputSchema,
  CreateScheduleInputSchema,
  CreateSepExternalInputSchema,
  CreateSepInternalInputSchema,
  CreateStandaloneAncillaryEncounterInputSchema,
  DischargeEncounterInputSchema,
  GetAvailableDoctorsInputSchema,
  GetDoctorContractsInputSchema,
  GetQueueDetailInputSchema,
  GetQueuesInputSchema,
  GetScheduleEditorInputSchema,
  ReferPatientInputSchema,
  RegisterInputSchema,
  SaveScheduleExceptionsInputSchema,
  SaveScheduleInfoInputSchema,
  SaveScheduleSessionsInputSchema,
  SyncScheduleQuotaInputSchema,
  UpdateScheduleExceptionInputSchema,
  UpdateScheduleInfoInputSchema,
  UpdateScheduleInputSchema
} from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

const BASE_URL = '/api/module/registration-v2'

const UpdateQueueStatusRpcInputSchema = z.object({
  queueId: z.union([z.string(), z.number()]),
  action: z.enum([
    'CHECK_IN',
    'CONFIRM_ATTENDANCE',
    'CALL',
    'SKIP',
    'RECALL_TO_PRE_RESERVED',
    'CALL_PATIENT_WITH_NO_IDENTITY',
    'CREATE_SEP',
    'START_ENCOUNTER',
    'CALL_TO_TRIAGE',
    'TRIAGE_DONE',
    'FINISH'
  ]),
  patientId: z.string().uuid().optional(),
  paymentMethod: z.enum(['CASH', 'INSURANCE', 'ASURANSI', 'COMPANY', 'BPJS']).optional()
})

const InternalAncillaryOrderInputSchema = z.object({
  parentEncounterId: z.string().min(1),
  parentPoliCodeId: z.coerce.number().int().positive(),
  sourcePoliName: z.string().optional(),
  sourceLocationId: z.coerce.number().int().positive().optional(),
  patientId: z.string().min(1),
  category: z.enum(['LABORATORY', 'RADIOLOGY']),
  referringPractitionerId: z.coerce.number().int().positive(),
  referringPractitionerName: z.string().min(1),
  targetPractitionerId: z.coerce.number().int().positive(),
  targetPractitionerName: z.string().min(1),
  targetLocationId: z.coerce.number().int().positive(),
  targetLocationName: z.string().optional(),
  reasonForReferral: z.string().optional(),
  diagnosisText: z.string().optional(),
  conditionAtTransfer: z.string().optional(),
  patientInstruction: z.string().optional(),
  priority: z.string().min(1),
  serviceRequests: z
    .array(
      z.object({
        masterServiceRequestCodeId: z.number(),
        code: z.string().min(1),
        display: z.string().min(1),
        system: z.string().optional()
      })
    )
    .min(1)
})

const InternalAncillaryOrderResultSchema = z.object({
  success: z.literal(true),
  childEncounterId: z.string(),
  referralId: z.string().optional(),
  serviceRequestIds: z.array(z.string()),
  message: z.string().optional()
})

type JsonObject = Record<string, any>

async function parseJsonResponse(response: Response) {
  return (await response.json().catch(() => ({
    success: false,
    message: 'Invalid JSON response'
  }))) as JsonObject
}

function extractResultRecord<T = JsonObject>(
  payload: JsonObject | null | undefined
): T | undefined {
  if (!payload || typeof payload !== 'object') return undefined

  const directCandidates = [
    payload.result?.encounter,
    payload.data?.encounter,
    payload.result?.referral,
    payload.data?.referral,
    payload.result,
    payload.data,
    payload.encounter,
    payload.referral,
    payload
  ]

  for (const candidate of directCandidates) {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate as T
    }
  }

  return undefined
}

function extractId(payload: JsonObject | null | undefined, fallbackKeys: string[] = ['id']) {
  if (!payload || typeof payload !== 'object') return undefined

  const record = extractResultRecord(payload)
  const candidates = [
    payload,
    record,
    payload.result?.encounter,
    payload.data?.encounter,
    payload.result?.referral,
    payload.data?.referral
  ].filter(Boolean) as JsonObject[]

  for (const candidate of candidates) {
    for (const key of fallbackKeys) {
      const value = candidate?.[key]
      if (value !== undefined && value !== null && value !== '') {
        return String(value)
      }
    }
  }

  return undefined
}

function buildCategoryLabel(category: 'LABORATORY' | 'RADIOLOGY') {
  return category === 'LABORATORY' ? 'Laboratorium Internal' : 'Radiologi Internal'
}

function mapPriorityToServiceRequest(priority: string) {
  const normalized = String(priority || '')
    .trim()
    .toLowerCase()

  if (normalized === 'stat') return 'stat'
  if (normalized === 'urgent') return 'urgent'
  if (normalized === 'asap') return 'asap'
  return 'routine'
}

function buildEncounterUpdatePayload(
  encounter: JsonObject,
  overrides: Partial<JsonObject> = {}
): JsonObject {
  const patientId = String(overrides.patientId ?? encounter.patientId ?? '')
  const visitDate =
    overrides.visitDate ??
    encounter.visitDate ??
    encounter.startTime ??
    encounter.period?.start ??
    new Date().toISOString()

  const serviceType =
    overrides.serviceType ??
    encounter.serviceType ??
    encounter.serviceUnitId ??
    encounter.category ??
    'ANCILLARY'

  return {
    patientId,
    visitDate,
    serviceType: String(serviceType),
    reason: overrides.reason ?? encounter.reason ?? null,
    note: overrides.note ?? encounter.note ?? null,
    status: String(overrides.status ?? encounter.status ?? 'PLANNED'),
    resourceType: 'Encounter',
    serviceUnitId: overrides.serviceUnitId ?? encounter.serviceUnitId ?? undefined,
    poliCodeId: overrides.poliCodeId ?? encounter.poliCodeId ?? undefined,
    serviceUnitCodeId: overrides.serviceUnitCodeId ?? encounter.serviceUnitCodeId ?? undefined,
    queueTicketId: overrides.queueTicketId ?? encounter.queueTicketId ?? undefined,
    episodeOfCareId: overrides.episodeOfCareId ?? encounter.episodeOfCareId ?? undefined,
    encounterType: overrides.encounterType ?? encounter.encounterType ?? undefined,
    arrivalType: overrides.arrivalType ?? encounter.arrivalType ?? undefined,
    startTime: overrides.startTime ?? encounter.startTime ?? undefined,
    endTime: overrides.endTime ?? encounter.endTime ?? null,
    partOfId: overrides.partOfId ?? encounter.partOfId ?? null,
    dischargeDisposition:
      overrides.dischargeDisposition ?? encounter.dischargeDisposition ?? undefined,
    period: overrides.period ??
      encounter.period ?? {
        start: visitDate
      },
    serviceTypeCode: overrides.serviceTypeCode ?? encounter.serviceTypeCode ?? undefined,
    subject: overrides.subject ??
      encounter.subject ?? {
        reference: patientId ? `Patient/${patientId}` : undefined
      },
    participant: overrides.participant ?? encounter.participant ?? undefined,
    reasonCode: overrides.reasonCode ?? encounter.reasonCode ?? undefined,
    reasonReference: overrides.reasonReference ?? encounter.reasonReference ?? undefined,
    hospitalization: overrides.hospitalization ?? encounter.hospitalization ?? undefined,
    location: overrides.location ?? encounter.location ?? undefined,
    encounterCode: overrides.encounterCode ?? encounter.encounterCode ?? undefined,
    serviceRequestId: overrides.serviceRequestId ?? encounter.serviceRequestId ?? undefined,
    updatedBy: overrides.updatedBy ?? encounter.updatedBy ?? undefined
  }
}

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

  getQueueDetail: t
    .input(GetQueueDetailInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, { queueId }) => {
      const response = await client.get(`${BASE_URL}/queues/${queueId}/detail`)
      return await response.json()
    }),

  updateQueueStatus: t
    .input(UpdateQueueStatusRpcInputSchema)
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

  createInternalAncillaryOrder: t
    .input(InternalAncillaryOrderInputSchema)
    .output(InternalAncillaryOrderResultSchema)
    .mutation(async ({ client }, input) => {
      const parentEncounterId = String(input.parentEncounterId || '').trim()
      const parentPoliCodeId = Number(input.parentPoliCodeId)

      if (!parentEncounterId) {
        throw new Error('[VALIDATION] parentEncounterId wajib diisi')
      }

      if (!Number.isInteger(parentPoliCodeId) || parentPoliCodeId <= 0) {
        throw new Error('[VALIDATION] parentPoliCodeId wajib berupa angka positif')
      }

      const createEncounterEndpoint =
        input.category === 'LABORATORY'
          ? `${BASE_URL}/encounters/laboratory`
          : `${BASE_URL}/encounters/radiology`

      const createEncounterResponse = await client.post(createEncounterEndpoint, {
        patientId: input.patientId,
        practitionerId: input.targetPractitionerId,
        requestedByPractitionerId: input.referringPractitionerId,
        arrivalType: 'REFERRAL'
      })
      const createEncounterPayload = await parseJsonResponse(createEncounterResponse)

      if (!createEncounterResponse.ok || createEncounterPayload?.success === false) {
        throw new Error(
          `[CREATE_CHILD_ENCOUNTER] Gagal membuat child encounter: ${
            createEncounterPayload?.error ||
            createEncounterPayload?.message ||
            createEncounterResponse.statusText
          }`
        )
      }

      const childEncounterId = extractId(createEncounterPayload, [
        'id',
        'encounterId',
        'childEncounterId'
      ])

      if (!childEncounterId) {
        throw new Error(
          '[CREATE_CHILD_ENCOUNTER] Gagal membuat child encounter: ID encounter baru tidak ditemukan'
        )
      }

      const createdEncounter =
        extractResultRecord<JsonObject>(createEncounterPayload) ?? createEncounterPayload

      const categoryLabel = buildCategoryLabel(input.category)
      const sourcePoliLabel = input.sourcePoliName?.trim() || `Poli #${parentPoliCodeId}`
      const encounterReason =
        input.reasonForReferral?.trim() ||
        `Rujukan internal ${categoryLabel.toLowerCase()} dari ${input.referringPractitionerName}`
      const encounterNote = [
        `Rujukan internal ${categoryLabel}`,
        `Dokter pengirim: ${input.referringPractitionerName}`,
        `Dokter tujuan: ${input.targetPractitionerName}`,
        input.targetLocationName?.trim() ? `Lokasi tujuan: ${input.targetLocationName.trim()}` : '',
        input.conditionAtTransfer?.trim()
          ? `Keadaan saat kirim: ${input.conditionAtTransfer.trim()}`
          : '',
        input.diagnosisText?.trim() ? `Diagnosa: ${input.diagnosisText.trim()}` : '',
        input.patientInstruction?.trim()
          ? `Instruksi pasien: ${input.patientInstruction.trim()}`
          : ''
      ]
        .filter(Boolean)
        .join('\n')

      const updateEncounterResponse = await client.put(`/api/encounter/${childEncounterId}`, {
        ...buildEncounterUpdatePayload(createdEncounter, {
          patientId: input.patientId,
          partOfId: parentEncounterId,
          poliCodeId: parentPoliCodeId,
          reason: encounterReason,
          note: encounterNote,
          arrivalType: 'REFERRAL',
          updatedBy: input.referringPractitionerId
        })
      })
      const updateEncounterPayload = await parseJsonResponse(updateEncounterResponse)

      if (!updateEncounterResponse.ok || updateEncounterPayload?.success === false) {
        throw new Error(
          `[UPDATE_CHILD_ENCOUNTER] Child encounter berhasil dibuat (#${childEncounterId}), tetapi gagal melengkapi relasi rujukan: ${
            updateEncounterPayload?.error ||
            updateEncounterPayload?.message ||
            updateEncounterResponse.statusText
          }`
        )
      }

      const verifyChildEncounterResponse = await client.get(
        `/api/module/encounter/${childEncounterId}`
      )
      const verifyChildEncounterPayload = await parseJsonResponse(verifyChildEncounterResponse)

      if (!verifyChildEncounterResponse.ok || verifyChildEncounterPayload?.success === false) {
        throw new Error(
          `[VERIFY_CHILD_ENCOUNTER] Child encounter berhasil diupdate (#${childEncounterId}), tetapi gagal verifikasi hasil update: ${
            verifyChildEncounterPayload?.error ||
            verifyChildEncounterPayload?.message ||
            verifyChildEncounterResponse.statusText
          }`
        )
      }

      const verifiedChildEncounter =
        extractResultRecord<JsonObject>(verifyChildEncounterPayload) ?? verifyChildEncounterPayload
      const verifiedPartOfId = String(verifiedChildEncounter?.partOfId || '')
      const verifiedPoliCodeId = Number(verifiedChildEncounter?.poliCodeId)

      if (verifiedPartOfId !== parentEncounterId) {
        throw new Error(
          `[VERIFY_CHILD_ENCOUNTER] partOfId child encounter tidak sesuai. Expected=${parentEncounterId}, actual=${verifiedPartOfId || 'null'}`
        )
      }

      if (!Number.isInteger(verifiedPoliCodeId) || verifiedPoliCodeId !== parentPoliCodeId) {
        throw new Error(
          `[VERIFY_CHILD_ENCOUNTER] poliCodeId child encounter tidak sesuai. Expected=${parentPoliCodeId}, actual=${
            Number.isFinite(verifiedPoliCodeId) ? String(verifiedPoliCodeId) : 'null'
          }`
        )
      }

      const referralResponse = await client.post('/api/referral', {
        encounterId: parentEncounterId,
        patientId: input.patientId,
        referredBy: input.referringPractitionerId,
        referralType: 'internal',
        referralDate: new Date().toISOString(),
        status: 'issued',
        direction: 'outgoing',
        sourceOrganizationName: sourcePoliLabel,
        sourceLocationId: input.sourceLocationId,
        referringPractitionerId: String(input.referringPractitionerId),
        referringPractitionerName: input.referringPractitionerName,
        targetOrganizationName: categoryLabel,
        targetLocationId: input.targetLocationId,
        targetPractitionerId: String(input.targetPractitionerId),
        targetPractitionerName: input.targetPractitionerName,
        reasonForReferral: input.reasonForReferral,
        diagnosisText: input.diagnosisText?.trim() || encounterReason,
        keadaanKirim: input.conditionAtTransfer?.trim() || undefined,
        conditionAtTransfer: input.conditionAtTransfer?.trim() || undefined,
        examinationSummary: encounterNote
      })
      const referralPayload = await parseJsonResponse(referralResponse)

      if (!referralResponse.ok || referralPayload?.success === false) {
        throw new Error(
          `[CREATE_REFERRAL] Child encounter berhasil dibuat (#${childEncounterId}), tetapi gagal membuat referral internal: ${
            referralPayload?.error || referralPayload?.message || referralResponse.statusText
          }`
        )
      }

      const serviceRequestCategory = input.category === 'LABORATORY' ? 'LABORATORY' : 'RADIOLOGY'
      const createOrderResponse = await client.post('/api/servicerequest', {
        encounterId: childEncounterId,
        patientId: input.patientId,
        doctorId: input.referringPractitionerId,
        serviceRequests: input.serviceRequests.map((serviceRequest) => ({
          category: serviceRequestCategory,
          code: serviceRequest.code,
          display: serviceRequest.display,
          system: serviceRequest.system || 'http://loinc.org',
          masterServiceRequestCodeId: serviceRequest.masterServiceRequestCodeId,
          priority: mapPriorityToServiceRequest(input.priority),
          patientInstruction: input.patientInstruction?.trim() || undefined
        })),
        requesterPractitionerId: String(input.referringPractitionerId)
      })
      const createOrderPayload = await parseJsonResponse(createOrderResponse)

      if (!createOrderResponse.ok || createOrderPayload?.success === false) {
        throw new Error(
          `[CREATE_SERVICE_REQUEST] Child encounter dan referral berhasil dibuat (#${childEncounterId}), tetapi gagal membuat order penunjang: ${
            createOrderPayload?.error ||
            createOrderPayload?.message ||
            createOrderResponse.statusText
          }`
        )
      }

      const serviceRequestIds = Array.isArray(createOrderPayload?.result)
        ? createOrderPayload.result
            .map((item: JsonObject) => item?.id)
            .filter((item: unknown) => item !== undefined && item !== null && item !== '')
            .map((item: unknown) => String(item))
        : []

      const lastServiceRequestId = serviceRequestIds.at(-1)

      if (lastServiceRequestId) {
        const childEncounterForLink = verifiedChildEncounter ?? createdEncounter
        const linkEncounterResponse = await client.put(`/api/encounter/${childEncounterId}`, {
          ...buildEncounterUpdatePayload(childEncounterForLink, {
            patientId: input.patientId,
            partOfId: parentEncounterId,
            poliCodeId: parentPoliCodeId,
            reason: encounterReason,
            note: encounterNote,
            arrivalType: 'REFERRAL',
            serviceRequestId: lastServiceRequestId,
            updatedBy: input.referringPractitionerId
          })
        })
        const linkEncounterPayload = await parseJsonResponse(linkEncounterResponse)

        if (!linkEncounterResponse.ok || linkEncounterPayload?.success === false) {
          throw new Error(
            `[LINK_SERVICE_REQUEST] Child encounter, referral, dan service request berhasil dibuat (#${childEncounterId}), tetapi gagal menautkan service request ke encounter: ${
              linkEncounterPayload?.error ||
              linkEncounterPayload?.message ||
              linkEncounterResponse.statusText
            }`
          )
        }
      }

      return {
        success: true as const,
        childEncounterId,
        referralId: extractId(referralPayload, ['id', 'referralId']),
        serviceRequestIds,
        message: 'Rujukan internal penunjang berhasil dibuat'
      }
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
