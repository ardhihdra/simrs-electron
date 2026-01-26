import { z } from 'zod'
import { t } from '../'

const PatientSchema = z.object({
  id: z.string(),
  medicalRecordNumber: z.string(),
  name: z.string(),
  gender: z.string(),
  birthDate: z.string(),
  maritalStatus: z.string(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  city: z.string(),
  province: z.string(),
  postalCode: z.string(),
  country: z.string(),
  relatedPerson: z.array(z.any()),
  insuranceProvider: z.any(),
  insuranceNumber: z.any(),
  active: z.boolean(),
  fhirId: z.any(),
  fhirServer: z.any(),
  fhirVersion: z.any(),
  lastFhirUpdated: z.any(),
  lastSyncedAt: z.any(),
  createdAt: z.string(),
  updatedAt: z.string(),
  encounters: z.array(z.any()),
  observations: z.array(z.any()),
  conditions: z.array(z.any())
})

export const patientRpc = {
  list: t
    .input(z.object({ page: z.number().optional() }))
    .output(
      z.object({
        message: z.string(),
        result: z.array(PatientSchema)
      })
    )
    .query(async ({ client }) => {
      const data = await client.get('/api/patient')
      const res = await data.json()
      return res
    })
}
