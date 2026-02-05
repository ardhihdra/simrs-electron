import { IpcContext } from '@main/ipc/router'
import { createBackendClient } from '@main/utils/backendClient'
import type { IpcMainInvokeEvent } from 'electron'
import { sessionStore } from '..'
import { AppContext } from './types'

/**
 * Application context available to all RPC procedures
 */

/**
 * Create context for each RPC request
 */
export async function createContext(event: IpcMainInvokeEvent): Promise<AppContext> {
  const ipcContext: IpcContext = {
    event,
    senderId: event.sender.id,
    webContents: event.sender,
    sessionStore: sessionStore,
    session: sessionStore.getWindowSession(event.sender.id),
    user: sessionStore.getUser()
  }
  const client = createBackendClient(ipcContext)
  // Access event.sender if needed for more info about the caller
  return {
    client,
    ...ipcContext
  }
}
