export type IgdBedZoneName = 'Resusitasi' | 'Observasi' | 'Treatment' | 'Isolasi' | 'Holding'
export type IgdBedStatusName = 'available' | 'occupied' | 'cleaning'
export type IgdTriageLevel = 1 | 2 | 3 | 4 | 5

export const IGD_BED_ZONE_ORDER: IgdBedZoneName[] = ['Resusitasi', 'Observasi', 'Treatment', 'Isolasi', 'Holding']

export const IGD_BED_ZONE_DESCRIPTIONS: Record<IgdBedZoneName, string> = {
  Resusitasi: 'Zona untuk pasien kritis dan tindakan segera.',
  Observasi: 'Zona monitoring pasien yang perlu observasi lanjutan.',
  Treatment: 'Zona tindakan singkat dan stabilisasi non-resusitasi.',
  Isolasi: 'Zona khusus pasien dengan risiko penularan infeksi.',
  Holding: 'Zona tunggu pasien yang menunggu disposisi atau pemindahan.'
}

const IGD_BED_ZONE_TRIAGE_RANGE: Record<IgdBedZoneName, string> = {
  Resusitasi: 'L1-L2',
  Observasi: 'L3-L4',
  Treatment: 'L4-L5',
  Isolasi: 'L2-L4',
  Holding: 'L3-L5'
}

const IGD_ALLOWED_BED_ZONES_BY_TRIAGE: Record<IgdTriageLevel, IgdBedZoneName[]> = {
  1: ['Resusitasi'],
  2: ['Resusitasi', 'Isolasi'],
  3: ['Observasi', 'Isolasi'],
  4: ['Observasi', 'Treatment', 'Holding'],
  5: ['Treatment', 'Holding']
}

export function getZoneTriageRangeLabel(zone: IgdBedZoneName) {
  return IGD_BED_ZONE_TRIAGE_RANGE[zone]
}

export function getAllowedBedZonesForTriage(level?: IgdTriageLevel | null): IgdBedZoneName[] {
  if (!level) {
    return []
  }

  return IGD_ALLOWED_BED_ZONES_BY_TRIAGE[level]
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
