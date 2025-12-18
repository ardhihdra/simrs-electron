import { useEffect } from 'react'
import { useNotificationStore } from '@renderer/store/notificationStore'

export const useNotificationListener = (): void => {
  const addNotification = useNotificationStore((state) => state.addNotification)

  useEffect(() => {
    const removeListener = window.electron.ipcRenderer.on('ws-notification', (_event, data) => {
      console.log('Received notification:', data)
      // Ensure data has expected shape, or provide defaults
      const title = data.title || 'Notification'
      // Map 'content' (from SendPayload) to 'body', or fallback to 'body' or stringified data
      const body = data.content || data.body || JSON.stringify(data)
      const type = ['info', 'success', 'warning', 'error'].includes(data.type) ? data.type : 'info'
      const url = data.url

      addNotification({ title, body, type, url })
    })

    return () => {
      removeListener()
    }
  }, [addNotification])
}
