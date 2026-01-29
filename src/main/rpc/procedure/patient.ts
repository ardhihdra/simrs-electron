import { ApiResponseSchema, PatientSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

export const PatientListInputSchema = z.object({
  page: z.number().optional(),
  nik: z.string().optional(),
  name: z.string().optional()
})
export type PatientListInput = z.infer<typeof PatientListInputSchema>

export const PatientGetByIdInputSchema = z.object({ id: z.string() })
export type PatientGetByIdInput = z.infer<typeof PatientGetByIdInputSchema>

export const patientRpc = {
  list: t
    .input(PatientListInputSchema)
    .output(ApiResponseSchema(z.array(PatientSchema)))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.page) params.append('page', String(input.page))
      if (input.nik) params.append('nik', input.nik)
      if (input.name) params.append('name', input.name)

      const data = await client.get(`/api/patient?${params.toString()}`)
      const res = await data.json()
      return res
    }),
  getById: t
    .input(PatientGetByIdInputSchema)
    .output(ApiResponseSchema(PatientSchema))
    .query(async ({ client }, input) => {
      const data = await client.get(`/api/patient/${input.id}`)
      return await data.json()
    }),
  create: t
    .input(PatientSchema.omit({ id: true }))
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/registration/patients', input)
      const res = await data.json()
      return res
    }),
  update: t
    .input(PatientSchema.partial().required({ id: true }))
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      console.log(input)
      const data = await client.put(`/api/module/registration/patients/${input.id}`, input)
      return await data.json()
    })
}
