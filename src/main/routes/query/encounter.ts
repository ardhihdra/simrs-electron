import z from 'zod'
import { EncounterSchema, EncounterSchemaWithId } from '@main/models/encounter'
import { IpcContext } from '@main/ipc/router'
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
    result: z.any()
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      data: EncounterSchemaWithId.extend({
        patient: z
          .object({
            id: z.string(),
            kode: z.string().optional(),
            name: z.string()
          })
          .optional()
      }).optional(),
      error: z.string().optional()
    })
  },
  create: {
    args: EncounterSchema,
    result: z.object({
      success: z.boolean(),
      data: EncounterSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  update: {
    args: EncounterSchemaWithId,
    result: z.object({
      success: z.boolean(),
      data: EncounterSchemaWithId.optional(),
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
    const res = await client.get('/api/encounter?items=100&depth=1')

    const ListSchema = BackendListSchema(EncounterSchemaWithId)

    const result = await parseBackendResponse(res, ListSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const getById = async (_ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  try {
    const client = getClient(_ctx)
    const res = await client.get(`/api/encounter/read/${args.id}?depth=1`)

    const BackendReadSchema = z.object({
      success: z.boolean(),
      result: EncounterSchemaWithId.extend({
        patient: z
          .object({ id: z.number(), kode: z.string().optional(), name: z.string() })
          .optional()
      })
        .optional()
        .nullable(),
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

export const create = async (_ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  try {
    const client = getClient(_ctx)
    const payload = {
      patientId: args.patientId,
      visitDate: args.visitDate instanceof Date ? args.visitDate : new Date(String(args.visitDate)),
      serviceType: String(args.serviceType),
      reason: args.reason ?? null,
      note: args.note ?? null,
      status: String(args.status),
      resourceType: 'Encounter',
      period: args.period ?? {
        start:
          args.visitDate instanceof Date
            ? args.visitDate.toISOString()
            : String(args.visitDate) || undefined
      },
      subject: { reference: `Patient/${args.patientId}` },
      createdBy: args.createdBy ?? null
    }

    const res = await client.post('/api/encounter', payload)

    const BackendCreateSchema = z.object({
      success: z.boolean(),
      result: EncounterSchemaWithId.optional().nullable(),
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

export const update = async (_ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  try {
    const client = getClient(_ctx)
    const payload = {
      patientId: args.patientId,
      visitDate: args.visitDate instanceof Date ? args.visitDate : new Date(String(args.visitDate)),
      serviceType: String(args.serviceType),
      reason: args.reason ?? null,
      note: args.note ?? null,
      status: String(args.status),
      period: args.period ?? {
        start:
          args.visitDate instanceof Date
            ? args.visitDate.toISOString()
            : String(args.visitDate) || undefined
      },
      subject: { reference: `Patient/${args.patientId}` },
      updatedBy: args.updatedBy ?? null
    }

    const res = await client.put(`/api/encounter/${args.id}`, payload)

    const BackendUpdateSchema = z.object({
      success: z.boolean(),
      result: EncounterSchemaWithId.optional().nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    const result = await parseBackendResponse(res, BackendUpdateSchema)
    console.log(result)
    return { success: true, data: result }
  } catch (err) {
    console.log(err)
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const deleteById = async (
  _ctx: IpcContext,
  args: z.infer<typeof schemas.deleteById.args>
) => {
  try {
    const client = getClient(_ctx)
    const res = await client.delete(`/api/encounter/${args.id}`)

    const BackendDeleteSchema = z.object({
      success: z.boolean(),
      result: z.object({}).optional(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    await parseBackendResponse(res, BackendDeleteSchema)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
