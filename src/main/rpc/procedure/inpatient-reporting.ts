import { z } from 'zod'
import { t } from '../'

const BASE_URL = '/api/module/inpatient-reporting'

const BorLosToiSummarySchema = z.object({
  bor: z.number(),
  alos: z.number().nullable(),
  toi: z.number().nullable(),
  bto: z.number().nullable(),
  totalAdmissions: z.number(),
  discharges: z.number(),
  totalBeds: z.number(),
  occupiedBeds: z.number()
})

const BorLosToiWardRowSchema = z.object({
  wardName: z.string(),
  classLabel: z.string(),
  bor: z.number(),
  alos: z.number().nullable(),
  toi: z.number().nullable(),
  bto: z.number().nullable(),
  occupiedBeds: z.number(),
  totalBeds: z.number(),
  discharges: z.number()
})

const BorLosToiDpjpRowSchema = z.object({
  dpjpName: z.string(),
  patientCount: z.number(),
  averageLos: z.number().nullable(),
  procedureCount: z.number().nullable()
})

const DailyBorTrendRowSchema = z.object({
  date: z.string(),
  dayLabel: z.string(),
  bor: z.number()
})

export const BorLosToiReportSchema = z.object({
  generatedAt: z.string(),
  period: z.object({
    fromDate: z.string(),
    toDate: z.string(),
    dayCount: z.number()
  }),
  summary: BorLosToiSummarySchema,
  wards: z.array(BorLosToiWardRowSchema),
  dpjpRows: z.array(BorLosToiDpjpRowSchema),
  dailyBorTrend: z.array(DailyBorTrendRowSchema),
  notes: z.array(z.string())
})

const BorLosToiReportQuerySchema = z.object({
  fromDate: z.string(),
  toDate: z.string()
})

export type BorLosToiReport = z.infer<typeof BorLosToiReportSchema>
export type BorLosToiReportQuery = z.infer<typeof BorLosToiReportQuerySchema>

export function normalizeBorLosToiReportResponse(payload: unknown) {
  if (payload && typeof payload === 'object' && 'result' in payload) {
    return BorLosToiReportSchema.parse((payload as { result: unknown }).result)
  }

  throw new Error('Invalid inpatient BOR LOS TOI report response')
}

export const inpatientReportingRpc = {
  getBorLosToiReport: t
    .input(BorLosToiReportQuerySchema)
    .output(BorLosToiReportSchema)
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      params.append('fromDate', input.fromDate)
      params.append('toDate', input.toDate)
      const response = await client.get(`${BASE_URL}/bor-los-toi?${params.toString()}`)
      const payload = await response.json()
      return normalizeBorLosToiReportResponse(payload)
    })
}
