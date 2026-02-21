import { IpcContext } from '@main/ipc/router'
import { EncounterSchemaWithId } from '@main/models/encounter'
import { BackendListSchema, getClient, parseBackendResponse } from '@main/utils/backendClient'
import { EncounterSchema } from 'simrs-types'
import z from 'zod'

export const schemas = {
  list: {
    args: z.object({
      patientId: z.string().optional(),
      status: z.string().optional(),
      encounterType: z.string().optional(),
      id: z.string().optional(),
      filter: z.string().optional(),
      equal: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      depth: z.number().optional()
    }),
    result: z.object({
      success: z.boolean(),
      result: z
        .array(
          z
            .object({
              id: z.string(),
              encounterCode: z.string().optional(),
              patient: z
                .object({
                  id: z.union([z.string(), z.number()]),
                  name: z.string().optional(),
                  medicalRecordNumber: z.string().optional(),
                  gender: z.string().optional(),
                  birthDate: z.union([z.string(), z.date()]).optional(),
                  kode: z.string().optional(),
                  nik: z.string().optional()
                })
                .optional()
            })
            .passthrough()
        )
        .optional(),
      data: z
        .array(
          z
            .object({
              id: z.string(),
              encounterCode: z.string().optional(),
              patient: z
                .object({
                  id: z.union([z.string(), z.number()]),
                  name: z.string().optional(),
                  medicalRecordNumber: z.string().optional(),
                  gender: z.string().optional(),
                  birthDate: z.union([z.string(), z.date()]).optional(),
                  kode: z.string().optional(),
                  nik: z.string().optional()
                })
                .optional()
            })
            .passthrough()
        )
        .optional(),
      error: z.string().optional()
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

    const queryString = queryParams.toString()
    const url = `/api/encounter?${queryString}`
    console.log('[ipc:encounter.list] GET', url)
    const res = await client.get(url)

    // Extend the base schema to include the joined 'patient' relation
    const EncounterWithPatientSchema = z.any()
    const ListSchema = BackendListSchema(EncounterWithPatientSchema)

    const result = await parseBackendResponse(res, ListSchema)
    const count = Array.isArray(result) ? result.length : 0
    console.log('[ipc:encounter.list] result_count', count)
    if (Array.isArray(result) && result.length > 0) {
      const safe = result as Array<{
        id?: string
        patient?: { id?: string | number }
        patientId?: string | number
        startTime?: string | Date | null
        visitDate?: string | Date | null
        period?: { start?: string | Date | null } | null
      }>
      const sampleIds = safe.slice(0, 5).map((e) => e.id ?? null)
      const samplePatientIds = safe
        .slice(0, 5)
        .map((e) => e.patient?.id ?? e.patientId ?? null)
      const sampleTimes = safe.slice(0, 5).map((e) => {
        const raw = e.startTime ?? e.period?.start ?? e.visitDate ?? null
        return raw ? String(raw) : null
      })
      console.log('[ipc:encounter.list] sample_ids', sampleIds)
      console.log('[ipc:encounter.list] sample_patient_ids', samplePatientIds)
      console.log('[ipc:encounter.list] sample_times', sampleTimes)
    }
    if (count === 0 && args?.patientId) {
      const fallbackParams = new URLSearchParams()
      fallbackParams.append('patientId', args.patientId)
      if (args.depth) fallbackParams.append('depth', String(args.depth))
      const fallbackUrl = `/api/module/encounter?${fallbackParams.toString()}`
      console.log('[ipc:encounter.list] fallback GET', fallbackUrl)
      const res2 = await client.get(fallbackUrl)
      const fallbackResult = await parseBackendResponse(res2, ListSchema)
      const count2 = Array.isArray(fallbackResult) ? fallbackResult.length : 0
      console.log('[ipc:encounter.list] fallback_result_count', count2)
      if (count2 > 0) {
        console.log('[ipc:encounter.list] returning success:true (fallback)')
        return { success: true, result: fallbackResult, data: fallbackResult }
      }
    }
    console.log('[ipc:encounter.list] returning success:true')
    return { success: true, result, data: result }
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
