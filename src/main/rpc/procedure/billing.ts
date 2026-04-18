import { ApiResponseSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

const ListInvoicesInputSchema = z.object({
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  patientName: z.string().optional(),
  mrn: z.string().optional(),
  queueNumber: z.string().optional(),
  unitCode: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional()
})

const InvoiceDetailInputSchema = z.object({
  kode: z.string()
})

const SaveAllocationsInputSchema = z.object({
  kode: z.string(),
  allocations: z.array(
    z.object({
      invoiceDetailId: z.number(),
      payorType: z.enum(['bpjs', 'insurance', 'company', 'hospital', 'patient']),
      amount: z.number(),
      mitraId: z.number().optional().nullable(),
      note: z.string().optional().nullable()
    })
  ),
  applyAdminFee: z.boolean().optional(),
  adminFeeAmount: z.number().optional().nullable(),
  adminFeeDescription: z.string().optional().nullable()
})

const AdminFeeAgreementInputSchema = z.object({
  category: z.enum(['asuransi', 'bpjs', 'perusahaan', 'umum']),
  mitraId: z.number().optional().nullable(),
  feeType: z.enum(['percentage', 'fixed']),
  feeValue: z.number(),
  maxAmount: z.number().optional().nullable(),
  discountValue: z.number().optional().nullable(),
  discountType: z.enum(['percentage', 'fixed']).optional().nullable()
})

const AdminFeePreviewInputSchema = z.object({
  payorType: z.string(),
  mitraId: z.number().optional().nullable(),
  invoiceTotal: z.number()
})

export const billingRpc = {
  listInvoices: t
    .input(ListInvoicesInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.status) params.append('status', input.status)
      if (input.dateFrom) params.append('dateFrom', input.dateFrom)
      if (input.dateTo) params.append('dateTo', input.dateTo)
      if (input.search) params.append('search', input.search)
      if (input.patientName) params.append('patientName', input.patientName)
      if (input.mrn) params.append('mrn', input.mrn)
      if (input.queueNumber) params.append('queueNumber', input.queueNumber)
      if (input.unitCode) params.append('unitCode', input.unitCode)
      if (input.page) params.append('page', String(input.page))
      if (input.limit) params.append('limit', String(input.limit))
      console.log('cek params', params)
      const res = await client.get(`/api/module/billing/invoices?${params.toString()}`)
      return await res.json()
    }),

  getInvoiceWithAllocations: t
    .input(InvoiceDetailInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const res = await client.get(`/api/module/billing/invoices/${encodeURIComponent(input.kode)}`)
      return await res.json()
    }),

  saveAllocations: t
    .input(SaveAllocationsInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const { kode, allocations, applyAdminFee, adminFeeAmount, adminFeeDescription } = input
      const res = await client.post(
        `/api/module/billing/invoices/${encodeURIComponent(kode)}/allocations`,
        {
          allocations,
          applyAdminFee,
          adminFeeAmount,
          adminFeeDescription
        }
      )
      return await res.json()
    }),

  getAdminFeePreview: t
    .input(AdminFeePreviewInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      params.append('payorType', input.payorType)
      if (input.mitraId) params.append('mitraId', String(input.mitraId))
      params.append('invoiceTotal', String(input.invoiceTotal))
      const res = await client.get(`/api/module/billing/admin-fee/preview?${params.toString()}`)
      return await res.json()
    }),

  listAdminFeeAgreements: t
    .input(z.object({ includeInactive: z.boolean().optional() }))
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.includeInactive) params.append('includeInactive', 'true')
      const res = await client.get(`/api/module/billing/admin-fee?${params.toString()}`)
      return await res.json()
    }),

  createAdminFeeAgreement: t
    .input(AdminFeeAgreementInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const res = await client.post('/api/module/billing/admin-fee', input)
      return await res.json()
    }),

  updateAdminFeeAgreement: t
    .input(z.object({ id: z.number(), data: AdminFeeAgreementInputSchema }))
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const res = await client.put(`/api/module/billing/admin-fee/${input.id}`, input.data)
      return await res.json()
    })
}
