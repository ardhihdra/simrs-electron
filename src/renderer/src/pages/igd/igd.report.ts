import dayjs from 'dayjs'

import { type IgdDailyReport } from './igd.data'

export type IgdDailyReportExportMetricRow = {
  metric: string
  value: string
  note?: string
}

export type IgdDailyReportExportShiftGroup = {
  shift: string
  timeRange: string
  totalPatients: string
  details: IgdDailyReportExportMetricRow[]
}

export function buildIgdDailyReportExportGroups(
  report: IgdDailyReport
): IgdDailyReportExportShiftGroup[] {
  return report.shiftTotals.map((shift) => ({
    shift: shift.label,
    timeRange: `${shift.startTime}-${shift.endTime}`,
    totalPatients: String(shift.totalPatients),
    details: [
      {
        metric: 'Total Pasien Datang',
        value: String(shift.totalPatients)
      },
      ...report.caseTypeSummary.map((item) => ({
        metric: item.label,
        value: item.value,
        note: item.note
      }))
    ]
  }))
}

export function buildIgdDailyReportExportTitle(report: IgdDailyReport): string {
  return `Laporan Harian IGD\nTanggal ${dayjs(report.date).format('DD/MM/YYYY')}\nTotal Pasien ${report.totalPatients}`
}

export function buildIgdDailyReportExportFileName(report: IgdDailyReport): string {
  return `laporan-igd-${report.date}`
}
