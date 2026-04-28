/**
 * purpose: Aturan zonasi bed IGD berbasis level triase untuk filtering bed yang boleh dipilih saat registrasi/bed map.
 * main callers: `IgdRegistrasiPage`, `IgdBedMapPage`, dan util bed IGD lain di renderer.
 * key dependencies: Tidak ada; konstanta + fungsi pure.
 * main/public functions: `getZoneTriageRangeLabel`, `getAllowedBedZonesForTriage`, `filterAvailableBedsForTriage`.
 * side effects: Tidak ada; seluruh fungsi read-only/pure transform.
 */
export type IgdBedZoneName = 'Resusitasi' | 'Observasi' | 'Treatment'
export type IgdBedStatusName = 'available' | 'occupied' | 'cleaning'
export type IgdTriageLevel = number

export const IGD_BED_ZONE_ORDER: IgdBedZoneName[] = ['Resusitasi', 'Observasi', 'Treatment']

export const IGD_BED_ZONE_DESCRIPTIONS: Record<IgdBedZoneName, string> = {
  Resusitasi: 'Zona untuk pasien kritis dan tindakan segera.',
  Observasi: 'Zona monitoring pasien yang perlu observasi lanjutan.',
  Treatment: 'Zona tindakan singkat dan stabilisasi non-resusitasi.'
}

const IGD_BED_ZONE_TRIAGE_RANGE: Record<IgdBedZoneName, string> = {
  Resusitasi: 'L1-L2',
  Observasi: 'L3-L4',
  Treatment: 'L4-L5'
}

const IGD_ALLOWED_BED_ZONES_BY_TRIAGE: Partial<Record<IgdTriageLevel, IgdBedZoneName[]>> = {
  1: ['Resusitasi'],
  2: ['Resusitasi'],
  3: ['Observasi'],
  4: ['Observasi', 'Treatment'],
  5: ['Treatment']
}

export function getZoneTriageRangeLabel(zone: IgdBedZoneName) {
  return IGD_BED_ZONE_TRIAGE_RANGE[zone]
}

export function getAllowedBedZonesForTriage(level?: IgdTriageLevel | null): IgdBedZoneName[] {
  if (!level) {
    return []
  }

  return IGD_ALLOWED_BED_ZONES_BY_TRIAGE[level] ?? []
}

export function filterAvailableBedsForTriage<
  T extends { zone: IgdBedZoneName; status: IgdBedStatusName }
>(beds: T[], level?: IgdTriageLevel | null): T[] {
  const allowedZones = new Set(getAllowedBedZonesForTriage(level))

  if (allowedZones.size === 0) {
    return []
  }

  return beds.filter((bed) => bed.status === 'available' && allowedZones.has(bed.zone))
}
