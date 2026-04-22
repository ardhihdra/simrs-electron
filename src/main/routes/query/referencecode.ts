import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'
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

const TarifClassesBackendSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    result: z.array(TarifClassOptionSchema).optional(),
    data: z.array(TarifClassOptionSchema).optional(),
    message: z.string().optional()
  }),
  z.object({
    success: z.literal(false),
    error: z.any().optional(),
    message: z.string().optional()
  })
])

export const schemas = {
  tarifClasses: {
    args: z.void().optional(),
    result: z.discriminatedUnion('success', [
      z.object({
        success: z.literal(true),
        result: z.array(TarifClassOptionSchema)
      }),
      z.object({
        success: z.literal(false),
        error: z.string().optional(),
        message: z.string().optional(),
        details: z.any().optional()
      })
    ])
  }
} as const

export const tarifClasses = async (ctx: IpcContext) => {
  try {
    const client = getClient(ctx)
    const response = await client.get('/api/referencecode/tarif-classes')
    const raw = await response.json().catch(() => ({ success: false, error: 'Invalid JSON' }))
    const parsed = TarifClassesBackendSchema.safeParse(raw)

    if (!response.ok || !parsed.success || !parsed.data.success) {
      if (parsed.success && !parsed.data.success) {
        throw new Error(parsed.data.error || parsed.data.message || `HTTP ${response.status}`)
      }
      throw new Error(parsed.success ? `HTTP ${response.status}` : parsed.error.message)
    }

    const result = parsed.data.result ?? parsed.data.data ?? []

    return { success: true, result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const { list, listAll, read, create, update, delete: remove } = crud
