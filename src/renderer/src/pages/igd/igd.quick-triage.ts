/**
 * purpose: Master opsi quick triase IGD untuk registrasi cepat beserta metadata label/tone yang ditampilkan di UI dengan mapping level yang konsisten terhadap label opsi.
 * main callers: `IgdRegistrasiPage`, `IgdTriaseFormCard`, dan builder command registrasi IGD.
 * key dependencies: Tidak ada; konstanta lokal + helper pure.
 * main/public functions: `IGD_QUICK_TRIAGE_OPTIONS`, `getQuickTriageMeta`, `getQuickTriageLevel`.
 * side effects: Tidak ada; pure lookup.
 */
import type { IgdTriageLevel } from './igd.triage-level'

export type IgdQuickTriageLevel = IgdTriageLevel

export const IGD_QUICK_TRIAGE_OPTIONS = [
  {
    label: 'L0 - Hitam',
    value: 'l0-critical',
    level: 0 as const,
    title: 'Level 0 - Resusitasi',
    description: 'Warna Hitam - Masuk langsung, tanpa antrian',
    tone: 'danger' as const
  },
  {
    label: 'L1 - Merah',
    value: 'l1-shock',
    level: 1 as const,
    title: 'Level 1 - Emergensi',
    description: 'Warna Merah - Perlu tindakan segera',
    tone: 'danger' as const
  },
  {
    label: 'L2 - Kuning',
    value: 'l2-pain',
    level: 2 as const,
    title: 'Level 2 - Urgen',
    description: 'Warna Kuning - Butuh evaluasi cepat',
    tone: 'warning' as const
  },
  {
    label: 'L3 - Hijau',
    value: 'l3-moderate',
    level: 3 as const,
    title: 'Level 3 - Semi-Urgen',
    description: 'Warna Hijau - Dapat menunggu singkat',
    tone: 'success' as const
  },
  {
    label: 'L4 - Putih',
    value: 'l4-stable',
    level: 4 as const,
    title: 'Level 4 - Tidak Urgen',
    description: 'Warna Putih - Kondisi stabil',
    tone: 'neutral' as const
  }
] as const

export const DEFAULT_IGD_QUICK_TRIAGE_CONDITION = 'l2-pain'

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
