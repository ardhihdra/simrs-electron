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
