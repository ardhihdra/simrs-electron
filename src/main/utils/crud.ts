import { IpcContext } from '@main/ipc/router'
import {
  BackendListSchema,
  BackendResponse,
  getClient,
  parseBackendResponse
} from '@main/utils/backendClient'
import z from 'zod'

export interface ListOptions {
  page?: number
  items?: number
  q?: string
  sortBy?: string
  sortValue?: number
  filter?: string
  equal?: string | number | boolean
  fields?: string
  startDate?: string
  endDate?: string
  enabled?: boolean
  depth?: number
  include?: string | string[]
  [key: string]: any // allow dynamic filters
}

export interface CrudOptions<T extends z.ZodTypeAny> {
  entity: string
  schema: T
  ids?: { [key: string]: z.ZodTypeAny } // for extra args if needed, currently assumes 'id'
  ignore?: Array<'list' | 'listAll' | 'create' | 'update' | 'delete' | 'read'>
}

export function createCrudRoutes<T extends z.ZodTypeAny>(options: CrudOptions<T>) {
  const { entity, schema } = options
  const listResponseSchema = BackendListSchema(schema)

  // Helper for generic success response
  const successSchema = <ResT extends z.ZodTypeAny>(resSchema: ResT) =>
    z.object({
      success: z.boolean(),
      result: resSchema.optional(),
      message: z.string().optional(),
      error: z.any().optional()
    }) as unknown as z.ZodSchema<BackendResponse<z.infer<T>>>

  return {
    list: async (ctx: IpcContext, args?: ListOptions) => {
      try {
        const client = getClient(ctx)

        // Construct query string
        const params = new URLSearchParams()
        if (args) {
          Object.entries(args).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                value.forEach((v) => params.append(key, String(v)))
              } else {
                params.append(key, String(value))
              }
            }
          })
        }

        // Defaults if not provided
        if (!params.has('items')) params.set('items', '100')
        if (!params.has('page')) params.set('page', '1')

        const queryString = params.toString()
        console.log(`[ipc:${entity}.list] GET /api/${entity}?${queryString}`)

        const res = await client.get(`/api/${entity}?${queryString}`)
        const result = await parseBackendResponse(res, listResponseSchema)

        return { success: true, data: result }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[ipc:${entity}.list] exception=`, msg)
        return { success: false, error: msg }
      }
    },

    listAll: async (ctx: IpcContext, args?: ListOptions) => {
      try {
        const client = getClient(ctx)

        // Construct query string
        const params = new URLSearchParams()
        if (args) {
          Object.entries(args).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                value.forEach((v) => params.append(key, String(v)))
              } else {
                params.append(key, String(value))
              }
            }
          })
        }

        const queryString = params.toString()
        console.log(`[ipc:${entity}.listAll] GET /api/${entity}/listAll?${queryString}`)

        const res = await client.get(`/api/${entity}/listAll?${queryString}`)
        // Usually listAll returns a simpler array or same struct, assuming same struct for now but maybe no pagination
        const result = await parseBackendResponse(res, listResponseSchema)

        return { success: true, data: result }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[ipc:${entity}.listAll] exception=`, msg)
        return { success: false, error: msg }
      }
    },

    read: async (ctx: IpcContext, args: { id: number | string }) => {
      try {
        const client = getClient(ctx)
        console.log(`[ipc:${entity}.read] GET /api/${entity}/read/${args.id}`)

        const res = await client.get(`/api/${entity}/read/${args.id}`)
        const result = await parseBackendResponse(res, successSchema(schema))

        return { success: true, data: result }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[ipc:${entity}.read] exception=`, msg)
        return { success: false, error: msg }
      }
    },

    create: async (ctx: IpcContext, args: z.infer<T>) => {
      try {
        const client = getClient(ctx)
        console.log(`[ipc:${entity}.create] POST /api/${entity}`)

        const res = await client.post(`/api/${entity}`, args)
        const result = await parseBackendResponse(res, successSchema(schema))

        return { success: true, data: result }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[ipc:${entity}.create] exception=`, msg)
        return { success: false, error: msg }
      }
    },

    update: async (ctx: IpcContext, args: z.infer<T> & { id: number | string }) => {
      try {
        const client = getClient(ctx)
        const { id, ...body } = args
        console.log(`[ipc:${entity}.update] PUT /api/${entity}/${id}`)

        const res = await client.put(`/api/${entity}/${id}`, body)
        const result = await parseBackendResponse(res, successSchema(schema))

        return { success: true, data: result }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[ipc:${entity}.update] exception=`, msg)
        return { success: false, error: msg }
      }
    },

    // Using explicit delete method if needed
    delete: async (ctx: IpcContext, args: { id: number | string }) => {
      try {
        const client = getClient(ctx)
        console.log(`[ipc:${entity}.delete] DELETE /api/${entity}/${args.id}`)

        const res = await client.delete(`/api/${entity}/${args.id}`)
        // Often delete returns just success/fail, but using a generic schema to catch standard API wrapper
        const GenericResponseInfo = z.object({
          success: z.boolean(),
          message: z.string().optional(),
          error: z.any().optional()
        }) as z.ZodSchema<BackendResponse<void>>

        const result = await parseBackendResponse(res, GenericResponseInfo)
        return { success: true, data: result }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[ipc:${entity}.delete] exception=`, msg)
        return { success: false, error: msg }
      }
    }
  }
}
