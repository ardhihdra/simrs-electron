import { useQuery } from '@tanstack/react-query'
import {
  DEFAULT_KELAS_TARIF_OPTIONS,
  ensureUmumOption,
  getKelasTarifLabel,
  normalizeKelasTarifValue,
  sortKelasTarifOptions,
  type KelasTarifOption
} from '@renderer/utils/tarif-kelas'

type ReferenceTarifClassRow = {
  code?: string | null
  display?: string | null
}

const toKelasOptions = (rows: ReferenceTarifClassRow[]): KelasTarifOption[] => {
  const map = new Map<KelasTarifOption['value'], KelasTarifOption>()
  rows.forEach((row) => {
    const normalizedCode = normalizeKelasTarifValue(row?.code)
    if (!normalizedCode) return
    if (map.has(normalizedCode)) return

    map.set(normalizedCode, {
      value: normalizedCode,
      label: String(row?.display || '').trim() || getKelasTarifLabel(normalizedCode)
    })
  })

  const options = ensureUmumOption(sortKelasTarifOptions(Array.from(map.values())))
  return options.length > 0 ? options : DEFAULT_KELAS_TARIF_OPTIONS
}

export const useTarifKelasOptions = () => {
  return useQuery({
    queryKey: ['referencecode', 'tarif-classes'],
    queryFn: async (): Promise<KelasTarifOption[]> => {
      const fn = window.api?.query?.referencecode?.tarifClasses
      if (!fn) return DEFAULT_KELAS_TARIF_OPTIONS

      const response = await fn()
      if (!response?.success) return DEFAULT_KELAS_TARIF_OPTIONS

      const rows = (response as any)?.result
      if (!Array.isArray(rows)) return DEFAULT_KELAS_TARIF_OPTIONS

      return toKelasOptions(rows as ReferenceTarifClassRow[])
    },
    staleTime: 10 * 60 * 1000
  })
}
