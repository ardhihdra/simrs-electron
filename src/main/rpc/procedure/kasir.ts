import { ApiResponseSchema, InvoiceInputSchema } from 'simrs-types'
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
        })
}
