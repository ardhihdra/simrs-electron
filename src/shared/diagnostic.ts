import { DiagnosticReportSchema } from 'simrs-types'
import z from 'zod'

export enum DiagnosticReportStatus {
  REGISTERED = 'registered',
  PARTIAL = 'partial',
  PRELIMINARY = 'preliminary',
  FINAL = 'final',
  AMENDED = 'amended',
  CORRECTED = 'corrected',
  APPENDED = 'appended',
  CANCELLED = 'cancelled',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown'
}


export const DiagnosticReportSchemaWithId = DiagnosticReportSchema.extend({
  id: z.number(),
  createdAt: z.union([z.date(), z.string()]).optional().nullable(),
  updatedAt: z.union([z.date(), z.string()]).optional().nullable()
})

export type DiagnosticReportAttributes = z.infer<typeof DiagnosticReportSchemaWithId>
export type DiagnosticReportCreationAttributes = z.infer<typeof DiagnosticReportSchema>
