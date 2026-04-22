export const DEFAULT_TARIF_KELAS_CODE = 'UMUM'
export const KELAS_ORDER = ['CLASS_1', 'CLASS_2', 'CLASS_3', 'VIP', DEFAULT_TARIF_KELAS_CODE]
export type TarifKelasCode = string
export type KelasTarifOption = { value: TarifKelasCode; label: string }

const ORDER_MAP: Record<string, number> = {
  CLASS_1: 0,
  CLASS_2: 1,
  CLASS_3: 2,
  VIP: 3,
  UMUM: 9999
}

const normalizeRaw = (kelas: unknown): string =>
  String(kelas || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')

export const normalizeKelasTarifValue = (kelas: unknown): TarifKelasCode | '' => {
  const raw = normalizeRaw(kelas)
  if (!raw) return ''
  return raw
}

export const getKelasTarifLabel = (kelas: unknown): string => {
  const normalized = normalizeKelasTarifValue(kelas)
  if (!normalized) return '-'

  switch (normalized) {
    case 'CLASS_1':
      return 'Kelas 1'
    case 'CLASS_2':
      return 'Kelas 2'
    case 'CLASS_3':
      return 'Kelas 3'
    case 'VIP':
      return 'VIP'
    case 'UMUM':
      return 'Umum / Non Kelas'
    default:
      return normalized
        .split('_')
        .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
        .join(' ')
  }
}

export const buildKelasTarifPriority = (kelas: unknown): TarifKelasCode[] => {
  const normalized = normalizeKelasTarifValue(kelas)
  if (!normalized) return [DEFAULT_TARIF_KELAS_CODE]
  if (normalized === DEFAULT_TARIF_KELAS_CODE) return [DEFAULT_TARIF_KELAS_CODE]
  return [normalized, DEFAULT_TARIF_KELAS_CODE]
}

export const ensureUmumOption = (options: KelasTarifOption[]): KelasTarifOption[] => {
  const hasUmum = options.some(
    (option) => normalizeKelasTarifValue(option?.value) === DEFAULT_TARIF_KELAS_CODE
  )
  if (hasUmum) return options

  return [
    ...options,
    {
      value: DEFAULT_TARIF_KELAS_CODE,
      label: getKelasTarifLabel(DEFAULT_TARIF_KELAS_CODE)
    }
  ]
}

export const sortKelasTarifOptions = (options: KelasTarifOption[]): KelasTarifOption[] =>
  [...options].sort((a, b) => {
    const normalizedA = normalizeKelasTarifValue(a.value)
    const normalizedB = normalizeKelasTarifValue(b.value)
    const orderA = ORDER_MAP[normalizedA] ?? Number.MAX_SAFE_INTEGER
    const orderB = ORDER_MAP[normalizedB] ?? Number.MAX_SAFE_INTEGER
    if (orderA !== orderB) return orderA - orderB
    return a.label.localeCompare(b.label)
  })

export const DEFAULT_KELAS_TARIF_OPTIONS: KelasTarifOption[] = [
  { value: DEFAULT_TARIF_KELAS_CODE, label: 'Umum / Non Kelas' }
]
