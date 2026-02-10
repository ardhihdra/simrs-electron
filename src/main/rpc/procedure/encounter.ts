import {
  ApiResponseSchema,
  EncounterDischargeInputSchema,
  EncounterFinishInputSchema,
  EncounterListInputSchema
} from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

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

      const data = await client.get(`/api/encounter?${params.toString()}`)
      const res = await data.json()
      console.log('res', res)
      return res
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
    })
}
