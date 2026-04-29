import dayjs from 'dayjs'

import { IGD_BED_ZONE_ORDER } from './igd.bed-zoning'
import { type IgdDashboard, type IgdDashboardBedZone } from './igd.data'
import { formatIgdTriageLevel } from './igd.triage-level'

export type IgdBedReportExportDetailRow = {
  bedCode: string
  status: string
  patientName: string
  registrationNumber: string
  triageLevel: string
}

export type IgdBedReportExportZoneGroup = {
  zone: string
  totalBeds: string
  occupiedBeds: string
  availableBeds: string
  cleaningBeds: string
  details: IgdBedReportExportDetailRow[]
}

const BED_STATUS_LABELS: Record<string, string> = {
  occupied: 'Terisi',
  available: 'Kosong',
  cleaning: 'Pembersihan'
}

function buildZoneOrder(beds: IgdDashboard['beds']) {
  const knownZones = new Set<IgdDashboardBedZone>(IGD_BED_ZONE_ORDER)
  const extraZones = beds
    .map((bed) => bed.zone)
    .filter((zone): zone is IgdDashboardBedZone => !knownZones.has(zone))

  return [...IGD_BED_ZONE_ORDER, ...extraZones]
}

export function buildIgdBedReportExportGroups(
  dashboard: IgdDashboard
): IgdBedReportExportZoneGroup[] {
  const patientsById = new Map(dashboard.patients.map((patient) => [patient.id, patient]))

  return buildZoneOrder(dashboard.beds).map((zone) => {
    const zoneBeds = dashboard.beds.filter((bed) => bed.zone === zone)

    return {
      zone,
      totalBeds: String(zoneBeds.length),
      occupiedBeds: String(zoneBeds.filter((bed) => bed.status === 'occupied').length),
      availableBeds: String(zoneBeds.filter((bed) => bed.status === 'available').length),
      cleaningBeds: String(zoneBeds.filter((bed) => bed.status === 'cleaning').length),
      details: zoneBeds.map((bed) => {
        const patient = bed.patientId ? patientsById.get(bed.patientId) : undefined

        return {
          bedCode: bed.code,
          status: BED_STATUS_LABELS[bed.status] || bed.status,
          patientName: patient?.name || '-',
          registrationNumber:
            patient?.registrationNumber || patient?.medicalRecordNumber || patient?.encounterId || '-',
          triageLevel: patient ? formatIgdTriageLevel(patient.triageLevel) : '-'
        }
      })
    }
  })
}

export function buildIgdBedReportExportTitle(
  dashboard: IgdDashboard,
  reportDate: string = dayjs().format('YYYY-MM-DD')
): string {
  return `Laporan Bed IGD\nTanggal ${dayjs(reportDate).format('DD/MM/YYYY')}\nTotal Bed ${dashboard.beds.length}`
}

export function buildIgdBedReportExportFileName(
  reportDate: string = dayjs().format('YYYY-MM-DD')
): string {
  return `laporan-bed-igd-${reportDate}`
}
