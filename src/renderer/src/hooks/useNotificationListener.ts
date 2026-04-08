import { useEffect } from 'react'
import { useNotificationStore } from '@renderer/store/notificationStore'

const playNotificationSound = (isHighPriority = false): void => {
  try {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    if (isHighPriority) {
      // Urgent double-beep for Pharmacy SLA
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, context.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.15, context.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4)
      
      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      
      oscillator.start()
      oscillator.stop(context.currentTime + 0.4)

      // Second beep
      setTimeout(() => {
        const osc2 = context.createOscillator()
        const gain2 = context.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(1320, context.currentTime)
        gain2.gain.setValueAtTime(0.15, context.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3)
        osc2.connect(gain2)
        gain2.connect(context.destination)
        osc2.start()
        osc2.stop(context.currentTime + 0.3)
      }, 150)
    } else {
      // Standard gentle ping
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(440, context.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.1)

      gainNode.gain.setValueAtTime(0.1, context.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5)

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)

      oscillator.start()
      oscillator.stop(context.currentTime + 0.5)
    }
  } catch (error) {
    console.error('Failed to play notification sound:', error)
  }
}

export const useNotificationListener = (): void => {
  const addNotification = useNotificationStore((state) => state.addNotification)

  useEffect(() => {
    const removeListener = window.electron.ipcRenderer.on('ws-notification', (_event, data) => {
      console.log('Received notification:', data)

      const title = data.title || 'Notification'
      const body = data.content || data.body || JSON.stringify(data)
      const type = ['info', 'success', 'warning', 'error'].includes(data.type) ? data.type : 'info'
      const url = data.url

      // Play sound: urgent for pharmacy SLA, normal for others
      const isUrgent = title.toLowerCase().includes('sla farmasi') || title.toLowerCase().includes('peringatan')
      playNotificationSound(isUrgent)

      addNotification({ title, body, type, url })
    })

    return () => {
      // @ts-ignore - The removeListener returned is typically a function or cleanup object in the toolkit
      if (typeof removeListener === 'function') {
        removeListener()
      }
    }
  }, [addNotification])
}


