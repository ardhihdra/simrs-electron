import { create } from 'zustand'

export interface Notification {
  id: string
  title: string
  body: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  timestamp: string
  url?: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  addNotification: (notification) =>
    set((state) => {
      const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        read: false,
        timestamp: new Date().toISOString()
      }
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      }
    }),
  markAsRead: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      if (notification && !notification.read) {
        return {
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
          unreadCount: state.unreadCount - 1
        }
      }
      return state
    }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0
    })),
  clearAll: () => set({ notifications: [], unreadCount: 0 })
}))
