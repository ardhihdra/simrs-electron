import { randomBytes } from 'crypto'

/**
 * Simple in-memory SessionStore interface expected by router/middlewares.
 * Implement your concrete store elsewhere and pass it into router.
 * This auth only between main process and renderer process.
 * TODO: Use more safe token like JWT rather than random string.
 * TODO: Add integration with main server.
 */
export type Session = {
  token: string
  userId: string
  createdAt: number
  expiresAt?: number
}

export class SessionStore {
  private sessions = new Map<string, Session>()
  // Map each window (webContents id) to its current session token
  private windowTokens = new Map<number, string>()

  private backendTokens = new Map<number, string>()
  private defaultTtlMs: number

  constructor(opts?: { defaultTtlMs?: number }) {
    // default TTL: 8 hours
    this.defaultTtlMs = opts?.defaultTtlMs ?? 1000 * 60 * 60 * 8
  }

  create(userId: string): Session {
    const token = randomBytes(48).toString('hex')
    const now = Date.now()
    const session: Session = {
      token,
      userId,
      createdAt: now,
      expiresAt: now + this.defaultTtlMs
    }
    this.sessions.set(token, session)
    return session
  }

  get(token: string): Session | undefined {
    const session = this.sessions.get(token)
    if (!session) return undefined
    if (session.expiresAt && session.expiresAt <= Date.now()) {
      this.sessions.delete(token)
      return undefined
    }
    return session
  }

  delete(token: string): void {
    this.sessions.delete(token)
  }

  refresh(token: string, extendMs?: number): Session | undefined {
    const session = this.sessions.get(token)
    if (!session) return undefined
    const ttl = extendMs ?? this.defaultTtlMs
    const now = Date.now()
    session.expiresAt = now + ttl
    this.sessions.set(token, session)
    return session
  }

  clearExpired(): number {
    const now = Date.now()
    let removed = 0
    for (const [t, s] of this.sessions) {
      if (s.expiresAt && s.expiresAt <= now) {
        this.sessions.delete(t)
        removed++
      }
    }
    return removed
  }

  clearWindowSessions(): number {
    let cleared = 0
    for (const [windowId, token] of this.windowTokens) {
      if (this.get(token)) {
        this.windowTokens.delete(windowId)
        cleared++
      }
    }
    return cleared
  }

  size(): number {
    return this.sessions.size
  }

  /**
   * Associate a window (by senderId/webContents id) with a session token.
   * This enables node-only auth flows where the renderer passes no token.
   */
  authenticateWindow(windowId: number, token: string): void {
    this.windowTokens.set(windowId, token)
  }

  setBackendTokenForWindow(windowId: number, token: string): void {
    this.backendTokens.set(windowId, token)
  }

  getBackendTokenForWindow(windowId: number): string | undefined {
    return this.backendTokens.get(windowId)
  }

  /**
   * Get the current session for a window (if any), validating TTL.
   */
  getWindowSession(windowId: number): Session | undefined {
    const token = this.windowTokens.get(windowId)
    if (!token) return undefined
    return this.get(token)
  }

  /**
   * Clear window-session association (e.g., on logout or window close).
   */
  clearWindow(windowId: number): void {
    this.windowTokens.delete(windowId)
    this.backendTokens.delete(windowId)
  }
}
