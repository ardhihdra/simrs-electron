import { IpcContext } from '@main/ipc/router'

type ExportArgs = {
  entity: string
  usePagination?: boolean
  page?: number
  items?: number
  q?: string
  fields?: string
  filter?: Record<string, string | number | boolean>
  startDate?: string
  endDate?: string
}

export const requireSession = true

export const exportCsv = async (ctx: IpcContext, args: ExportArgs) => {
  const base = process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  const token = ctx?.sessionStore?.getBackendTokenForWindow?.(ctx.senderId)
  if (!token) {
    return { success: false, error: 'Token backend tidak ditemukan. Silakan login terlebih dahulu.' }
  }
  const root = String(base).endsWith('/') ? String(base).slice(0, -1) : String(base)
  const params = new URLSearchParams()
  params.append('export', 'csv')
  if (args.usePagination) params.append('usePagination', 'true')
  if (typeof args.page === 'number') params.append('page', String(args.page))
  if (typeof args.items === 'number') params.append('items', String(args.items))
  if (args.q) params.append('q', args.q)
  if (args.fields) params.append('fields', args.fields)
  const defaultFiltersByEntity: Record<string, Record<string, string | number | boolean>> = {
    kepegawaian: { removed: false }
  }
  const effectiveFilter = args.filter ?? defaultFiltersByEntity[args.entity]
  if (effectiveFilter && Object.keys(effectiveFilter).length > 0) {
    params.append('filter', JSON.stringify(effectiveFilter))
  }
  if (args.startDate) params.append('startDate', args.startDate)
  if (args.endDate) params.append('endDate', args.endDate)
  params.append('token', token)
  const url = `${root}/api/${args.entity}/export?${params.toString()}`
  return { success: true, url }
}

