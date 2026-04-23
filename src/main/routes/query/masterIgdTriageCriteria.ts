/**
 * purpose: IPC query route untuk mengambil master kriteria triase IGD aktif dari backend.
 * main callers: `window.api.query.masterIgdTriageCriteria.listActive()` di renderer triase workspace.
 * key dependencies: `getClient`, endpoint `/api/masterigdtriagecriteria` dan fallback `/listAll`.
 * main/public functions: `listActive`.
 * side effects: HTTP GET ke backend API (read-only).
 */
import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { getClient } from '@main/utils/backendClient'

export const requireSession = true

const MasterIgdTriageCriteriaSchema = z.object({
  id: z.number(),
  triageLevelId: z.number(),
  criteriaGroup: z.string(),
  criteriaText: z.string(),
  sortOrder: z.number().optional().nullable(),
  isActive: z.boolean().optional().nullable()
})

export type MasterIgdTriageCriteriaItem = z.infer<typeof MasterIgdTriageCriteriaSchema>

export const schemas = {
  listActive: {
    args: z.void().optional(),
    result: z.object({
      success: z.boolean(),
      result: z.array(MasterIgdTriageCriteriaSchema).optional(),
      error: z.string().optional()
    })
  }
} as const

const extractErrorMessage = (raw: unknown, res: Response) => {
  if (raw && typeof raw === 'object') {
    const payload = raw as Record<string, unknown>
    const errorVal = payload.error
    const messageVal = payload.message

    if (typeof errorVal === 'string' && errorVal.trim()) return errorVal
    if (typeof messageVal === 'string' && messageVal.trim()) return messageVal

    if (errorVal !== undefined && errorVal !== null) {
      try {
        return JSON.stringify(errorVal)
      } catch {
        return String(errorVal)
      }
    }
  }

  return `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''}`
}

const parseRows = (raw: unknown): MasterIgdTriageCriteriaItem[] => {
  if (!raw || typeof raw !== 'object') return []

  const payload = raw as Record<string, unknown>
  const candidates =
    (Array.isArray(payload.result) && payload.result) ||
    (Array.isArray(payload.data) && payload.data) ||
    []

  const parsed = z.array(MasterIgdTriageCriteriaSchema).safeParse(candidates)
  if (!parsed.success) {
    throw new Error(parsed.error.message)
  }

  return parsed.data
}

export const listActive = async (ctx: IpcContext) => {
  try {
    const client = getClient(ctx)
    const requestCandidates = [
      '/api/masterigdtriagecriteria?items=1000&isActive=true',
      '/api/masterigdtriagecriteria/listAll?items=1000&isActive=true'
    ]

    let lastError = 'Gagal mengambil master kriteria triase IGD'

    for (const endpoint of requestCandidates) {
      const res = await client.get(endpoint)
      const raw = await res.json().catch(() => null)

      if (!res.ok) {
        lastError = extractErrorMessage(raw, res)
        continue
      }

      if (raw && typeof raw === 'object' && (raw as Record<string, unknown>).success === false) {
        lastError = extractErrorMessage(raw, res)
        continue
      }

      const rows = parseRows(raw)
      const filteredAndSorted = rows
        .filter((row) => row.isActive !== false)
        .sort((a, b) => {
          if (a.triageLevelId !== b.triageLevelId) return a.triageLevelId - b.triageLevelId
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        })

      return { success: true, result: filteredAndSorted }
    }

    return { success: false, error: lastError }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
