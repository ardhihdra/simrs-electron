import { IpcContext } from '@main/ipc/router'
import { EncounterSchemaWithId } from '@main/models/encounter'
import { BackendListSchema, getClient, parseBackendResponse } from '@main/utils/backendClient'
import { EncounterSchema } from 'simrs-types'
import z from 'zod'

// ---------------------------------------------------------------------------
// Shared sub-schemas
// ---------------------------------------------------------------------------

const SyncLogSchema = z.object({
  internalResourceId: z.string(),
  status: z.string(),
  attemptCount: z.number(),
  lastAttemptAt: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional()
})

const SyncResourceSchema = z
  .object({
    total: z.number(),
    synced: z.number(),
    logSummary: z
      .object({
        success: z.number(),
        failed: z.number(),
        retry: z.number(),
        pending: z.number(),
        lastFailedLog: SyncLogSchema.nullable()
      })
      .nullable()
  })
  .optional()

const SatuSehatSyncStatusSchema = z
  .object({
    encounterSynced: z.boolean().optional(),
    allSynced: z.boolean().optional(),
    encounterLog: SyncLogSchema.nullable().optional(),
    resources: z
      .object({
        observation: SyncResourceSchema,
        condition: SyncResourceSchema,
        procedure: SyncResourceSchema,
        allergyIntolerance: SyncResourceSchema,
        composition: SyncResourceSchema
      })
      .optional()
  })
  .optional()
  .nullable()

const EncounterWithRelationsSchema = EncounterSchemaWithId.extend({
  startTime: z.union([z.date(), z.string()]).optional().nullable(),
  endTime: z.union([z.date(), z.string()]).optional().nullable(),
  serviceUnitId: z.string().optional().nullable(),
  serviceUnitCodeId: z.string().optional().nullable(),
  serviceUnit: z.any().optional().nullable(),
  episodeOfCareId: z.string().optional().nullable(),
  encounterType: z.string().optional().nullable(),
  arrivalType: z.string().optional().nullable(),
  queueTicketId: z.string().optional().nullable(),
  partOfId: z.string().optional().nullable(),
  dischargeDisposition: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  patient: z
    .object({
      id: z.union([z.string(), z.number()]),
      kode: z.string().optional(),
      name: z.string().optional().nullable(),
      medicalRecordNumber: z.string().optional().nullable(),
      gender: z.string().optional().nullable(),
      birthDate: z.union([z.string(), z.date()]).optional().nullable(),
      nik: z.string().optional().nullable()
    })
    .optional()
    .nullable(),
  //   serviceUnit: z.object({
  //     id: z.string(),
  //     name: z.string(),
  //     type: z.string().optional()
  //   }),
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
      practitionerId: z.union([z.string(), z.number()]).nullable().optional(),
      poli: z
        .object({
          id: z.number().optional(),
          name: z.string().optional(),
          location: z.string().optional().nullable()
        })
        .nullable()
        .optional(),
      practitioner: z.any().nullable().optional()
    })
    .nullable()
    .optional(),
  labServiceRequests: z.array(z.any()).optional(),
  satuSehatSyncStatus: SatuSehatSyncStatusSchema
})

// ---------------------------------------------------------------------------
// Schemas (IPC contract)
// ---------------------------------------------------------------------------

