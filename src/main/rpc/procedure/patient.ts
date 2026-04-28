/**
 * purpose: RPC procedure pasien untuk list, detail, create, dan update dari renderer.
 * main callers: Hook/query renderer pada modul registrasi, lookup pasien, dan IGD.
 * key dependencies: `PatientListInputSchema` dari `simrs-types`, `zod`, dan transport `client`.
 * main/public functions: `patientRpc` (`list`, `getById`, `create`, `update`).
 * side effects: HTTP request read/write ke endpoint patient dan visit-management.
 */
import { ApiResponseSchema, PatientListInputSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

// --- Schemas are now in simrs-types ---

export const patientRpc = {
  list: t
    .input(PatientListInputSchema)
    .output(ApiResponseSchema(z.array(z.any())))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.page) params.append('page', String(input.page))
      if (input.nik) params.append('nik', input.nik)
      if (input.name) {
        params.append('q', input.name)
        params.append('fields', 'name,address')
      }

      const data = await client.get(`/api/patient?${params.toString()}`)
      const res = await data.json()
      console.log('RES PATIENT:', res)
      return res
    }),
  getById: t
    .input(z.any())
    .output(z.any())
    .query(async ({ client }, input) => {
      console.log(`/api/patient/${input.id}`)
      const data = await client.get(`/api/patient/${input.id}/read`)
      const res = await data.json()
      console.log(res)
      return res
    }),
  create: t
    .input(z.any())
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/visit-management/patients', input)
      const res = await data.json()
      return res
    }),
  update: t
    .input(z.any())
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      console.log(input)
      // We use post to the visit-management patients endpoint because it acts as an upsert based on the ID/NIK
      const data = await client.post('/api/module/visit-management/patients', input)
      return await data.json()
    })
}
