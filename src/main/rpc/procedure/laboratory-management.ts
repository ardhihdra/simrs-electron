import {
  ApiResponseSchema,
  Interpretation,
  LabPrioritySchema,
  LabServiceRequestStatusSchema,
  CreateLabOrderSchema,
  CollectSpecimenSchema,
  RecordLabResultSchema,
  RecordRadiologyResultSchema,
  UploadRadiologyDicomSchema,
  ServiceRequestCodeSearchSchema
} from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

// --- RPC ---

const TerminologyUnitSearchSchema = z.object({
  query: z.string().optional(),
  loincCode: z.string().optional(),
  domain: z.enum(['laboratory', 'radiology']).optional()
})

const ServiceRequestCategorySearchSchema = z.object({
  domain: z.enum(['laboratory', 'radiology']).optional()
})
const AncillaryOrderCategorySchema = z.enum(['LABORATORY', 'RADIOLOGY'])

export const laboratoryManagementRpc = {
  // Orders
  createOrder: t
    .input(CreateLabOrderSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const res = await client.post('/api/module/lab-management/order', input)
      return await res.json()
    }),

  getPendingOrders: t
    .input(
      z.object({
        status: LabServiceRequestStatusSchema.optional(),
        priority: LabPrioritySchema.optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        category: AncillaryOrderCategorySchema.optional()
      })
    )
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.status) params.append('status', input.status)
      if (input.priority) params.append('priority', input.priority)
      if (input.fromDate) params.append('fromDate', input.fromDate)
      if (input.toDate) params.append('toDate', input.toDate)
      if (input.category) params.append('category', input.category)

      const res = await client.get(`/api/module/lab-management/orders?${params.toString()}`)
      const data = await res.json()

      return data
    }),

  getOrders: t
    .input(
      z.object({
        status: LabServiceRequestStatusSchema.optional(),
        priority: LabPrioritySchema.optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        category: AncillaryOrderCategorySchema.optional()
      })
    )
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.status) params.append('status', input.status)
      if (input.priority) params.append('priority', input.priority)
      if (input.fromDate) params.append('fromDate', input.fromDate)
      if (input.toDate) params.append('toDate', input.toDate)
      if (input.category) params.append('category', input.category)

      const res = await client.get(`/api/module/lab-management/orders?${params.toString()}`)
      const data = await res.json()

      return data
    }),

  // Get Complete Order
  getCompleteOrder: t
    .input(z.object({ id: z.string().uuid() }))
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const res = await client.get(`/api/module/lab-management/order/${input.id}`)
      return await res.json()
    }),

  // Specimen
  collectSpecimen: t
    .input(CollectSpecimenSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const res = await client.post('/api/module/lab-management/specimen', input)
      return await res.json()
    }),

  // Results
  recordResult: t
    .input(RecordLabResultSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const res = await client.post('/api/module/lab-management/result', input)
      return await res.json()
    }),

  recordRadiologyResult: t
    .input(RecordRadiologyResultSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const res = await client.post('/api/module/lab-management/result/radiology', input)

      const data = await res.json()
      console.log('data', data)
      return data
    }),

  uploadRadiologyDicom: t
    .input(UploadRadiologyDicomSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const formData = new FormData()

      formData.append('patientId', input.patientId)
      formData.append('encounterId', input.encounterId)
      formData.append('uploadedBy', input.uploadedBy)
      formData.append('source', input.source)

      for (let i = 0; i < input.files.length; i++) {
        const base64File = input.files[i]
        const match = base64File.match(/^data:(.*);base64,(.*)$/)
        const cleanBase64 = match ? match[2] : base64File
        const mimeType = match ? match[1] : 'application/dicom'

        // Convert Base64 back to Blob for FormData
        const byteCharacters = atob(cleanBase64)
        const byteNumbers = new Array(byteCharacters.length)

        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j)
        }

        const byteArray = new Uint8Array(byteNumbers)

        const fileBlob = new Blob([byteArray], { type: mimeType })
        formData.append('files', fileBlob, `dicom-image-${i}.dcm`)
      }

      const res = await client.createWithUpload('/api/module/imaging/upload', formData)
      return await res.json()
    }),

  getReport: t
    .input(z.object({ encounterId: z.string().uuid() }))
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const res = await client.get(`/api/module/lab-management/report/${input.encounterId}`)
      return await res.json()
    }),

  // Terminology
  getServiceRequestCodes: t
    .input(ServiceRequestCodeSearchSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.query) params.append('query', input.query)
      if (input.loincCode) params.append('loincCode', input.loincCode)
      if (input.domain) params.append('domain', input.domain)
      if (input.category) params.append('category', input.category)

      const res = await client.get(
        `/api/module/lab-management/terminology/service-request-codes?${params.toString()}`
      )
      return await res.json()
    }),

  getServiceRequestCategories: t
    .input(ServiceRequestCategorySearchSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }) => {
      const res = await client.get('/api/module/lab-management/terminology/categories')
      return await res.json()
    }),

  getUnits: t
    .input(TerminologyUnitSearchSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.query) params.append('query', input.query)
      if (input.loincCode) params.append('loincCode', input.loincCode)
      if (input.domain) params.append('domain', input.domain)

      const res = await client.get(
        `/api/module/lab-management/terminology/units?${params.toString()}`
      )
      return await res.json()
    }),

  // PACS study search — QIDO-RS proxy
  searchPacsStudies: t
    .input(
      z.object({
        patientId: z.string().optional(),
        patientName: z.string().optional(),
        modality: z.string().optional(),
        studyDate: z.string().optional()
      })
    )
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.patientId) params.append('patientId', input.patientId)
      if (input.patientName) params.append('patientName', input.patientName)
      if (input.modality) params.append('modality', input.modality)
      if (input.studyDate) params.append('studyDate', input.studyDate)
      const res = await client.get(`/api/module/imaging/studies/search?${params.toString()}`)
      return await res.json()
    })
}
