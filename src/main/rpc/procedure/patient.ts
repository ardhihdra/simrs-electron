import { PatientSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

export const patientRpc = {
  list: t
    .input(z.object({ page: z.number().optional() }))
    .output(
      z.object({
        message: z.string(),
        result: z.array(PatientSchema)
      })
    )
    .query(async ({ client }, input) => {
      const query = input?.page ? `?page=${input.page}` : ''
      const data = await client.get(`/api/patient${query}`)
      const res = await data.json()
      return res
    }),
  getById: t
    .input(z.object({ id: z.string() }))
    .output(
      z.object({
        message: z.string(),
        data: PatientSchema
      })
    )
    .query(async ({ client }, input) => {
      const data = await client.get(`/api/patient/${input.id}`)
      return await data.json()
    }),
  create: t
    .input(PatientSchema.omit({ id: true }))
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/registration/patients', input)
      const res = await data.json()
      return res
    }),
  update: t
    .input(PatientSchema.partial().required({ id: true }))
    .output(z.any())
    .mutation(async ({ client }, input) => {
      console.log(input)
      const data = await client.put(`/api/module/registration/patients/${input.id}`, input)
      return await data.json()
    })
}
