/**
 * Purpose: Seleksi tarif OK dengan strategi exact payer lalu fallback ke UMUM untuk payer non-umum.
 * Main callers: PengajuanOKForm, DetailVerifikasiPage.
 * Key dependencies: dayjs untuk normalisasi tanggal efektif tarif.
 * Main/public functions: selectTarifWithFallback, normalizeTarifPayerCategory.
 * Side effects: none (pure selector helper).
 */
import dayjs from 'dayjs'

export type TarifPayerCategory = 'umum' | 'bpjs' | 'perusahaan' | 'asuransi'
export type TarifSelectionSource = 'exact' | 'fallback_umum'

export interface TarifSelectionResult<TTarifRow> {
  tarifRow: TTarifRow
  source: TarifSelectionSource
  requestedPayerCategory: TarifPayerCategory
  resolvedPayerCategory: TarifPayerCategory
}

type TarifSelectorRowBase = {
  id?: number | string | null
  aktif?: boolean | null
  kelas?: string | null
  payerCategory?: string | null
  isCyto?: boolean | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
}

interface SelectTarifWithFallbackParams {
  kelas: string
  requestedPayerCategory: TarifPayerCategory
  isCyto: boolean
  tanggal: string
}

export const normalizeTarifPayerCategory = (value: unknown): TarifPayerCategory | null => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()

  switch (normalized) {
    case 'umum':
      return 'umum'
    case 'bpjs':
      return 'bpjs'
    case 'perusahaan':
      return 'perusahaan'
    case 'asuransi':
      return 'asuransi'
    default:
      return null
  }
}

const normalizeKelasValue = (value: unknown): string =>
  String(value || '')
    .trim()
    .toUpperCase()

const isDateWithinPeriod = (tanggal: string, from?: string | null, to?: string | null): boolean => {
  const targetDate = dayjs(tanggal).startOf('day')
  if (!targetDate.isValid()) return false

  const start = dayjs(String(from || '')).startOf('day')
  if (!start.isValid()) return false
  if (start.isAfter(targetDate, 'day')) return false

  if (to) {
    const end = dayjs(String(to)).startOf('day')
    if (end.isValid() && end.isBefore(targetDate, 'day')) return false
  }

  return true
}

const compareTarifPriority = <TTarifRow extends TarifSelectorRowBase>(
  a: TTarifRow,
  b: TTarifRow
) => {
  const fromA = dayjs(String(a?.effectiveFrom || '')).startOf('day')
  const fromB = dayjs(String(b?.effectiveFrom || '')).startOf('day')

  const validA = fromA.isValid()
  const validB = fromB.isValid()
  if (validA && validB && !fromA.isSame(fromB, 'day')) {
    return fromB.valueOf() - fromA.valueOf()
  }
  if (validA && !validB) return -1
  if (!validA && validB) return 1

  const idA = Number(a?.id ?? 0)
  const idB = Number(b?.id ?? 0)
  return idB - idA
}

export const selectTarifWithFallback = <TTarifRow extends TarifSelectorRowBase>(
  tarifList: Array<TTarifRow | null | undefined>,
  params: SelectTarifWithFallbackParams
): TarifSelectionResult<TTarifRow> | null => {
  const normalizedKelas = normalizeKelasValue(params.kelas)
  if (!normalizedKelas) return null

  const baseCandidates = (Array.isArray(tarifList) ? tarifList : [])
    .filter((row): row is TTarifRow => !!row && row?.aktif !== false)
    .filter((row) => {
      const tarifKelas = normalizeKelasValue(row?.kelas)
      if (!tarifKelas || tarifKelas !== normalizedKelas) return false
      if (!isDateWithinPeriod(params.tanggal, row?.effectiveFrom, row?.effectiveTo)) return false
      return Boolean(row?.isCyto ?? false) === params.isCyto
    })

  const exactCandidates = baseCandidates
    .filter((row) => {
      const payerCategory = normalizeTarifPayerCategory(row?.payerCategory) || 'umum'
      return payerCategory === params.requestedPayerCategory
    })
    .sort(compareTarifPriority)

  const exact = exactCandidates[0]
  if (exact) {
    return {
      tarifRow: exact,
      source: 'exact',
      requestedPayerCategory: params.requestedPayerCategory,
      resolvedPayerCategory: params.requestedPayerCategory
    }
  }

  if (params.requestedPayerCategory === 'umum') return null

  const fallbackCandidates = baseCandidates
    .filter((row) => {
      const payerCategory = normalizeTarifPayerCategory(row?.payerCategory) || 'umum'
      return payerCategory === 'umum'
    })
    .sort(compareTarifPriority)

  const fallback = fallbackCandidates[0]
  if (!fallback) return null

  return {
    tarifRow: fallback,
    source: 'fallback_umum',
    requestedPayerCategory: params.requestedPayerCategory,
    resolvedPayerCategory: 'umum'
  }
}
