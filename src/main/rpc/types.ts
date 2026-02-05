import { IpcContext } from '@main/ipc/router'

export type AppContext = {
  client: any
} & IpcContext
