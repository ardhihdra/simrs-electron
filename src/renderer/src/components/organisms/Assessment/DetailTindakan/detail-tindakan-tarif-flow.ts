/**
 * Purpose: Helper flow seleksi tarif dan cyto untuk DetailTindakanForm.
 * Main callers: DetailTindakanForm.
 * Key dependencies: selector fallback tarif OK.
 * Main/public functions: mapDetailTindakanPaymentMethodToPayerCategory, pickDetailTindakanTarifWithFallback, resolveDetailTindakanPaketCyto.
 * Side effects: none (pure helper).
 */
import {
  selectTarifWithFallback,
  type TarifPayerCategory,
  type TarifSelectionResult
} from '../../../../utils/ok-tarif-selector'

export type DetailTindakanTarifRow = {
  id?: number | string | null
  aktif?: boolean | null
  kelas?: string | null
  payerCategory?: string | null
  isCyto?: boolean | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
}

export const mapDetailTindakanPaymentMethodToPayerCategory = (
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

export const pickDetailTindakanTarifWithFallback = <TTarifRow extends DetailTindakanTarifRow>(
  tarifList: Array<TTarifRow | null | undefined>,
  params: {
    kelas: string
    payerCategory: TarifPayerCategory
    isCyto: boolean
    tanggal: string
  }
): TarifSelectionResult<TTarifRow> | null => {
  return selectTarifWithFallback(tarifList, {
    kelas: params.kelas,
    requestedPayerCategory: params.payerCategory,
    isCyto: params.isCyto,
    tanggal: params.tanggal
  })
}

export const resolveDetailTindakanPaketCyto = (entry: {
  paketCytoGlobal?: unknown
  tindakanList?: Array<{ cyto?: unknown }>
}): boolean => {
  if (typeof entry?.paketCytoGlobal === 'boolean') {
    return entry.paketCytoGlobal
  }

  const tindakanList = Array.isArray(entry?.tindakanList) ? entry.tindakanList : []
  return tindakanList.some((item) => Boolean(item?.cyto))
}
