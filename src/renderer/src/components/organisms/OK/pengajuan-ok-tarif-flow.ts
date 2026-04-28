/**
 * Purpose: Helper flow seleksi tarif aktif paket dan fallback payer untuk PengajuanOKForm.
 * Main callers: PengajuanOKForm.
 * Key dependencies: util kelas tarif dan selector fallback tarif OK.
 * Main/public functions: mapPengajuanOkPaymentMethodToPayerCategory, extractPengajuanOkTarifValue, pickPengajuanOkActiveTarifByKelas.
 * Side effects: none (pure helper).
 */
import { KELAS_ORDER, normalizeKelasTarifValue } from '../../../utils/tarif-kelas'
import {
  selectTarifWithFallback,
  type TarifPayerCategory,
  type TarifSelectionSource
} from '../../../utils/ok-tarif-selector'

const normalizeKelas = normalizeKelasTarifValue

export interface PengajuanOkTarifRow {
  id?: number | string | null
  aktif?: boolean | null
  kelas?: string | null
  payerCategory?: string | null
  isCyto?: boolean | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  tarifTotal?: number | string | null
  tarifPaket?: number | string | null
  nominal?: number | string | null
}

export interface PengajuanOkActivePaketTarif {
  kelas: string
  tarif: number
  source: TarifSelectionSource
  resolvedPayerCategory: TarifPayerCategory
}

export const mapPengajuanOkPaymentMethodToPayerCategory = (
  paymentMethod: unknown
): TarifPayerCategory => {
  const normalized = String(paymentMethod || '')
    .trim()
    .toLowerCase()

  switch (normalized) {
    case 'cash':
    case 'general':
    case 'umum':
      return 'umum'
    case 'bpjs':
      return 'bpjs'
    case 'company':
    case 'perusahaan':
      return 'perusahaan'
    case 'asuransi':
    case 'insurance':
      return 'asuransi'
    default:
      return 'umum'
  }
}

export const extractPengajuanOkTarifValue = (
  tarifRow: PengajuanOkTarifRow | null | undefined
): number | null => {
  const candidates = [tarifRow?.tarifTotal, tarifRow?.tarifPaket, tarifRow?.nominal]
  for (const value of candidates) {
    const num = Number(value)
    if (Number.isFinite(num) && num >= 0) return num
  }
  return null
}

export const pickPengajuanOkActiveTarifByKelas = (
  tarifList: Array<PengajuanOkTarifRow | null | undefined>,
  context: {
    payerCategory: TarifPayerCategory
    isCyto: boolean
    tariffDate: string
  }
): PengajuanOkActivePaketTarif[] => {
  const kelasCandidates = new Set<string>()
  ;(Array.isArray(tarifList) ? tarifList : []).forEach((row) => {
    if (!row || row.aktif === false) return
    const kelas = normalizeKelas(row?.kelas)
    if (!kelas) return
    kelasCandidates.add(kelas)
  })

  return Array.from(kelasCandidates)
    .map((kelas): PengajuanOkActivePaketTarif | null => {
      const selection = selectTarifWithFallback(tarifList, {
        kelas,
        requestedPayerCategory: context.payerCategory,
        isCyto: context.isCyto,
        tanggal: context.tariffDate
      })
      if (!selection) return null

      const tarif = extractPengajuanOkTarifValue(selection.tarifRow)
      if (tarif === null) return null

      return {
        kelas,
        tarif,
        source: selection.source,
        resolvedPayerCategory: selection.resolvedPayerCategory
      }
    })
    .filter((item): item is PengajuanOkActivePaketTarif => !!item)
    .sort((a, b) => {
      const idxA = KELAS_ORDER.indexOf(a.kelas)
      const idxB = KELAS_ORDER.indexOf(b.kelas)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.kelas.localeCompare(b.kelas)
    })
}
