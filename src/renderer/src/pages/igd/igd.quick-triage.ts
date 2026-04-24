export type IgdQuickTriageLevel = 1 | 2 | 3 | 4 | 5

export const IGD_QUICK_TRIAGE_OPTIONS = [
  {
    label: 'Tidak sadarkan diri / Henti jantung → L1',
    value: 'l1-critical',
    level: 1 as const,
    title: 'Level 1 — Resusitasi',
    description: 'Warna Merah · Masuk langsung, tanpa antrian',
    tone: 'danger' as const
  },
  {
    label: 'Gawat, napas / sirkulasi terancam → L1',
    value: 'l1-airway',
    level: 1 as const,
    title: 'Level 1 — Resusitasi',
    description: 'Warna Merah · Prioritas pertama',
    tone: 'danger' as const
  },
  {
    label: 'Perdarahan aktif / Syok → L2',
    value: 'l2-shock',
    level: 2 as const,
    title: 'Level 2 — Emergensi',
    description: 'Warna Merah · Perlu tindakan segera',
    tone: 'warning' as const
  },
  {
    label: 'Nyeri hebat (VAS ≥ 7) → L3',
    value: 'l3-pain',
    level: 3 as const,
    title: 'Level 3 — Urgen',
    description: 'Warna Kuning · Butuh evaluasi cepat',
    tone: 'warning' as const
  },
  {
    label: 'Nyeri sedang (VAS 4–6) → L4',
    value: 'l4-moderate',
    level: 4 as const,
    title: 'Level 4 — Semi-Urgen',
    description: 'Warna Hijau · Dapat menunggu singkat',
    tone: 'success' as const
  },
  {
    label: 'Keluhan ringan / Stabil → L5',
    value: 'l5-stable',
    level: 5 as const,
    title: 'Level 5 — Tidak Urgen',
    description: 'Warna Hijau · Kondisi stabil',
    tone: 'neutral' as const
  }
] as const

export const DEFAULT_IGD_QUICK_TRIAGE_CONDITION = 'l3-pain'

export function getQuickTriageMeta(conditionKey?: string) {
  return (
    IGD_QUICK_TRIAGE_OPTIONS.find((item) => item.value === conditionKey) ??
    IGD_QUICK_TRIAGE_OPTIONS.find((item) => item.value === DEFAULT_IGD_QUICK_TRIAGE_CONDITION) ??
    IGD_QUICK_TRIAGE_OPTIONS[0]
  )
}

export function getQuickTriageLevel(conditionKey?: string): IgdQuickTriageLevel {
  return getQuickTriageMeta(conditionKey).level
}
