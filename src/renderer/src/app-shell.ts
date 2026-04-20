export type AppShellKind = 'design-system' | 'dashboard'

const DESIGN_SYSTEM_BASE = '/design-system'

export function getDefaultHomePath(): string {
  return '/'
}

export function getAppShellKind(pathname: string): AppShellKind {
  return pathname === DESIGN_SYSTEM_BASE ||
    pathname.startsWith(`${DESIGN_SYSTEM_BASE}/`)
    ? 'design-system'
    : 'dashboard'
}
