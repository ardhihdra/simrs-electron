import type {
    RegistrationAnalyticsData,
    RegistrationSummaryMetrics
} from '../types/dashboard-pendaftaran.types'

/**
 * Dummy summary metrics for Dashboard Pendaftaran.
 * Replace with real API calls when backend is ready.
 */
export const DUMMY_SUMMARY_METRICS: RegistrationSummaryMetrics = {
  totalPatientsToday: 148,
  newPatients: 23,
  returningPatients: 125,
  activeQueueCount: 34,
  averageWaitTimeMinutes: 22,
  waitTimeStatus: 'green',
  topClinic: {
    clinicName: 'Poli Umum',
    patientCount: 61
  },
  activeEncounterCount: 19
}

/**
 * Dummy analytics chart data for Dashboard Pendaftaran.
 * Replace with real API calls when backend is ready.
 */
export const DUMMY_ANALYTICS_DATA: RegistrationAnalyticsData = {
  patientsPerHour: [
    { hour: '07:00', patientCount: 4 },
    { hour: '08:00', patientCount: 18 },
    { hour: '09:00', patientCount: 31 },
    { hour: '10:00', patientCount: 27 },
    { hour: '11:00', patientCount: 22 },
    { hour: '12:00', patientCount: 9 },
    { hour: '13:00', patientCount: 14 },
    { hour: '14:00', patientCount: 11 },
    { hour: '15:00', patientCount: 8 },
    { hour: '16:00', patientCount: 4 }
  ],
  patientsPerClinic: [
    { clinicName: 'Poli Umum', patientCount: 61 },
    { clinicName: 'Poli Gigi', patientCount: 24 },
    { clinicName: 'Poli Anak', patientCount: 28 },
    { clinicName: 'Poli Kandungan', patientCount: 18 },
    { clinicName: 'Poli Bedah', patientCount: 11 },
    { clinicName: 'Poli Mata', patientCount: 6 }
  ],
  waitTimeTrend: [
    { hour: '07:00', averageWaitMinutes: 8 },
    { hour: '08:00', averageWaitMinutes: 15 },
    { hour: '09:00', averageWaitMinutes: 35 },
    { hour: '10:00', averageWaitMinutes: 42 },
    { hour: '11:00', averageWaitMinutes: 38 },
    { hour: '12:00', averageWaitMinutes: 22 },
    { hour: '13:00', averageWaitMinutes: 19 },
    { hour: '14:00', averageWaitMinutes: 17 },
    { hour: '15:00', averageWaitMinutes: 12 },
    { hour: '16:00', averageWaitMinutes: 9 }
  ],
  patientTypeRatio: [
    { type: 'Pasien Baru', count: 23 },
    { type: 'Pasien Lama', count: 125 }
  ],
  paymentMethodRatio: [
    { method: 'BPJS', count: 98 },
    { method: 'Umum', count: 39 },
    { method: 'Asuransi Swasta', count: 11 }
  ]
}
