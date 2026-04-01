import z from 'zod'
import { t } from '..'

export const queryProcedure = {
  entity: t
    .input(
      z.object({
        model: z.string(),
        path: z.string().optional(),
        params: z.any().optional(),
        method: z.enum(['get', 'post', 'put', 'patch', 'delete']).default('get'),
        body: z.any().optional(),
        listAll: z.boolean().optional()
      })
    )
    .output(z.any())
    .query(async ({ client }, args) => {
      const { model, path, params, method, body, listAll } = args

      // Construct base URL path
      let fullPath = `/api/${model}${listAll ? '/listAll' : ''}`
      if (path && !listAll) {
        const cleanPath = path.startsWith('/') ? path.slice(1) : path
        fullPath += `/${cleanPath}`
      }

      // Append query parameters
      if (params) {
        const queryString =
          typeof params === 'string' ? params : new URLSearchParams(params as any).toString()
        if (queryString) {
          fullPath += `?${queryString}`
        }
      }

      // API method mapping for cleaner execution
      const methodMap: Record<string, () => Promise<Response>> = {
        get: () => client.get(fullPath),
        post: () => client.post(fullPath, body),
        put: () => client.put(fullPath, body),
        patch: () => client.patch(fullPath, body),
        delete: () => client.delete(fullPath)
      }

      const apiCall = methodMap[method] || methodMap.get

      try {
        const res = await apiCall()

        // Attempt to parse JSON, providing a fallback for invalid responses
        const raw = await res.json().catch(() => ({
          success: false,
          message: `Gagal memproses respon dari server (${res.status})`
        }))

        return raw
      } catch (error) {
        console.error(`[RPC:query] Error during ${method.toUpperCase()} ${fullPath}:`, error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Internal RPC Error'
        }
      }
    })
}
