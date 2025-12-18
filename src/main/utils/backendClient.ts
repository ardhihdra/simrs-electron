import { IpcContext } from '@main/ipc/router'
import z from 'zod'

// backendClient.ts
/**
 * Creates a backend client for making HTTP requests to the API server.
 * example usage:
 * const backendClient = createBackendClient(ctx)
 * const res = await backendClient.get('/api/patient')
 *
 * @param ctx - The IPC context containing session information and sender ID
 * @returns An object with HTTP methods (get, post, put, delete) for API calls
 * @throws {Error} Throws 'NO_BACKEND_TOKEN' if no authentication token is found
 */
export function createBackendClient(ctx: IpcContext) {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'

  const token = ctx.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) throw new Error('NO_BACKEND_TOKEN')

  const root = base.endsWith('/') ? base.slice(0, -1) : base

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-access-token': token
  }

  return {
    get: (path: string) => fetch(`${root}${path}`, { headers }),

    post: (path: string, body: unknown) =>
      fetch(`${root}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      }),

    put: (path: string, body: unknown) =>
      fetch(`${root}${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      }),

    delete: (path: string) =>
      fetch(`${root}${path}`, {
        method: 'DELETE',
        headers
      })
  }
}

export type BackendResponse<T> = {
  success: boolean
  result?: T
  error?: string
  message?: string
}

/**
 * Parses a backend response and returns the result if successful.
 *
 * example usage:
 * const data = await parseBackendResponse(res, BackendCreateSchema)
 * return { success: true, data: data.result }
 * return { success: false, error: data.error }
 * return { success: false, error: data.message }
 * return { success: false, error: `HTTP ${res.status}` }
 * return { success: false, error: `HTTP ${res.status}` }
 * @param res - The response to parse
 * @param schema - The schema to use for parsing
 * @returns The parsed result if successful
 * @throws {Error} Throws an error if the response is not successful
 */
export function parseBackendResponse<T>(res: Response, schema: z.ZodSchema<BackendResponse<T>>) {
  return res
    .json()
    .catch(() => ({ success: false }))
    .then((raw) => {
      const parsed = schema.safeParse(raw)
      if (!res.ok || !parsed.success || !parsed.data.success) {
        throw new Error(
          parsed.success ? parsed.data.error || parsed.data.message : parsed.error.message
        )
      }
      return parsed.data.result
    })
}

export const PaginationSchema = z.object({
  page: z.number(),
  pages: z.number(),
  count: z.number()
})

/**
 * Creates a schema for a backend list response.
 * 
 * example usage:
 * const BackendListSchema = BackendListSchema(PatientSchema)
 * const res = await backendClient.get('/api/patient')
 * const data = await parseBackendResponse(res, BackendListSchema)
 * return { success: true, data: data.result }
 * return { success: false, error: data.error }
export const BackendListSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    result: itemSchema.array().optional(),
    pagination: PaginationSchema.optional(),
    message: z.string().optional(),
    error: z.string().optional()
  })
*/
export const BackendListSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.discriminatedUnion('success', [
    z.object({
      success: z.literal(true),
      result: itemSchema.array(),
      pagination: PaginationSchema.optional(),
      message: z.string().optional()
    }),
    z.object({
      success: z.literal(false),
      error: z.string(),
      message: z.string().optional()
    })
  ])

export const getClient = (ctx: IpcContext) => {
  try {
    return createBackendClient(ctx)
  } catch (err) {
    if (err instanceof Error && err.message === 'NO_BACKEND_TOKEN') {
      throw new Error('Token backend tidak ditemukan. Silakan login terlebih dahulu.')
    }
    throw err
  }
}