export const EncounterSchemaPayload = EncounterSchema.extend({
  id: z.string().nullable().optional(),
  createdAt: z.coerce.date().optional(),
  endTime: z.union([z.date().optional().nullable(), z.string().optional().nullable()]),
  updatedAt: z.coerce.date().optional()
})

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      result: z.array(EncounterWithRelationsSchema),
      error: z.string().optional()
    })
  },
  read: {
    args: z.object({ id: z.string() }),
    result: z.object({
      success: z.boolean(),
      result: EncounterWithRelationsSchema.optional().nullable(),
      error: z.string().optional()
    })
  },
  create: {
    // FIX ME: add schema without id in simrs-types
    args: EncounterSchemaPayload,
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
    args: EncounterSchemaWithId.partial().extend({
      id: z.string()
    }),
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
  },
  getPatientTimeline: {
    args: z.object({ patientId: z.string() }),
    result: z.object({
      success: z.boolean(),
      result: z.array(z.any()).optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
  },
  syncSatusehat: {
    args: z.object({ id: z.string() }),
    result: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      encounterId: z.string().optional(),
      error: z.string().optional()
    })
  },
  bulkSyncSatusehat: {
    args: z.any().optional(),
    result: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      count: z.number().optional(),
      error: z.string().optional()
    })
  },
  exportData: {
    args: z.any().optional(),
    result: z.object({
      success: z.boolean(),
      base64Data: z.string().optional(),
      error: z.string().optional()
    })
  },
  getHistorySummary: {
    args: z.object({ patientId: z.string() }),
    result: z.object({
      success: z.boolean(),
      result: z
        .object({
          patient: z.object({
            id: z.string(),
            name: z.string(),
            medicalRecordNumber: z.string().optional().nullable(),
            birthDate: z.string().optional().nullable(),
            gender: z.string().optional().nullable(),
            bloodType: z.string().optional().nullable()
          }),
          alerts: z
            .array(
              z.object({
                type: z.enum(['ALLERGY', 'PROBLEM', 'LAB_ABNORMAL'] as const),
                message: z.string(),
                severity: z.enum(['LOW', 'MEDIUM', 'HIGH'] as const)
              })
            )
            .optional(),
          snapshot: z.object({
            activeProblemsCount: z.number(),
            activeMedicationsCount: z.number(),
            allergiesCount: z.number(),
            lastVisitDate: z.string().nullable().optional(),
            lastLabResult: z.string().nullable().optional(),
            lastUpdated: z.string()
          })
        })
        .optional()
        .nullable(),
      error: z.string().optional().nullable()
    })
  },
  getPatientEncountersPg: {
    args: z.object({
      patientId: z.string(),
      page: z.string().optional(),
      pageSize: z.string().optional(),
      type: z.string().optional(),
      doctorId: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional()
    }),
    result: z.object({
      success: z.boolean(),
      result: z
        .object({
          data: z.array(
            z.object({
              id: z.string(),
              date: z.string(),
              serviceUnit: z.string(),
              doctorName: z.string(),
              type: z.string(),
              primaryDiagnosis: z.string(),
              soapSummary: z.string().optional().nullable(),
              clinicals: z
                .object({
                  compositions: z.array(z.any()),
                  conditions: z.array(z.any()),
                  allergies: z.array(z.any()),
                  medications: z.array(z.any()),
                  procedures: z.array(z.any()),
                  observations: z.array(z.any())
                })
                .optional()
                .nullable()
            })
          ),
          page: z.number(),
          pageSize: z.number(),
          total: z.number()
        })
        .optional()
        .nullable(),
      error: z.string().optional().nullable()
    })
  }
} as const

export const list = async (ctx: IpcContext, args?: Record<string, unknown>) => {
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

    const res = await client.get(`/api/module/encounter?${queryParams.toString()}`)

    const ListSchema = BackendListSchema(EncounterWithRelationsSchema)
    const Result = await parseBackendResponse(res, ListSchema)

    const transformedResult = Array.isArray(Result)
      ? Result.map((encounter: any) => ({
          ...encounter,
          visitDate: encounter.startTime || encounter.visitDate || new Date().toISOString(),
          serviceType: encounter.serviceUnitId || encounter.serviceType || '-',
          status: encounter.status ? String(encounter.status) : 'UNKNOWN'
        }))
      : Result

    return transformedResult ? { success: true, result: transformedResult } : { success: false }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ENCOUNTER LIST] Error:', msg)
    return { success: false, error: msg }
  }
}

