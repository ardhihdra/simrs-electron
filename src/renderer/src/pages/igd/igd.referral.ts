import type { IgdDashboardPatient } from './igd.data'

export type IgdReferralPatientData = {
  patient: {
    id: string
    name: string
    medicalRecordNumber: string
  }
}

export type IgdReferralFormRenderProps = {
  encounterId: string
  patientId?: string
  patientData: IgdReferralPatientData
  variant?: 'standalone' | 'embedded'
  showHistory?: boolean
  title?: string
  defaultReferralType?: 'internal' | 'external'
  submitLabel?: string
  onSuccess: () => void | Promise<void>
}

export function buildIgdReferralPatientData(patient: IgdDashboardPatient): IgdReferralPatientData {
  return {
    patient: {
      id: patient.id,
      name: patient.name,
      medicalRecordNumber: patient.isTemporaryPatient
        ? patient.tempCode || patient.medicalRecordNumber || '-'
        : patient.medicalRecordNumber || '-'
    }
  }
}
