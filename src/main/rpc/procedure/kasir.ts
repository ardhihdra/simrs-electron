/**
 * purpose: RPC procedure kasir untuk invoice, detail invoice, konfirmasi, dan pencatatan pembayaran dengan upload lampiran.
 * main callers: Renderer hooks/queries pada modul kasir.
 * key dependencies: `simrs-types` schema RPC kasir, `zod`, dan transport `client` dari RPC context.
 * main/public functions: `kasirRpc` (`getInvoice`, `confirmInvoice`, `getInvoiceDetail`, `recordPayment`, `listBanks`).
 * side effects: HTTP request ke backend kasir; `recordPayment` membentuk `FormData` dan upload file.
 */
import {
    ApiResponseSchema,
    RecordPaymentInputSchema,
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
                `/api/module/kasir/invoice/${input.invoiceId || '0'}/payment`,
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
