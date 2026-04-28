import {
  ApiResponseSchema,
  EncounterDischargeInputSchema,
  EncounterFinishInputSchema,
  EncounterListInputSchema
} from 'simrs-types'
import { z } from 'zod'
import { t } from '../'
import {
  InpatientPatientListQuerySchema,
  InpatientPatientListResultSchema,
  InpatientPatientListOptionsSchema,
  normalizeInpatientPatientListResponse,
  normalizeInpatientPatientListOptionsResponse,
} from './encounter.schemas'

export type { InpatientPatientListItem, InpatientPatientListResult, DpjpParticipantItem } from './encounter.schemas'
export { normalizeInpatientPatientListResponse } from './encounter.schemas'

// ── RPC procedures ────────────────────────────────────────────────────────────

export const encounterRpc = {
  // list: GET /module/encounter?depth=1 (Active encounters usually)
  list: t
    .input(EncounterListInputSchema)
    // .output(
    //   ApiResponseSchema(z.array(EncounterSchema.extend({ patient: PatientSchema }).partial()))
    // )
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      // Assuming a general list endpoint exists or we use one that fits
      // Based on reference, maybe just /api/module/encounter with query params
      const params = new URLSearchParams()
      if (input.depth) params.append('depth', String(input.depth))
      if (input.status) params.append('status', input.status)
      if (input.id) params.append('id', input.id)
      if (input.q) params.append('q', input.q)
      if (input.startDate) params.append('startDate', input.startDate)
      if (input.endDate) params.append('endDate', input.endDate)
      if (input.serviceUnitId) params.append('serviceUnitId', input.serviceUnitId)
      if (input.serviceType) params.append('serviceType', input.serviceType)

      const url = `/api/encounter?${params.toString()}`

      const data = await client.get(url)
      return await data.json()
    }),

  // start: PATCH /module/encounter/{id}/start
  start: t
    .input(z.string())
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, id) => {
      const data = await client.patch(`/api/module/encounter/${id}/start`, {})
      return await data.json()
    }),

  // finish: PATCH /module/encounter/{id}/finish
  finish: t
    .input(EncounterFinishInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.patch(`/api/module/encounter/${input.id}/finish`, {
        dischargeDisposition: input.dischargeDisposition
      })
      return await data.json()
    }),

  // discharge: POST /module/encounter/{id}/discharge
  discharge: t
    .input(EncounterDischargeInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post(`/api/module/encounter/${input.id}/discharge`, {
        dischargeDisposition: input.dischargeDisposition
      })
      return await data.json()
    }),

  createLaboratory: t
    .input(z.any())
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/encounter/create-laboratory-request', input)
      return await data.json()
    }),

  createAmbulatory: t
    .input(z.any())
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/encounter/create-ambulatory', input)
      return await data.json()
    }),

  syncSatusehat: t
    .input(z.any())
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post(`/api/module/encounter/${input.id}/sync`, input)
      return await data.json()
    }),

  syncExtracted: t
    .input(z.any())
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post(`/api/module/encounter/${input.id}/sync-extracted`, input)
      return await data.json()
    }),

  reopen: t
    .input(z.string())
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, id) => {
      const data = await client.patch(`/api/module/encounter/${id}/reopen`, {})
      return await data.json()
    }),

  inpatientPatients: t
    .input(InpatientPatientListQuerySchema)
    .output(InpatientPatientListResultSchema)
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      params.set('page', String(input.page))
      params.set('pageSize', String(input.pageSize))
      if (input.search) params.set('search', input.search)
      if (input.encounterStatus) params.set('encounterStatus', input.encounterStatus)
      if (input.wardId) params.set('wardId', input.wardId)
      if (input.dpjpName) params.set('dpjpName', input.dpjpName)
      if (input.paymentType) params.set('paymentType', input.paymentType)
      if (input.losCategory) params.set('losCategory', input.losCategory)
      if (input.sortField) params.set('sortField', input.sortField)
      if (input.sortOrder) params.set('sortOrder', input.sortOrder)
      const data = await client.get(`/api/module/encounter/inpatient-patients?${params}`)
      const payload = await data.json()
      return normalizeInpatientPatientListResponse(payload)
    }),

  inpatientPatientOptions: t
    .input(z.object({}).default({}))
    .output(InpatientPatientListOptionsSchema)
    .query(async ({ client }) => {
      const data = await client.get('/api/module/encounter/inpatient-patients/options')
      const payload = await data.json()
      return normalizeInpatientPatientListOptionsResponse(payload)
    }),

  listDpjp: t
    .input(z.string())
    .output(z.any())
    .query(async ({ client }, encounterId) => {
      const data = await client.get(`/api/module/encounter/${encounterId}/dpjp`)
      return await data.json()
    }),

  assignDpjp: t
    .input(z.object({
      encounterId: z.string(),
      staffId: z.number(),
      role: z.enum(['dpjp_utama', 'dpjp_tambahan']),
      startAt: z.string().optional(),
      notes: z.string().optional(),
    }))
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const data = await client.post(`/api/module/encounter/${input.encounterId}/dpjp`, {
        staffId: input.staffId,
        role: input.role,
        startAt: input.startAt,
        notes: input.notes,
      })
      return await data.json()
    }),

  removeDpjp: t
    .input(z.object({
      encounterId: z.string(),
      participantId: z.number(),
    }))
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const data = await client.delete(`/api/module/encounter/${input.encounterId}/dpjp/${input.participantId}`)
      return await data.json()
    }),
}
