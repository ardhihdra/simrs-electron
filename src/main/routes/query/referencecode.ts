import { IpcContext } from '@main/ipc/router'
import { getClient, parseBackendResponse } from '@main/utils/backendClient'
import { createCrudRoutes } from '@main/utils/crud'
import z from 'zod'

export const requireSession = true

const crud = createCrudRoutes({
  entity: 'referencecode',
  schema: z.any()
})

const TarifClassOptionSchema = z.object({
  id: z.string().optional(),
  systemUri: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  version: z.string().optional().nullable(),
  isActive: z.boolean().optional().nullable(),
  code: z.string(),
  display: z.string().optional().nullable()
})

export const schemas = {
  tarifClasses: {
    args: z.void().optional(),
    result: z.object({
      success: z.boolean(),
      result: z.array(TarifClassOptionSchema),
      error: z.string().optional()
    })
  }
} as const

export const tarifClasses = async (ctx: IpcContext) => {
  try {
    const client = getClient(ctx)
    const response = await client.get('/api/referencecode/tarif-classes')
    const result =
      (await parseBackendResponse(response, schemas.tarifClasses.result)) ||
      []

    return { success: true, result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const { list, listAll, read, create, update, delete: remove } = crud
