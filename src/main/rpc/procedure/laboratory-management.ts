import { ApiResponseSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

// --- Enums / Types ---
const LabPrioritySchema = z.enum(['ROUTINE', 'URGENT', 'STAT'])
const LabServiceRequestStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
  'REVOKED',
  'ENTERED_IN_ERROR'
])

// --- Schemas ---

// Create Order
const CreateLabOrderItemSchema = z.object({
  testCodeId: z.string(),
  priority: LabPrioritySchema
})

export const CreateLabOrderSchema = z.object({
  encounterId: z.string().uuid(),
  patientId: z.string().uuid(),
  items: z.array(CreateLabOrderItemSchema),
  requesterPractitionerId: z.string().uuid().optional(),
  requesterOrganizationId: z.string().uuid().optional()
})

// Collect Specimen
export const CollectSpecimenSchema = z.object({
  serviceRequestId: z.union([z.string(), z.number()]).transform((value) => String(value)),
  typeCodeId: z.string().uuid()
})

// Record Result
const RecordLabResultObservationSchema = z.object({
  observationCodeId: z.string().min(1),
  value: z.string(),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  interpretation: z.enum(['NORMAL', 'HIGH', 'LOW', 'CRITICAL']).optional(),
  observedAt: z.string().optional() // Date string
})

export const RecordLabResultSchema = z.object({
  serviceRequestId: z.union([z.string(), z.number()]).transform((value) => String(value)),
  encounterId: z.string().uuid(),
  patientId: z.string().uuid(),
  observations: z.array(RecordLabResultObservationSchema)
})

export const RecordRadiologyResultSchema = z.object({
  serviceRequestId: z.union([z.string(), z.number()]).transform((value) => String(value)),
  encounterId: z.string().uuid(),
  patientId: z.string().uuid(),
  modalityCode: z.string(),
  findings: z.string(),
  studyInstanceUid: z.string().optional(),
  started: z.string().optional() // Date string
})

export const UploadRadiologyDicomSchema = z.object({
  patientId: z.string().uuid(),
  encounterId: z.string().uuid(),
  uploadedBy: z.string(),
  source: z.string(),
  files: z.array(z.string()) // Base64 dataURIs
})

// Terminology Search
export const LabTerminologySearchSchema = z.object({
  query: z.string().optional(),
  domain: z.enum(['laboratory', 'radiology']).optional(),
  category: z.string().optional(),
  limit: z.number().optional()
})

// --- RPC ---

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
        toDate: z.string().optional()
      })
    )
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.status) params.append('status', input.status)
      if (input.priority) params.append('priority', input.priority)
      if (input.fromDate) params.append('fromDate', input.fromDate)
      if (input.toDate) params.append('toDate', input.toDate)

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
        toDate: z.string().optional()
      })
    )
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.status) params.append('status', input.status)
      if (input.priority) params.append('priority', input.priority)
      if (input.fromDate) params.append('fromDate', input.fromDate)
      if (input.toDate) params.append('toDate', input.toDate)

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
  searchTerminology: t
    .input(LabTerminologySearchSchema)
    .output(z.any())
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.query) params.append('query', input.query)
      if (input.domain) params.append('domain', input.domain)
      if (input.category) params.append('category', input.category)
      if (input.limit) params.append('limit', String(input.limit))

      const res = await client.get(`/api/module/lab-management/terminology?${params.toString()}`)
      console.log(res)
      return await res.json()
    }),

  getTerminologyCategories: t
    .input(z.void())
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }) => {
      const res = await client.get('/api/module/lab-management/terminology/categories')
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
