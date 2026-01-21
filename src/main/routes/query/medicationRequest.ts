import z from 'zod'
import {
  MedicationRequestSchema,
  MedicationRequestWithIdSchema
} from '@main/models/medicationRequest'
import { IpcContext } from '@main/ipc/router'
import { parseBackendResponse, BackendListSchema, getClient } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
  list: {
    args: z.object({
      patientId: z.string().optional(),
      page: z.number().optional(),
      limit: z.number().optional()
    }),
    result: z.object({
      success: z.boolean(),
      data: MedicationRequestWithIdSchema.array().optional(),
      pagination: z
        .object({
          page: z.number(),
          limit: z.number(),
          total: z.number(),
          pages: z.number()
        })
        .optional(),
      error: z.string().optional()
    })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      data: MedicationRequestWithIdSchema.optional(),
      error: z.string().optional()
    })
  },
  create: {
    args: MedicationRequestSchema,
    result: z.object({
      success: z.boolean(),
      data: MedicationRequestWithIdSchema.optional(),
      error: z.string().optional()
    })
  },
  update: {
    args: MedicationRequestWithIdSchema.partial().extend({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      data: MedicationRequestWithIdSchema.optional(),
      error: z.string().optional()
    })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), error: z.string().optional() })
  }
} as const

export const list = async (ctx: IpcContext, args: z.infer<typeof schemas.list.args>) => {
  try {
    const client = getClient(ctx)
    const params = new URLSearchParams()
    if (args.patientId) params.append('patientId', args.patientId)
    if (args.page) params.append('page', String(args.page))
    if (args.limit) params.append('limit', String(args.limit))

    const res = await client.get(`/api/medicationrequest?${params.toString()}`)
    const ListSchema = BackendListSchema(MedicationRequestWithIdSchema)
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
    const res = await client.get(`/api/medicationrequest/read/${args.id}`)
    const ReadSchema = z.object({
      success: z.boolean(),
      result: MedicationRequestWithIdSchema.optional(),
      error: z.any().optional()
    })
    const result = await parseBackendResponse(res, ReadSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.post('/api/medicationrequest', args)
    const CreateSchema = z.object({
      success: z.boolean(),
      result: MedicationRequestWithIdSchema.optional(),
      error: z.any().optional()
    })
    const result = await parseBackendResponse(res, CreateSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  try {
    const client = getClient(ctx)
    const { id, ...data } = args
    const res = await client.put(`/api/medicationrequest/${id}`, data)
    const UpdateSchema = z.object({
      success: z.boolean(),
      result: MedicationRequestWithIdSchema.optional(),
      error: z.any().optional()
    })
    const result = await parseBackendResponse(res, UpdateSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.delete(`/api/medicationrequest/${args.id}`)
    const DeleteSchema = z.object({
      success: z.boolean(),
      error: z.any().optional()
    })
    await parseBackendResponse(res, DeleteSchema)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
