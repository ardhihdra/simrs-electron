import { Middleware } from '@mavolostudio/electron-rpc'
import type { AppContext } from '../types'

export const loggingMiddleware: Middleware<AppContext, any> = async ({ input }, next) => {
  console.log('[RPC] Request:', input)
  const result = await next()
  console.log('[RPC] Response:', result)
  return result
}
