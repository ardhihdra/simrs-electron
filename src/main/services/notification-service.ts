import WebSocket from 'ws'
import { BrowserWindow } from 'electron'

export class NotificationService {
  private ws: WebSocket | null = null
  private mainWindow: BrowserWindow | null = null
  private reconnectInterval = 5000
  private url = 'ws://localhost:8810/ws'

  private token: string | null = null

  constructor() {
    // Wait for explicit connect call with token
  }

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  public connect(token: string): void {
    this.token = token
    this.initiateConnection()
  }

  private initiateConnection(): void {
    if (!this.token) return

    console.log(`[NotificationService] Connecting to ${this.url}...`)
    this.ws = new WebSocket(this.url)

    this.ws.on('open', () => {
      console.log('[NotificationService] WebSocket open, sending auth...')
      this.send({ type: 'auth', token: this.token })
    })

    this.ws.on('message', (data) => {
      try {
        const message = data.toString()
        const parsed = JSON.parse(message)

        if (parsed.type === 'auth_ok') {
          console.log('[NotificationService] Authenticated successfully')
          return
        }

        if (parsed.type === 'control' && parsed.action === 'ping') {
          this.send({ type: 'control', action: 'pong' })
          return
        }

        console.log('[NotificationService] Received:', parsed)

        const isNotification =
          parsed.type === 'notification' ||
          parsed.type === 'message' ||
          (parsed.title && parsed.content) // Handle flat SendPayload

        if (isNotification) {
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            // Extract payload and forward
            // If it's a flat payload, send parsed directly. If wrapped, send parsed.payload
            const payload = parsed.title && parsed.content ? parsed : parsed.payload || {}
            this.mainWindow.webContents.send('ws-notification', payload)
          }
        }
      } catch (error) {
        console.error('[NotificationService] Error parsing message:', error)
      }
    })

    this.ws.on('error', (error) => {
      console.error('[NotificationService] WebSocket error:', error)
    })

    this.ws.on('close', () => {
      console.log('[NotificationService] Disconnected. Reconnecting in 5s...')
      this.ws = null
      setTimeout(() => this.initiateConnection(), this.reconnectInterval)
    })
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.terminate()
      this.ws = null
    }
  }
}

export const notificationService = new NotificationService()
