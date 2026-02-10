import { IpcContext } from '@main/ipc/router'
import { EncounterSchemaWithId } from '@main/models/encounter'
import { BackendListSchema, getClient, parseBackendResponse } from '@main/utils/backendClient'
import { EncounterSchema } from 'simrs-types'
import z from 'zod'

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      result: z.array(EncounterSchemaWithId.extend({
        startTime: z.union([z.date(), z.string()]).optional().nullable(),
        endTime: z.union([z.date(), z.string()]).optional().nullable(),
        serviceUnitId: z.string().optional().nullable(),
        serviceUnitCodeId: z.string().optional().nullable(),
        episodeOfCareId: z.string().optional().nullable(),
        encounterType: z.string().optional().nullable(),
        arrivalType: z.string().optional().nullable(),
        queueTicketId: z.string().optional().nullable(),
        partOfId: z.string().optional().nullable(),
        dischargeDisposition: z.string().optional().nullable(),
        status: z.string().optional().nullable(),
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
        queueTicket: z
          .object({
            id: z.string(),
            queueNumber: z.number(),
            queueDate: z.string(),
            status: z.string(),
            serviceUnitCodeId: z.string(),
            poliCodeId: z.number(),
            registrationChannelCodeId: z.string(),
            assuranceCodeId: z.string(),
            practitionerId: z.string().nullable(),
            poli: z
              .object({
                id: z.number(),
                name: z.string(),
                location: z.string()
              })
              .nullable(),
            practitioner: z.any().nullable()
          })
          .nullable(),
        labServiceRequests: z.array(z.any()).optional()
      })),
      error: z.string().optional()
    })
  },
  read: {
    args: z.object({ id: z.string() }),
    result: z.object({
      success: z.boolean(),
      result: EncounterSchemaWithId.extend({
        startTime: z.union([z.date(), z.string()]).optional().nullable(),
        endTime: z.union([z.date(), z.string()]).optional().nullable(),
        serviceUnitId: z.string().optional().nullable(),
        status: z.string().optional().nullable(),
        patient: z.object({
          id: z.union([z.string(), z.number()]),
          name: z.string().optional().nullable(),
          medicalRecordNumber: z.string().optional().nullable(),
          gender: z.string().optional().nullable(),
          birthDate: z.union([z.string(), z.date()]).optional().nullable(),
          nik: z.string().optional().nullable()
        }).optional().nullable()
      }).optional().nullable(),
      error: z.string().optional()
    })
  },
  create: {
    args: EncounterSchema,
    result: z.object({
      success: z.boolean(),
      data: EncounterSchemaWithId.extend({
        startTime: z.union([z.date(), z.string()]).optional().nullable(),
        endTime: z.union([z.date(), z.string()]).optional().nullable(),
        serviceUnitId: z.string().optional().nullable(),
        status: z.string().optional().nullable()
      }).optional(),
      error: z.string().optional()
    })
  },
  update: {
    args: EncounterSchemaWithId,
    result: z.object({
      success: z.boolean(),
      data: EncounterSchemaWithId.extend({
        startTime: z.union([z.date(), z.string()]).optional().nullable(),
        endTime: z.union([z.date(), z.string()]).optional().nullable(),
        serviceUnitId: z.string().optional().nullable(),
        status: z.string().optional().nullable()
      }).optional(),
      error: z.string().optional()
    })
  },
  deleteById: {
    args: z.object({ id: z.string() }),
    result: z.object({ success: z.boolean(), error: z.string().optional().nullable() })
  },
  getTimeline: {
    args: z.object({ encounterId: z.string() }),
    result: z.object({
      success: z.boolean(),
      result: z.array(z.any()).optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
  }
} as const

export const list = async (ctx: IpcContext, args?: z.infer<typeof schemas.list.args>) => {
  try {
    const client = getClient(ctx)

    const queryParams = new URLSearchParams()
    if (args) {
      Object.entries(args).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    if (!queryParams.has('items')) queryParams.set('items', '100')
    if (!queryParams.has('depth')) queryParams.set('depth', '1')

    const res = await client.get(`/api/encounter?${queryParams.toString()}`)

    // Extend the base schema to include the joined 'patient' relation
    const EncounterWithPatientSchema = EncounterSchemaWithId.extend({
      startTime: z.union([z.date(), z.string()]).optional().nullable(),
      endTime: z.union([z.date(), z.string()]).optional().nullable(),
      serviceUnitId: z.string().optional().nullable(),
      serviceUnitCodeId: z.string().optional().nullable(),
      episodeOfCareId: z.string().optional().nullable(),
      encounterType: z.string().optional().nullable(),
      arrivalType: z.string().optional().nullable(),
      queueTicketId: z.string().optional().nullable(),
      partOfId: z.string().optional().nullable(),
      dischargeDisposition: z.string().optional().nullable(),
      status: z.string(),
      patient: z.object({
        id: z.union([z.string(), z.number()]),
        name: z.string().optional().nullable(),
        medicalRecordNumber: z.string().optional().nullable(),
        gender: z.string().optional().nullable(),
        birthDate: z.union([z.string(), z.date()]).optional().nullable(),
        nik: z.string().optional().nullable()
      }).optional().nullable(),
      queueTicket: z
        .object({
          id: z.string(),
          queueNumber: z.number(),
          queueDate: z.string(),
          status: z.string(),
          serviceUnitCodeId: z.string(),
          poliCodeId: z.number(),
          registrationChannelCodeId: z.string(),
          assuranceCodeId: z.string(),
          practitionerId: z.string().nullable(),
          poli: z
            .object({
              id: z.number(),
              name: z.string(),
              location: z.string()
            })
            .nullable(),
          practitioner: z.any().nullable()
        })
        .nullable(),
      labServiceRequests: z.array(z.any()).optional()
    })

    const ListSchema = BackendListSchema(EncounterWithPatientSchema)
    const Result = await parseBackendResponse(res, ListSchema)

    const transformedResult = Array.isArray(Result)
      ? Result.map((encounter: any) => ({
        ...encounter,
        visitDate: encounter.startTime || encounter.visitDate || new Date().toISOString(),
        serviceType: encounter.serviceUnitId || encounter.serviceType || '-',
        status: encounter.status ? String(encounter.status) : 'UNKNOWN'
      }))
      : Result

    return { success: true, result: transformedResult }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ENCOUNTER LIST] Error:', msg)
    return { success: false, error: msg }
  }
}

export const read = async (ctx: IpcContext, args: z.infer<typeof schemas.read.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.get(`/api/encounter/${args.id}/read`)

    const BackendReadSchema = z.object({
      success: z.boolean(),
      result: EncounterSchemaWithId.extend({
        startTime: z.union([z.date(), z.string()]).optional().nullable(),
        endTime: z.union([z.date(), z.string()]).optional().nullable(),
        serviceUnitId: z.string().optional().nullable(),
        serviceUnitCodeId: z.string().optional().nullable(),
        episodeOfCareId: z.string().optional().nullable(),
        encounterType: z.string().optional().nullable(),
        arrivalType: z.string().optional().nullable(),
        queueTicketId: z.string().optional().nullable(),
        partOfId: z.string().optional().nullable(),
        dischargeDisposition: z.string().optional().nullable(),
        status: z.string().optional().nullable(),
        patient: z.object({
          id: z.union([z.string(), z.number()]),
          name: z.string().optional().nullable(),
          medicalRecordNumber: z.string().optional().nullable(),
          gender: z.string().optional().nullable(),
          birthDate: z.union([z.string(), z.date()]).optional().nullable(),
          nik: z.string().optional().nullable()
        }).optional().nullable(),
        queueTicket: z
          .object({
            id: z.string().optional(),
            queueNumber: z.number().optional(),
            queueDate: z.string().optional(),
            status: z.string().optional(),
            serviceUnitCodeId: z.string().optional(),
            poliCodeId: z.number().optional(),
            registrationChannelCodeId: z.string().optional(),
            assuranceCodeId: z.string().optional(),
            practitionerId: z.string().nullable().optional(),
            poli: z
              .object({
                id: z.number().optional(),
                name: z.string().optional(),
                location: z.string().optional()
              })
              .nullable()
              .optional(),
            practitioner: z.any().nullable().optional()
          })
          .nullable()
          .optional(),
        labServiceRequests: z.array(z.any()).optional()
      })
        .optional()
        .nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    const parsedResult = await parseBackendResponse(res, BackendReadSchema) as any
    if (parsedResult) {
      const transformed = {
        ...parsedResult,
        visitDate: parsedResult.startTime || parsedResult.visitDate || new Date().toISOString(),
        serviceType: parsedResult.serviceUnitId || parsedResult.serviceType || '-',
        status: parsedResult.status ? String(parsedResult.status) : 'UNKNOWN'
      }

      return { success: true, result: transformed }
    }

    return { success: true, result: undefined }
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
      result: EncounterSchemaWithId.extend({
        startTime: z.union([z.date(), z.string()]).optional().nullable(),
        serviceUnitId: z.string().optional().nullable(),
        status: z.string(),
      }).optional().nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    const parsedResult = await parseBackendResponse(res, BackendCreateSchema) as any

    // Transform the result if it exists
    if (parsedResult) {
      const transformed = {
        ...parsedResult,
        visitDate: parsedResult.startTime || parsedResult.visitDate || new Date().toISOString(),
        serviceType: parsedResult.serviceUnitId || parsedResult.serviceType || '-',
        status: parsedResult.status ? String(parsedResult.status) : 'UNKNOWN'
      }
      return { success: true, data: transformed }
    }

    return { success: true, data: undefined }
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
      result: EncounterSchemaWithId.extend({
        startTime: z.union([z.date(), z.string()]).optional().nullable(),
        serviceUnitId: z.string().optional().nullable(),
        status: z.string(),
      }).optional().nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    const parsedResult = await parseBackendResponse(res, BackendUpdateSchema) as any

    if (parsedResult) {
      const transformed = {
        ...parsedResult,
        visitDate: parsedResult.startTime || parsedResult.visitDate || new Date().toISOString(),
        serviceType: parsedResult.serviceUnitId || parsedResult.serviceType || '-',
        status: parsedResult.status ? String(parsedResult.status) : 'UNKNOWN'
      }
      return { success: true, data: transformed }
    }

    return { success: true, data: undefined }
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

export const getTimeline = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.getTimeline.args>
) => {
  try {
    const client = getClient(ctx)
    const res = await client.get(`/api/encounter/${args.encounterId}/timeline`)

    const TimelineSchema = z.object({
      success: z.boolean(),
      result: z.array(z.any()).optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })

    const parsedResult = await parseBackendResponse(res, TimelineSchema)
    return { success: true, result: parsedResult }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ENCOUNTER TIMELINE] Error:', msg)
    return { success: false, error: msg, result: [] }
  }
}
