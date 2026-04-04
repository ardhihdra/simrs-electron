import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import {
  getClient
} from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
  getByEncounter: {
    args: z.object({
      encounterId: z.string(),
      includeChildrenEncounter: z.boolean().optional()
    }),
    result: z.object({
      success: z.boolean(),
      result: z.array(z.any()).optional(),
      message: z.string().optional(),
      error: z.any().optional()
    }),
  },
  create: {
    args: z.object({
      encounterId: z.string(),
      patientId: z.string(),
      doctorId: z.number().optional(),
      serviceRequests: z.array(z.any())
    }),
    result: z.object({
      success: z.boolean(),
      result: z.array(z.any()).optional(),
      message: z.string().optional(),
      error: z.any().optional()
    }),
  },
  update: {
    args: z.object({
      id: z.number(),
      status: z.string()
    }),
    result: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      error: z.any().optional()
    }),
  }
} as const

export const getByEncounter = async (ctx: IpcContext, args: z.infer<typeof schemas.getByEncounter.args>) => {
  try {
    const client = getClient(ctx)
    // Using standard read route
    const res = await client.get(`/api/servicerequest/read/${args.encounterId}`, {
      includeChildrenEncounter: args.includeChildrenEncounter ? 'true' : 'false'
    })
    const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
    return raw as any
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.post('/api/servicerequest', args)
    const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
    return raw as any
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  try {
    const client = getClient(ctx)
    const { id, status } = args
    // Using standard update route (mapped to controller.update in appApi routerApp)
    const res = await client.patch(`/api/servicerequest/${id}`, { status })
    const raw = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }))
    return raw as any
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
