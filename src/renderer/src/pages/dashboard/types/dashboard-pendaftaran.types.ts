/**
 * Type definitions for Dashboard Pendaftaran (Registration Dashboard).
 * All metrics are operational and intended for real-time monitoring.
 */

/** Summary card metric identifiers */
export type WaitTimeStatus = 'green' | 'yellow' | 'red'

/** Represents the 7 operational summary metrics */
export interface RegistrationSummaryMetrics {
  /** Total patients with an encounter today (new + returning) */
  totalPatientsToday: number
  /** Patients registered for the first time today (no prior medical record) */
  newPatients: number
  /** Returning patients visiting today (derived: totalPatientsToday - newPatients) */
  returningPatients: number
  /** Active queue count: WAITING + CALLED + ON_PROCESS */
  activeQueueCount: number
  /** Average waiting time in minutes today */
  averageWaitTimeMinutes: number
  /** Waiting time threshold status for color indicator */
  waitTimeStatus: WaitTimeStatus
  /** Clinic (poli) with the most encounters today */
  topClinic: TopClinicSummary
  /** Encounters currently in progress: ARRIVED + TRIAGED + IN_PROGRESS */
  activeEncounterCount: number
}

export interface TopClinicSummary {
  clinicName: string
  patientCount: number
}

/** Data point for patients-per-hour line chart */
export interface PatientsPerHourDataPoint {
  /** Hour label, e.g. "08:00" */
  hour: string
  patientCount: number
}

/** Data point for patients-per-clinic bar chart */
export interface PatientsPerClinicDataPoint {
  clinicName: string
  patientCount: number
}

/** Data point for average wait time per hour line chart */
export interface WaitTimeTrendDataPoint {
  hour: string
  /** Average wait time in minutes */
  averageWaitMinutes: number
}

/** Data point for new vs returning patients donut chart */
export interface PatientTypeRatioDataPoint {
  type: 'Pasien Baru' | 'Pasien Lama'
  count: number
}

/** Data point for BPJS vs Umum donut chart */
export interface PaymentMethodRatioDataPoint {
  method: 'BPJS' | 'Umum' | 'Asuransi Swasta'
  count: number
}

/** Aggregated chart data for the analytics section */
export interface RegistrationAnalyticsData {
  patientsPerHour: PatientsPerHourDataPoint[]
  patientsPerClinic: PatientsPerClinicDataPoint[]
  waitTimeTrend: WaitTimeTrendDataPoint[]
  patientTypeRatio: PatientTypeRatioDataPoint[]
  paymentMethodRatio: PaymentMethodRatioDataPoint[]
}
