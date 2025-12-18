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

export const DiagnosticReportSchema = z.object({
  identifier: z.string().nullable().optional(),
  basedOn: z
    .array(z.union([z.number(), z.string()]))
    .nullable()
    .optional(),
  status: z.nativeEnum(DiagnosticReportStatus),
  category: z.array(z.string()).nullable().optional(),
  code: z.string(),
  subjectId: z.union([z.number(), z.string()]),
  encounterId: z.union([z.number(), z.string()]).nullable().optional(),
  effectiveDateTime: z.union([z.date(), z.string()]).nullable().optional(),
  effectivePeriodStart: z.union([z.date(), z.string()]).nullable().optional(),
  effectivePeriodEnd: z.union([z.date(), z.string()]).nullable().optional(),
  issued: z.union([z.date(), z.string()]).nullable().optional(),
  performer: z
    .array(z.union([z.number(), z.string()]))
    .nullable()
    .optional(),
  performerType: z.string().nullable().optional(),
  resultsInterpreter: z
    .array(z.union([z.number(), z.string()]))
    .nullable()
    .optional(),
  resultsInterpreterType: z.string().nullable().optional(),
  specimenId: z
    .array(z.union([z.number(), z.string()]))
    .nullable()
    .optional(),
  result: z
    .array(z.union([z.number(), z.string()]))
    .nullable()
    .optional(),
  imagingStudy: z
    .array(z.union([z.number(), z.string()]))
    .nullable()
    .optional(),
  media: z
    .array(
      z.object({
        comment: z.string().optional(),
        linkId: z.union([z.number(), z.string()])
      })
    )
    .nullable()
    .optional(),
  conclusion: z.string().nullable().optional(),
  conclusionCode: z.array(z.string()).nullable().optional(),
  presentedForm: z.array(z.string()).nullable().optional()
})

export const DiagnosticReportSchemaWithId = DiagnosticReportSchema.extend({
  id: z.number(),
  createdAt: z.union([z.date(), z.string()]).optional().nullable(),
  updatedAt: z.union([z.date(), z.string()]).optional().nullable()
})

export type DiagnosticReportAttributes = z.infer<typeof DiagnosticReportSchemaWithId>
export type DiagnosticReportCreationAttributes = z.infer<typeof DiagnosticReportSchema>