export const read = async (ctx: IpcContext, args: z.infer<typeof schemas.read.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.get(`/api/module/encounter/${args.id}`)

    const BackendReadSchema = z.object({
      success: z.boolean(),
      result: EncounterWithRelationsSchema.optional().nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    const parsedResult = (await parseBackendResponse(res, BackendReadSchema)) as any
    if (parsedResult) {
      const transformed = {
        ...parsedResult,
        visitDate: parsedResult.startTime || parsedResult.visitDate,
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
        status: z.string()
      })
        .optional()
        .nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    const parsedResult = (await parseBackendResponse(res, BackendCreateSchema)) as any

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
    const payload: Record<string, unknown> = {}

    if (args.patientId !== undefined) {
      payload.patientId = args.patientId
      payload.subject = { reference: `Patient/${args.patientId}` }
    }

    if (args.visitDate !== undefined) {
      const visitDate =
        args.visitDate instanceof Date ? args.visitDate : new Date(String(args.visitDate))
      payload.visitDate = visitDate
      payload.period = args.period ?? {
        start: visitDate.toISOString()
      }
    } else if (args.period !== undefined) {
      payload.period = args.period
    }

    if (args.serviceType !== undefined) payload.serviceType = String(args.serviceType)
    if (args.reason !== undefined) payload.reason = args.reason ?? null
    if (args.note !== undefined) payload.note = args.note ?? null
    if (args.status !== undefined) payload.status = String(args.status)
    if (args.startTime !== undefined) payload.startTime = args.startTime
    if (args.endTime !== undefined) payload.endTime = args.endTime
    if (args.encounterType !== undefined) payload.encounterType = args.encounterType
    if (args.arrivalType !== undefined) payload.arrivalType = args.arrivalType
    if (args.serviceUnitId !== undefined) payload.serviceUnitId = args.serviceUnitId
    if (args.serviceUnitCodeId !== undefined) payload.serviceUnitCodeId = args.serviceUnitCodeId
    if (args.queueTicketId !== undefined) payload.queueTicketId = args.queueTicketId
    if (args.partOfId !== undefined) payload.partOfId = args.partOfId
    if (args.dischargeDisposition !== undefined) {
      payload.dischargeDisposition = args.dischargeDisposition
    }
    if (args.updatedBy !== undefined) payload.updatedBy = args.updatedBy ?? null

    const res = await client.put(`/api/encounter/${args.id}`, payload)

    const BackendUpdateSchema = z.object({
      success: z.boolean(),
      result: EncounterSchemaWithId.extend({
        startTime: z.union([z.date(), z.string()]).optional().nullable(),
        serviceUnitId: z.string().optional().nullable(),
        status: z.string()
      })
        .optional()
        .nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    const parsedResult = (await parseBackendResponse(res, BackendUpdateSchema)) as any

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

export const syncSatusehat = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.syncSatusehat.args>
) => {
  try {
    const client = getClient(ctx)
    const res = await client.post(`/api/module/encounter/${args.id}/sync`, {})

    const SyncSchema = z.object({
      success: z.boolean(),
      message: z.string().optional(),
      encounterId: z.string().optional()
    })

    const parsedResult = (await parseBackendResponse(res, SyncSchema)) as any
    return { success: true, ...parsedResult }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ENCOUNTER SYNC] Error:', msg)
    return { success: false, error: msg }
  }
}

export const bulkSyncSatusehat = async (ctx: IpcContext) => {
  try {
    const client = getClient(ctx)
    const res = await client.post(`/api/module/encounter/sync`, {})

    const BulkSyncSchema = z.object({
      success: z.boolean(),
      message: z.string().optional(),
      count: z.number().optional()
    })

    const parsedResult = (await parseBackendResponse(res, BulkSyncSchema)) as any
    return { success: true, ...parsedResult }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ENCOUNTER BULK SYNC] Error:', msg)
    return { success: false, error: msg }
  }
}

export const exportData = async (ctx: IpcContext, args?: Record<string, unknown>) => {
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

    // Call the export endpoint
    const response = (await client.get(
      `/api/module/encounter/export?${queryParams.toString()}`
    )) as any
    if (!response.ok) {
      throw new Error(`Gagal memuat dokumen: HTTP ${response.status}`)
    }

    // Extract the raw ArrayBuffer from fetch response
    const arrayBuffer = await response.arrayBuffer()

    // Convert to Base64 to safely transmit over IPC
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    return { success: true, base64Data }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ENCOUNTER EXPORT] Error:', msg)
    return { success: false, error: msg }
  }
}

export const getPatientTimeline = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.getPatientTimeline.args>
) => {
  try {
    const client = getClient(ctx)
    // The backend route is /api/encounter/patient/:patientId/timeline
    const res = await client.get(`/api/encounter/patient/${args.patientId}/timeline`)

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
    console.error('[PATIENT TIMELINE] Error:', msg)
    return { success: false, error: msg }
  }
}

export const getHistorySummary = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.getHistorySummary.args>
) => {
  try {
    const client = getClient(ctx)
    const res = await client.get(`/api/module/encounter/patient/${args.patientId}/history-summary`)

    const schema = z.object({
      success: z.boolean(),
      result: schemas.getHistorySummary.result.shape.result,
      message: z.string().optional(),
      error: z.any().optional()
    })

    const parsedResult = (await parseBackendResponse(res, schema)) as any
    return { success: true, result: parsedResult }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[PATIENT HISTORY SUMMARY] Error:', msg)
    return { success: false, error: msg }
  }
}

export const getPatientEncountersPg = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.getPatientEncountersPg.args>
) => {
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

    const res = await client.get(
      `/api/module/encounter/patient/${args.patientId}/encounters?${queryParams.toString()}`
    )

    const schema = z.object({
      success: z.boolean(),
      result: schemas.getPatientEncountersPg.result.shape.result,
      message: z.string().optional(),
      error: z.any().optional()
    })

    const parsedResult = (await parseBackendResponse(res, schema)) as any
    return { success: true, result: parsedResult }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[PATIENT ENCOUNTERS PG] Error:', msg)
    return { success: false, error: msg }
  }
}
