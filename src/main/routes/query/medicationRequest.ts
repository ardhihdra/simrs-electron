import z from 'zod'
import {
  MedicationRequestSchema,
  MedicationRequestWithIdSchema
} from '@main/models/medicationRequest'
import { IpcContext } from '@main/ipc/router'
import { parseBackendResponse, getClient, BackendListSchema } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
  list: {
    args: z.object({
      patientId: z.string().optional(),
      encounterId: z.string().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
      items: z.number().optional()
    }),
    result: z.any()
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.any()
  },
  getByEncounterId: {
    args: z.object({ encounterId: z.string() }),
    result: z.any()
  },
  create: {
    args: z.union([MedicationRequestSchema, MedicationRequestSchema.array()]),
    result: z.object({
      success: z.boolean(),
      data: z
        .union([
          z.object({
            id: z.number(),
            status: z.string().optional()
          }),
          z
            .object({
              id: z.number(),
              status: z.string().optional()
            })
            .array()
        ])
        .optional(),
      error: z.string().optional()
    })
  },
  update: {
    args: MedicationRequestWithIdSchema.partial().extend({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      data: z
        .object({
          id: z.number(),
          status: z.string().optional()
        })
        .optional(),
      error: z.string().optional()
    })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.any()
  },
  syncSatusehat: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      error: z.string().optional()
    })
  }
} as const

export const list = async (ctx: IpcContext, args: z.infer<typeof schemas.list.args>) => {
  try {
    const client = getClient(ctx)
    const params = new URLSearchParams()
    if (args.patientId) params.append('patientId', args.patientId)
    if (args.encounterId) params.append('encounterId', args.encounterId)
    if (args.page) params.append('page', String(args.page))
    if (args.items) {
      params.append('items', String(args.items))
    } else if (args.limit) {
      // Map legacy 'limit' to backend 'items'
      params.append('items', String(args.limit))
    }

    const res = await client.get(`/api/module/medication-request/medication-requests?${params.toString()}`)
    const ListSchema = BackendListSchema(MedicationRequestWithIdSchema)
    const result = await parseBackendResponse(res, ListSchema)
    return result ? { success: true, data: result } : { success: false }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const getById = async (ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.get(`/api/module/medication-request/medication-requests/${args.id}`)
    const ReadSchema = z.object({
      success: z.boolean(),
      result: MedicationRequestWithIdSchema.optional(),
      error: z.string().optional()
    })
    const result = await parseBackendResponse(res, ReadSchema)
    return result ? { success: true, data: result } : { success: false }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const getByEncounterId = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounterId.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.get(`/api/module/medication-request/medication-requests/encounter/${args.encounterId}`)
    const ListSchema = z.object({
      success: z.boolean(),
      result: MedicationRequestWithIdSchema.array().optional(),
      error: z.string().optional()
    })
    const result = await parseBackendResponse(res, ListSchema)
    return result ? { success: true, data: result } : { success: false }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.post('/api/module/medication-request/medication-requests', args)
    const BatchSchema = z.object({
      success: z.boolean(),
      result: z.union([
        z.object({ id: z.number(), status: z.string().optional() }),
        z.array(z.object({ id: z.number(), status: z.string().optional() }))
      ]).optional(),
      error: z.string().optional(),
      message: z.string().optional()
    })
    const result = await parseBackendResponse(res, BatchSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('MedicationRequest IPC create error:', msg)
    return { success: false, error: msg }
  }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  try {
    const client = getClient(ctx)
    const { id, ...data } = args
    const res = await client.put(`/api/module/medication-request/medication-requests/${id}`, data)
    const UpdateSchema = z.object({
      success: z.boolean(),
      result: z
        .object({
          id: z.number(),
          status: z.string().optional()
        })
        .optional(),
      error: z.string().optional()
    })
    const result = await parseBackendResponse(res, UpdateSchema)
    return result ? { success: true, data: result } : { success: false }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.delete(`/api/module/medication-request/medication-requests/${args.id}`)
    const DeleteSchema = z.object({
      success: z.boolean(),
      error: z.string().optional()
    })
    await parseBackendResponse(res, DeleteSchema)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const syncSatusehat = async (ctx: IpcContext, args: z.infer<typeof schemas.syncSatusehat.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.post(`/api/module/medication-request/medication-requests/${args.id}/sync-satusehat`, {})
    const raw = await res
      .json()
      .catch(() => ({} as { success?: boolean; message?: string; error?: string }))
    if (!res.ok || raw?.success !== true) {
      const errMsg = (raw as { error?: string; message?: string }).error || (raw as { error?: string; message?: string }).message || `HTTP ${res.status}`
      return { success: false, error: errMsg }
    }
    return { success: true, message: (raw as { message?: string }).message }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
