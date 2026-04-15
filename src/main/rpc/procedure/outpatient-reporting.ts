import { ApiResponseSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

const BASE_URL = '/api/module/outpatient-reporting'

export const outpatientReportingRpc = {
    getDashboardMetrics: t
        .input(z.object({ date: z.string().optional() }))
        .output(ApiResponseSchema(z.any()))
        .query(async ({ client }, input) => {
            const params = new URLSearchParams()
            if (input.date) params.append('date', input.date)
            const data = await client.get(`${BASE_URL}/dashboard-metrics?${params.toString()}`)
            return await data.json()
        }),

    getVisitReport: t
        .input(
            z.object({
                fromDate: z.string(),
                toDate: z.string(),
                poliCodeId: z.coerce.number().optional(),
                practitionerId: z.coerce.number().optional(),
                paymentMethod: z.enum(['cash', 'bpjs', 'asuransi', 'company']).optional(),
            })
        )
        .output(ApiResponseSchema(z.any()))
        .query(async ({ client }, input) => {
            const params = new URLSearchParams()
            params.append('fromDate', input.fromDate)
            params.append('toDate', input.toDate)
            if (input.poliCodeId) params.append('poliCodeId', String(input.poliCodeId))
            if (input.practitionerId) params.append('practitionerId', String(input.practitionerId))
            if (input.paymentMethod) params.append('paymentMethod', input.paymentMethod)
            const data = await client.get(`${BASE_URL}/visit-report?${params.toString()}`)
            return await data.json()
        }),
}
