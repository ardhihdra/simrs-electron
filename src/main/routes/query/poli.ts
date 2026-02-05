import { IpcContext } from '@main/ipc/router'
import { PoliSchema, PoliSchemaWithId } from '@main/models/poli'
import { createBackendClient, parseBackendResponse } from '@main/utils/backendClient'
import { createCrudRoutes } from '@main/utils/crud'
import z from 'zod'

const crud = createCrudRoutes({
  entity: 'poli',
  schema: z.any()
})

export const { list, listAll, read, create, update, delete: remove } = crud
export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      result: PoliSchemaWithId.array().optional(),
      message: z.string().optional()
    })
  },
  getById: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      result: PoliSchemaWithId.optional(),
      message: z.string().optional()
    })
  },
  create: {
    args: PoliSchema.partial(),
    result: z.object({
      success: z.boolean(),
      result: PoliSchemaWithId.optional(),
      message: z.string().optional()
    })
  },
  update: {
    args: PoliSchemaWithId,
    result: z.object({
      success: z.boolean(),
      result: PoliSchemaWithId.optional(),
      message: z.string().optional()
    })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), message: z.string().optional() })
  }
} as const

export const deleteById = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.deleteById.args>
) => {
  try {
    const client = createBackendClient(ctx)
    const res = await client.delete(`/api/poli/${args.id}`)
    const DeleteResponseSchema = z.object({
      success: z.boolean(),
      message: z.string().optional(),
      error: z.string().optional()
    })
    await parseBackendResponse(res, DeleteResponseSchema)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'NO_BACKEND_TOKEN') {
      return {
        success: false,
        error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.'
      }
    }
    return { success: false, error: msg }
  }
}
