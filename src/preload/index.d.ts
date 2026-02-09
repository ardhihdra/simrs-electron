import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      notification: {
        send: (payload: {
          title: string
          content: string
          targetUserId?: string
          url?: string
        }) => Promise<any>
      }
    }
    rpc: any
  }
}
