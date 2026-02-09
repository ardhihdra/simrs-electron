import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'
import z from 'zod'

export const schemas = {
  createAmbulatory: {
    args: z.any(), // We can be stricter if we have the schemas available, but for now z.any() to avoid type issues if imports fail
    result: z.object({
      success: z.boolean(),
      data: z.any().optional(),
      message: z.string().optional(),
      error: z.any().optional()
    })
  },
  createLaboratory: {
    args: z.any(),
    result: z.object({
      success: z.boolean(),
      data: z.any().optional(),
      message: z.string().optional(),
      error: z.any().optional()
    })
  }
}

export async function createAmbulatory(ctx: IpcContext, payload: any) {
  try {
    const client = getClient(ctx)
    console.log('[ipc:encounter.createAmbulatory] POST /module/encounter/ambulatory')
    const res = await client.post('/api/module/encounter/ambulatory', payload)
    const json = await res.json()
    return {
      success: json.success,
      data: json,
      error: json.error || json.message
    }
  } catch (err: any) {
    console.error('[ipc:encounter.createAmbulatory] error:', err.message)
    return { success: false, error: err.message }
  }
}

export async function createLaboratory(ctx: IpcContext, payload: any) {
  try {
    const client = getClient(ctx)
    console.log('[ipc:encounter.createLaboratory] POST /module/laboratory/encounter')
    const res = await client.post('/api/module/laboratory/encounter', payload)
    const json = await res.json()
    return {
      success: json.success,
      data: json,
      error: json.error || json.message
    }
  } catch (err: any) {
    console.error('[ipc:encounter.createLaboratory] error:', err.message)
    return { success: false, error: err.message }
  }
}
