import z from 'zod'

import { IpcContext } from '@main/ipc/router'
import { DiagnosticReportSchema, DiagnosticReportSchemaWithId } from '@main/models/DiagnosticReport'
import {
  createBackendClient,
  parseBackendResponse,
  BackendListSchema,
  getClient
} from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
  list: {
    args: z.any(),
    result: z.object({
      success: z.boolean(),
      data: DiagnosticReportSchemaWithId.array().optional(),
      error: z.string().optional()
    })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      data: DiagnosticReportSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  create: {
    args: DiagnosticReportSchema,
    result: z.object({
      success: z.boolean(),
      data: DiagnosticReportSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  update: {
    args: DiagnosticReportSchemaWithId,
    result: z.object({
      success: z.boolean(),
      data: DiagnosticReportSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), error: z.string().optional() })
  }
} as const

export const list = async (ctx: IpcContext, _args?: z.infer<typeof schemas.list.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.get('/api/diagnosticreport?items=100&depth=1')

    // Using DiagnosticReportSchemaWithId as requested, though backend alignment is to be debugged later
    const ListSchema = BackendListSchema(DiagnosticReportSchemaWithId)

    const result = await parseBackendResponse(res, ListSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  try {
    const client = getClient(ctx)
    console.log('FETCHING TO:', `/api/diagnosticreport/${args.id}/read`)
    const res = await client.get(`/api/diagnosticreport/${args.id}/read`)

    const BackendReadSchema = z.object({
      success: z.boolean(),
      result: DiagnosticReportSchemaWithId.optional().nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    const result = await parseBackendResponse(res, BackendReadSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  try {
    const client = getClient(ctx)
    const payload = {
      ...args,
      subjectId: String(args.subjectId),
      // Ensure dates are stringified
      effectiveDateTime:
        args.effectiveDateTime instanceof Date
          ? args.effectiveDateTime.toISOString()
          : args.effectiveDateTime,
      effectivePeriodStart:
        args.effectivePeriodStart instanceof Date
          ? args.effectivePeriodStart.toISOString()
          : args.effectivePeriodStart,
      effectivePeriodEnd:
        args.effectivePeriodEnd instanceof Date
          ? args.effectivePeriodEnd.toISOString()
          : args.effectivePeriodEnd,
      issued: args.issued instanceof Date ? args.issued.toISOString() : args.issued
    }

    const res = await client.post('/api/diagnosticreport', payload)

    const BackendCreateSchema = z.object({
      success: z.boolean(),
      result: DiagnosticReportSchemaWithId.optional().nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    const result = await parseBackendResponse(res, BackendCreateSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  try {
    const client = getClient(ctx)

    const payload = {
      ...args,
      subjectId: String(args.subjectId),
      // Ensure dates are stringified
      effectiveDateTime:
        args.effectiveDateTime instanceof Date
          ? args.effectiveDateTime.toISOString()
          : args.effectiveDateTime,
      effectivePeriodStart:
        args.effectivePeriodStart instanceof Date
          ? args.effectivePeriodStart.toISOString()
          : args.effectivePeriodStart,
      effectivePeriodEnd:
        args.effectivePeriodEnd instanceof Date
          ? args.effectivePeriodEnd.toISOString()
          : args.effectivePeriodEnd,
      issued: args.issued instanceof Date ? args.issued.toISOString() : args.issued
    }

    const res = await client.put(`/api/diagnosticreport/${args.id}`, payload)

    const BackendUpdateSchema = z.object({
      success: z.boolean(),
      result: DiagnosticReportSchemaWithId.optional().nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    const result = await parseBackendResponse(res, BackendUpdateSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const deleteById = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.deleteById.args>
) => {
  try {
    const client = getClient(ctx)
    const res = await client.delete(`/api/diagnosticreport/${args.id}`)

    const BackendDeleteSchema = z.object({
      success: z.boolean(),
      result: z.object({}).optional(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    // Note: BackendDeleteSchema is used here.
    // parseBackendResponse might throw if success is false, which is what we want.
    // However, if delete returns empty body or just success, we should handle it.
    // The original code handled catch block for json parsing separately but here parseBackendResponse does it.

    await parseBackendResponse(res, BackendDeleteSchema)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
