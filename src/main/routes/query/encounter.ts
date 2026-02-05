import { IpcContext } from '@main/ipc/router'
import { EncounterSchemaWithId } from '@main/models/encounter'
import { BackendListSchema, getClient, parseBackendResponse } from '@main/utils/backendClient'
import { EncounterSchema } from 'simrs-types'
import z from 'zod'

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      data: z
        .array(
          EncounterSchemaWithId.extend({
            patient: z
              .object({
                id: z.string(),
                kode: z.string().optional(),
                name: z.string(),
                medicalRecordNumber: z.string().optional(),
                gender: z.string().optional(),
                birthDate: z.union([z.string(), z.date()]).optional(),
                nik: z.string().optional()
              })
              .optional(),
            queueTicket: z.any().optional()
          })
        )
        .optional(),
      error: z.string().optional()
    }),
    args: z.object({
      filter: z.string().optional(),
      equal: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      depth: z.number().optional()
    })
  },
  read: {
    args: z.object({ id: z.string() }),
    result: z.object({
      success: z.boolean(),
      data: EncounterSchemaWithId.optional(),
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
    args: z.object({ id: z.string() }),
    result: z.object({ success: z.boolean(), error: z.string().optional().nullable() })
  }
} as const

export const list = async (ctx: IpcContext, args?: z.infer<typeof schemas.list.args>) => {
  try {
    const client = getClient(ctx)

    // Convert args to query string
    const queryParams = new URLSearchParams()
    if (args) {
      Object.entries(args).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    // Set default items if not present
    if (!queryParams.has('items')) queryParams.set('items', '100')
    if (!queryParams.has('depth')) queryParams.set('depth', '1')

    const res = await client.get(`/api/encounter?${queryParams.toString()}`)

    // Extend the base schema to include the joined 'patient' relation
    const EncounterWithPatientSchema = z.any()
    const ListSchema = BackendListSchema(EncounterWithPatientSchema)

    const result = await parseBackendResponse(res, ListSchema)
    return { success: true, result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const read = async (ctx: IpcContext, args: z.infer<typeof schemas.read.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.get(`/api/encounter/${args.id}`)

    const BackendReadSchema = z.object({
      success: z.boolean(),
      result: EncounterSchemaWithId.extend({
        patient: z
          .object({
            id: z.union([z.string(), z.number()]),
            name: z.string().optional().nullable(),
            medicalRecordNumber: z.string().optional().nullable(),
            gender: z.string().optional().nullable(),
            birthDate: z.union([z.string(), z.date()]).optional().nullable(),
            nik: z.string().optional().nullable()
          })
          .optional()
          .nullable()
      })
        .optional()
        .nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    const result = await parseBackendResponse(res, BackendReadSchema) // result holds the Encounter object
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const create = async (ctx: IpcContext, args: any) => {
  try {
    const client = getClient(ctx)
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
      result: z.any(),
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
    return { success: true, data: result }
  } catch (err) {
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
      success: z.boolean()
    })

    await parseBackendResponse(res, BackendDeleteSchema)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
