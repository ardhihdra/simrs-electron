import { z } from 'zod'
import { t } from '../'

export const laboratoryRpc = {
  // listEncounters: GET /api/encounter?encounterType=LAB&status=IN_PROGRESS&include=...
  listEncounters: t
    .input(
      z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        id: z.string().optional()
      })
    )
    .output(z.any())
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      params.append('encounterType', 'LAB')
      params.append('status', 'IN_PROGRESS')
      params.append(
        'include',
        'labServiceRequests.serviceCode,labServiceRequests.observations,patient'
      )
      if (input.limit) params.append('limit', String(input.limit))
      if (input.offset) params.append('offset', String(input.offset))
      if (input.id) params.append('id', input.id)

      const data = await client.get(`/api/encounter?${params.toString()}`)
      const result = await data.json()
      console.log('List Encounters', result)
      return result
    }),

  // listLabReports: GET /api/encounter?encounterType=LAB&status=FINISHED
  listLabReports: t
    .input(
      z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        id: z.string().optional()
      })
    )
    .output(z.any())
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      params.append('encounterType', 'LAB')
      params.append('status', 'FINISHED')
      params.append(
        'include',
        'labServiceRequests.serviceCode,labServiceRequests.observations,patient'
      )
      if (input.limit) params.append('limit', String(input.limit))
      if (input.offset) params.append('offset', String(input.offset))
      if (input.id) params.append('id', input.id)

      const data = await client.get(`/api/encounter?${params.toString()}`)
      const result = await data.json()

      return result
    }),

  // createOrder: POST /api/module/laboratory/order
  createOrder: t
    .input(z.any())
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/laboratory/order', input)
      return await data.json()
    }),

  // collectSpecimen: POST /api/module/laboratory/specimen
  collectSpecimen: t
    .input(z.any())
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/laboratory/specimen', input)
      return await data.json()
    }),

  // recordResult: POST /api/module/laboratory/result
  recordResult: t
    .input(z.any())
    .output(z.any())
    .mutation(async ({ client }, input) => {
      // Check if input contains a file to upload
      // We now merge them into a single request:
      // - jsonPayload: JSON string of input (minus file)
      // - file: Binary file

      const formData = new FormData()

      const { file, filename, mimetype, ...restInput } = input

      // Debug log to verify what we are about to send
      console.log('RPC Processing Payload:', JSON.stringify(restInput, null, 2))
      console.log('RPC Has File:', !!file)

      formData.append('jsonPayload', JSON.stringify(restInput))

      if (file && filename) {
        const fileBlob = new Blob([file], {
          type: mimetype || 'application/octet-stream'
        })
        formData.append('file', fileBlob, filename)
      }

      const data = await client.createWithUpload('/api/module/laboratory/result', formData)
      console.log('Record Result', data)
      return await data.json()
    }),

  // getReport: GET /api/module/laboratory/report/{id}
  getReport: t
    .input(z.string())
    .output(z.any())
    .query(async ({ client }, id) => {
      const data = await client.get(`/api/module/laboratory/report/${id}`)
      return await data.json()
    }),

  listOrder: t
    .input(z.any())
    .output(z.any())
    .query(async ({ client }) => {
      const data = await client.get(`/api/clinicalservicerequest`)
      const result = await data.json()
      console.log('List Order', result)
      return result
    }),

  listDiagnosticReport: t
    .input(z.any())
    .output(z.any())
    .query(async ({ client }) => {
      const params = new URLSearchParams()
      params.append(
        'include',
        'encounter.labServiceRequests.serviceCode,patient,observations,imagingStudies'
      )
      const data = await client.get(`/api/labdiagnosticreport?${params.toString()}`)
      const result = await data.json()
      console.log('List Report', result)
      return result
    })
}
