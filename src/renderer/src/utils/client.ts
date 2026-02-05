import { AppRouter } from '@main/rpc/procedure'
import { createProxy } from '@mavolostudio/electron-rpc/client'
import { tanstackProcedures } from '@mavolostudio/electron-rpc/tanstack-procedures'
import { queryClient } from '@renderer/query-client'

// Create proxy that uses key-based invocation for registerIpcRouter
const proxy = createProxy<AppRouter>((path, args) => {
  return window.rpc.invoke('rpc', { path, input: args[0] })
})

// Export direct RPC client
export const rpc = proxy

// Export Tanstack Query wrapped client
export const client = tanstackProcedures(proxy, queryClient)
