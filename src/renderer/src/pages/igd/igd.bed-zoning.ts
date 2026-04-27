import type { IgdTriageLevel } from './igd.triage-level'

export type IgdBedZoneName = 'Resusitasi' | 'Observasi' | 'Tindakan' | 'Isolasi'
export type IgdBedStatusName = 'available' | 'occupied' | 'cleaning'

export const IGD_BED_ZONE_ORDER: IgdBedZoneName[] = ['Resusitasi', 'Observasi', 'Tindakan', 'Isolasi']

export const IGD_BED_ZONE_DESCRIPTIONS: Record<IgdBedZoneName, string> = {
  Resusitasi: 'Zona untuk pasien kritis dan tindakan segera.',
  Observasi: 'Zona monitoring pasien yang perlu observasi lanjutan.',
  Tindakan: 'Zona tindakan singkat dan stabilisasi non-resusitasi.',
  Isolasi: 'Zona khusus pasien dengan risiko penularan infeksi.'
}

const IGD_BED_ZONE_TRIAGE_RANGE: Record<IgdBedZoneName, string> = {
  Resusitasi: 'Semua level',
  Observasi: 'Semua level',
  Tindakan: 'Semua level',
  Isolasi: 'Semua level'
}

export function getZoneTriageRangeLabel(zone: IgdBedZoneName) {
  return IGD_BED_ZONE_TRIAGE_RANGE[zone]
}

export function getAllowedBedZonesForTriage(level?: IgdTriageLevel | null): IgdBedZoneName[] {
  void level
  return [...IGD_BED_ZONE_ORDER]
}

export function filterAvailableBedsForTriage<
  T extends { zone: IgdBedZoneName; status: IgdBedStatusName }
>(beds: T[], level?: IgdTriageLevel | null): T[] {
  void level
  return beds.filter((bed) => bed.status === 'available')
}
