/**
 * purpose: Master opsi quick triase IGD untuk registrasi cepat beserta metadata label/tone yang ditampilkan di UI dengan mapping level yang konsisten terhadap label opsi.
 * main callers: `IgdRegistrasiPage`, `IgdTriaseFormCard`, dan builder command registrasi IGD.
 * key dependencies: Tidak ada; konstanta lokal + helper pure.
 * main/public functions: `IGD_QUICK_TRIAGE_OPTIONS`, `getQuickTriageMeta`, `getQuickTriageLevel`.
 * side effects: Tidak ada; pure lookup.
 */
export type IgdQuickTriageLevel = number

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
    title: 'Level 2 — Urgent',
    description: 'Warna Kuning · Perlu tindakan segera',
    tone: 'warning' as const
  },
  {
    label: 'Nyeri hebat (VAS ≥ 7) → L3',
    value: 'l3-pain',
    level: 3 as const,
    title: 'Level 3 — Semi Urgent',
    description: 'Warna Hijau · Butuh evaluasi cepat',
    tone: 'success' as const
  },
  {
    label: 'Nyeri sedang (VAS 4–6) → L4',
    value: 'l4-moderate',
    level: 4 as const,
    title: 'Level 4 — Tidak Urgent',
    description: 'Warna Putih · Dapat menunggu singkat',
    tone: 'neutral' as const
  },
  {
    label: 'Keluhan ringan / Stabil → L4',
    value: 'l5-stable',
    level: 4 as const,
    title: 'Level 4 — Tidak Urgent',
    description: 'Warna Putih · Kondisi stabil',
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
