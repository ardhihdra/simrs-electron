/**
 * purpose: Centralize exam workspace route guards and IPC channel names for controlled window closing.
 * main callers: main process window-close guard (`src/main/index.ts`) and renderer exam workspace pages.
 * key dependencies: URL parser and route pattern matchers.
 * main/public functions: `EXAM_WINDOW_CLOSE_REQUEST_CHANNEL`, `EXAM_WINDOW_CLOSE_ALLOW_ONCE_CHANNEL`, `isExamWorkspaceRoute`.
 * important side effects: none.
 */
export const EXAM_WINDOW_CLOSE_REQUEST_CHANNEL = 'exam-window:close-request'
export const EXAM_WINDOW_CLOSE_ALLOW_ONCE_CHANNEL = 'exam-window:close-allow-once'

const EXAM_WORKSPACE_ROUTE_PATTERNS = [
  /^\/dashboard\/doctor\/[^/?#]+$/i,
  /^\/dashboard\/nurse-calling\/medical-record\/[^/?#]+$/i,
  /^\/dashboard\/rawat-inap\/daftar-pasien\/[^/?#]+$/i
]

const normalizeExamWorkspacePath = (value: string): string => {
  if (!value) return ''

  let pathCandidate = value.trim()

  try {
    const parsedUrl = new URL(pathCandidate)
    pathCandidate = parsedUrl.hash ? parsedUrl.hash.slice(1) : parsedUrl.pathname
  } catch {
  }

  if (pathCandidate.startsWith('#')) {
    pathCandidate = pathCandidate.slice(1)
  }

  if (!pathCandidate.startsWith('/')) {
    pathCandidate = `/${pathCandidate}`
  }

  const withoutQuery = pathCandidate.split('?')[0]
  const normalized = withoutQuery.replace(/\/+$/, '')
  return normalized || '/'
}

export const isExamWorkspaceRoute = (value: string): boolean => {
  const normalizedPath = normalizeExamWorkspacePath(value)
  if (!normalizedPath) return false
  return EXAM_WORKSPACE_ROUTE_PATTERNS.some((pattern) => pattern.test(normalizedPath))
}
