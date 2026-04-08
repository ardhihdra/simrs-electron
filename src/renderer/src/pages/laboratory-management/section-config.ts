export type AncillaryCategory = 'LABORATORY' | 'RADIOLOGY'
export type AncillarySection = 'laboratory' | 'radiology'

export interface AncillarySectionConfig {
  section: AncillarySection
  category: AncillaryCategory
  routeBase: string
  menuLabel: string
  queueTitle: string
  queueSubtitle: string
  queueCreateLabel: string
  requestsTitle: string
  requestsSubtitle: string
  requestsExportTitle: string
  resultsTitle: string
  resultsSubtitle: string
  resultsExportTitle: string
  reportsTitle: string
  reportsSubtitle: string
  reportsExportTitle: string
  printTitle: string
  printSubtitle: string
  printEmptyMessage: string
  printFootnote: string
}

const ANCILLARY_SECTION_CONFIG: Record<AncillarySection, AncillarySectionConfig> = {
  laboratory: {
    section: 'laboratory',
    category: 'LABORATORY',
    routeBase: '/dashboard/laboratory-management',
    menuLabel: 'Laboratorium',
    queueTitle: 'Antrian Laboratorium',
    queueSubtitle: 'Daftar encounter aktif dan pembuatan encounter laboratorium',
    queueCreateLabel: 'Registrasi Laboratorium Baru',
    requestsTitle: 'Permintaan Laboratorium',
    requestsSubtitle: 'Manajemen service request laboratorium per encounter',
    requestsExportTitle: 'Daftar Service Request Laboratorium',
    resultsTitle: 'Daftar Hasil Pemeriksaan Laboratorium',
    resultsSubtitle: 'Manajemen hasil pemeriksaan laboratorium',
    resultsExportTitle: 'Daftar Hasil Pemeriksaan Laboratorium',
    reportsTitle: 'Laporan Diagnostik Laboratorium',
    reportsSubtitle: 'Manajemen laporan diagnostik laboratorium',
    reportsExportTitle: 'Laporan Diagnostik Laboratorium',
    printTitle: 'Laboratory Report / Hasil Laboratorium',
    printSubtitle: 'laboratorium',
    printEmptyMessage: 'Tidak ada data pemeriksaan laboratorium',
    printFootnote:
      'Laporan ini dicetak otomatis dari sistem laboratorium dan valid tanpa tanda tangan basah.'
  },
  radiology: {
    section: 'radiology',
    category: 'RADIOLOGY',
    routeBase: '/dashboard/radiology-management',
    menuLabel: 'Radiologi',
    queueTitle: 'Antrian Radiologi',
    queueSubtitle: 'Daftar encounter aktif dan pembuatan encounter radiologi',
    queueCreateLabel: 'Registrasi Radiologi Baru',
    requestsTitle: 'Permintaan Radiologi',
    requestsSubtitle: 'Manajemen service request radiologi per encounter',
    requestsExportTitle: 'Daftar Service Request Radiologi',
    resultsTitle: 'Daftar Hasil Pemeriksaan Radiologi',
    resultsSubtitle: 'Manajemen hasil pemeriksaan radiologi',
    resultsExportTitle: 'Daftar Hasil Pemeriksaan Radiologi',
    reportsTitle: 'Laporan Diagnostik Radiologi',
    reportsSubtitle: 'Manajemen laporan diagnostik radiologi',
    reportsExportTitle: 'Laporan Diagnostik Radiologi',
    printTitle: 'Radiology Report / Hasil Radiologi',
    printSubtitle: 'radiologi',
    printEmptyMessage: 'Tidak ada data pemeriksaan radiologi',
    printFootnote:
      'Laporan ini dicetak otomatis dari sistem radiologi dan valid tanpa tanda tangan basah.'
  }
}

export function getAncillarySectionConfig(section: AncillarySection): AncillarySectionConfig {
  return ANCILLARY_SECTION_CONFIG[section]
}

export function getAncillarySectionConfigByCategory(
  category: AncillaryCategory
): AncillarySectionConfig {
  return category === 'RADIOLOGY'
    ? ANCILLARY_SECTION_CONFIG.radiology
    : ANCILLARY_SECTION_CONFIG.laboratory
}

export function resolveAncillarySectionFromPathname(pathname: string): AncillarySection {
  return pathname.startsWith(ANCILLARY_SECTION_CONFIG.radiology.routeBase)
    ? 'radiology'
    : 'laboratory'
}

export function resolveAncillaryRouteBase(pathname: string): string {
  return getAncillarySectionConfig(resolveAncillarySectionFromPathname(pathname)).routeBase
}
