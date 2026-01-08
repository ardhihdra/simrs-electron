import { IpcContext } from '@main/ipc/router'
import { PatientSchema, PatientSchemaWithId } from '@main/models/patient'
import {
  BackendListSchema,
  getClient,
  parseBackendResponse
} from '@main/utils/backendClient'
import z from 'zod'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      data: PatientSchemaWithId.array().optional(),
      error: z.string().optional()
    })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      data: PatientSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  create: {
    args: PatientSchema,
    result: z.object({
      success: z.boolean(),
      data: PatientSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  update: {
    args: PatientSchemaWithId,
    result: z.object({
      success: z.boolean(),
      data: PatientSchemaWithId.optional(),
      error: z.string().optional()
    })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), error: z.string().optional() })
  }
} as const

export const list = async (ctx: IpcContext) => {
  try {
    const client = getClient(ctx)
    console.log('[ipc:patient.list] GET /api/patient?items=100')
    const res = await client.get('/api/patient?items=100')

    // Using PatientSchemaWithId for items as existing schema defines it
    const ListSchema = BackendListSchema(PatientSchemaWithId)

    const result = await parseBackendResponse(res, ListSchema)
    console.log('[ipc:patient.list] received=', Array.isArray(result) ? result.length : 0)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ipc:patient.list] exception=', msg)
    return { success: false, error: msg }
  }
}

export const getById = async (_ctx: IpcContext, args: z.infer<typeof schemas.getById.args>) => {
  try {
    const client = getClient(_ctx)
    const res = await client.get(`/api/patient/read/${args.id}`)

    const BackendReadSchema = z.object({
      success: z.boolean(),
      result: PatientSchemaWithId.optional(),
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
    console.log('args :', args)

    const payload = {
      ...args,
      active: args.active ?? true,
    }

    const res = await client.post('/api/patient', payload)

    const BackendCreateSchema = z.object({
      success: z.boolean(),
      result: PatientSchemaWithId.optional().nullable(),
      message: z.string().optional(),
      error: z.any().optional()
    })

    const result = await parseBackendResponse(res, BackendCreateSchema)
    return { success: true, data: result }
  } catch (err) {
    console.log(err)
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const update = async (_ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  try {
    const client = getClient(_ctx)
    const payload = {
      id: crypto.randomUUID(), // Preserving original behavior
      ...args
    }

    const res = await client.put(`/api/patient/${args.id}`, payload)

    const BackendUpdateSchema = z.object({
      success: z.boolean(),
      result: PatientSchemaWithId.optional(),
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
    const res = await client.delete(`/api/patient/${args.id}`)

    const BackendDeleteSchema = z.object({
      success: z.boolean(),
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
