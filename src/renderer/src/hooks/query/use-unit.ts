import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

export interface UnitListEntry {
	id?: number
	nama?: string
	kode?: string
}

// MOVE TO simrs-types
export type UnitListResponse = {
	success: boolean
	result?: UnitListEntry[]
	message?: string
}

export const useUnitList = () => {
  return useQuery<UnitListResponse>({
    queryKey: ['unit', 'list', 'for-item-form'],
    queryFn: () => {
      const fn = window.api?.query?.unit?.list
      if (!fn) throw new Error('API unit tidak tersedia.')
      return fn()
    }
  })
}

export const useUnitOptions = () => {
  const { data: unitSource } = useUnitList();

  return useMemo(() => {
    const entries: UnitListEntry[] = Array.isArray(unitSource?.result) ? unitSource.result : []
    const map = new Map<string, string>()

    for (const item of entries) {
      const rawCode = typeof item.kode === 'string' && item.kode.length > 0 ? item.kode : ''
      const code = rawCode.trim().toUpperCase()
      if (!code) continue
      if (map.has(code)) continue
      const unitName = item.nama ?? code
      map.set(code, `${code} - ${unitName}`)
    }

    const options = Array.from(map.entries()).map(([value, label]) => ({ value, label }))
    return options
  }, [unitSource?.result])
}