import z from 'zod'
import { MedicationDispenseWithIdSchema } from '@main/models/medicationDispense'
import { IpcContext } from '@main/ipc/router'
import { parseBackendResponse, BackendListSchema, getClient } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
  list: {
    args: z
      .object({
        patientId: z.string().optional(),
        page: z.number().optional(),
        limit: z.number().optional()
      })
      .optional(),
    result: z.object({
      success: z.boolean(),
      data: MedicationDispenseWithIdSchema.array().optional(),
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
  }
} as const

type ListArgs = z.infer<typeof schemas.list.args>

export const list = async (ctx: IpcContext, args?: ListArgs) => {
  try {
    const client = getClient(ctx)
    const params = new URLSearchParams()

    if (args?.patientId) params.append('patientId', args.patientId)
    if (args?.page) params.append('page', String(args.page))
    if (args?.limit) params.append('limit', String(args.limit))

    const queryString = params.toString()
    const url = queryString.length > 0 ? `/api/medicationdispense?${queryString}` : '/api/medicationdispense'

    console.log('MedicationDispense IPC list called with args and url:', {
      args,
      url
    })

    const res = await client.get(url)
    const ListSchema = BackendListSchema(MedicationDispenseWithIdSchema)
    const result = await parseBackendResponse(res, ListSchema)

    console.log('MedicationDispense IPC list backend result length:', Array.isArray(result) ? result.length : null)

    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('MedicationDispense IPC list error:', msg)
    return { success: false, error: msg }
  }
}
