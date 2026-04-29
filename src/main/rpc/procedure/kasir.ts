import {
    ApiResponseSchema,
} from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

const InvoiceInputSchemaLocal = z.object({
    encounterId: z.string(),
    patientId: z.string(),
    kelas: z.string().optional(),
})

const ConfirmInvoiceInputSchemaLocal = z.object({
    encounterId: z.string(),
    patientId: z.string(),
    kelas: z.string().optional(),
})

const GetInvoiceDetailInputSchemaLocal = z.object({
    encounterId: z.string(),
})

const RecordPaymentInputSchemaLocal = z.object({
    invoiceId: z.union([z.number(), z.string()]).optional(),
    encounterId: z.string().optional(),
    patientId: z.string().optional(),
    amount: z.number(),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'OTHER']),
    bankId: z.number().optional(),
    ref: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    category: z.enum(['SETTLEMENT', 'INITIAL_DEPOSIT', 'SUBSEQUENT_DEPOSIT']).optional(),
    file: z.any().optional(),
    filename: z.string().optional(),
    mimetype: z.string().optional(),
})

export const kasirRpc = {
    getInvoice: t
        .input(InvoiceInputSchemaLocal)
        .output(ApiResponseSchema(z.any()))
        .query(async ({ client }, input) => {
            const params = new URLSearchParams({ patientId: input.patientId })
            if (input.kelas) params.append('kelas', input.kelas)
            const res = await client.get(`/api/module/kasir/invoice/${input.encounterId}?${params.toString()}`)
            return await res.json()
        }),

    confirmInvoice: t
        .input(ConfirmInvoiceInputSchemaLocal)
        .output(ApiResponseSchema(z.any()))
        .mutation(async ({ client }, input) => {
            const res = await client.post(`/api/module/kasir/invoice/${input.encounterId}/confirm`, {
                patientId: input.patientId,
                kelas: input.kelas,
            })
            return await res.json()
        }),

    getInvoiceDetail: t
        .input(GetInvoiceDetailInputSchemaLocal)
        .output(ApiResponseSchema(z.any()))
        .query(async ({ client }, input) => {
            const res = await client.get(`/api/module/kasir/invoice/${input.encounterId}/detail`)
            return await res.json()
        }),

    recordPayment: t
        .input(RecordPaymentInputSchemaLocal)
        .output(ApiResponseSchema(z.any()))
        .mutation(async ({ client }, input) => {
            const formData = new FormData()
            const { file, filename, mimetype, ...restInput } = input
            formData.append('jsonPayload', JSON.stringify(restInput))
            if (file && filename) {
                const fileBlob = new Blob([file as ArrayBuffer], {
                    type: mimetype ?? 'application/octet-stream',
                })
                formData.append('attachment', fileBlob, filename)
            }
            const params = new URLSearchParams()
            if (input.encounterId) params.append('encounterId', input.encounterId)
            if (input.patientId) params.append('patientId', input.patientId)

            const res = await client.createWithUpload(
                `/api/module/kasir/invoice/${input.invoiceId || '0'}/payment?${params.toString()}`,
                formData,
            )
            return await res.json()
        }),

    listBanks: t
        .input(z.void())
        .output(ApiResponseSchema(z.any()))
        .query(async ({ client }) => {
            const res = await client.get('/api/module/kasir/banks')
            return await res.json()
        }),
    updateStatus: t
        .input(z.object({ id: z.number(), status: z.string() }))
        .output(ApiResponseSchema(z.any()))
        .mutation(async ({ client }, input) => {
            const res = await client.post('/api/module/kasir/invoice/update-status', input)
            return await res.json()
        }),
}
