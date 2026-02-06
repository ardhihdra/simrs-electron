import z from 'zod'
import { EncounterSchema, EncounterSchemaWithId } from '@main/models/encounter'
import { IpcContext } from '@main/ipc/router'
import {
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
    args: z.object({ id: z.string() }),
    result: z.object({
      success: z.boolean(),
      data: EncounterSchemaWithId.extend({
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
          .optional()
      }).optional(),
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
      queueTicket: z.object({
        id: z.string(),
        queueNumber: z.number(),
        queueDate: z.string(),
        status: z.string(),
        serviceUnitCodeId: z.string().optional().nullable(),
        poliCodeId: z.number().optional().nullable(),
        registrationChannelCodeId: z.string().optional().nullable(),
        assuranceCodeId: z.string().optional().nullable(),
        practitionerId: z.number().optional().nullable(),
        poli: z.object({
          id: z.number(),
          name: z.string(),
          location: z.string().optional().nullable()
        }).optional().nullable(),
        practitioner: z.object({
          id: z.number(),
          namaLengkap: z.string(),
          nik: z.string()
        }).optional().nullable()
      }).optional().nullable(),
      labServiceRequests: z.array(z.any()).optional().nullable()
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

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.get(`/api/encounter/read/${args.id}?depth=1`)

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
        status: z.string(),
        patient: z.object({
          id: z.union([z.string(), z.number()]),
          name: z.string().optional().nullable(),
          medicalRecordNumber: z.string().optional().nullable(),
          gender: z.string().optional().nullable(),
          birthDate: z.union([z.string(), z.date()]).optional().nullable(),
          nik: z.string().optional().nullable()
        }).optional().nullable(),
        queueTicket: z.object({
          id: z.string(),
          queueNumber: z.number(),
          queueDate: z.string(),
          status: z.string(),
          serviceUnitCodeId: z.string().optional().nullable(),
          poliCodeId: z.number().optional().nullable(),
          registrationChannelCodeId: z.string().optional().nullable(),
          assuranceCodeId: z.string().optional().nullable(),
          practitionerId: z.number().optional().nullable(),
          poli: z.object({
            id: z.number(),
            name: z.string(),
            location: z.string().optional().nullable()
          }).optional().nullable(),
          practitioner: z.object({
            id: z.number(),
            namaLengkap: z.string(),
            nik: z.string()
          }).optional().nullable()
        }).optional().nullable(),
        labServiceRequests: z.array(z.any()).optional().nullable()
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
      return { success: true, data: transformed }
    }

    return { success: true, data: undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
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
        // Backend fields
        startTime: z.union([z.date(), z.string()]).optional().nullable(),
        serviceUnitId: z.string().optional().nullable(),
        // Make status accept any string
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
      success: z.boolean(),
    })

    await parseBackendResponse(res, BackendDeleteSchema)
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
