import {
    ApiResponseSchema,
    InvoiceInputSchema,
    ConfirmInvoiceInputSchema,
    GetInvoiceDetailInputSchema,
    RecordPaymentInputSchema,
} from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

export const kasirRpc = {
    getInvoice: t
        .input(InvoiceInputSchema)
        .output(ApiResponseSchema(z.any()))
        .query(async ({ client }, input) => {
            const params = new URLSearchParams({ patientId: input.patientId })
            if (input.kelas) params.append('kelas', input.kelas)
            const res = await client.get(`/api/module/kasir/invoice/${input.encounterId}?${params.toString()}`)
            return await res.json()
        }),

    confirmInvoice: t
        .input(ConfirmInvoiceInputSchema)
        .output(ApiResponseSchema(z.any()))
        .mutation(async ({ client }, input) => {
            const res = await client.post(`/api/module/kasir/invoice/${input.encounterId}/confirm`, {
                patientId: input.patientId,
                kelas: input.kelas,
            })
            return await res.json()
        }),

    getInvoiceDetail: t
        .input(GetInvoiceDetailInputSchema)
        .output(ApiResponseSchema(z.any()))
        .query(async ({ client }, input) => {
            const res = await client.get(`/api/module/kasir/invoice/${input.encounterId}/detail`)
            return await res.json()
        }),

    recordPayment: t
        .input(RecordPaymentInputSchema)
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
            const res = await client.createWithUpload(
                `/api/module/kasir/invoice/${input.invoiceId}/payment`,
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
}
