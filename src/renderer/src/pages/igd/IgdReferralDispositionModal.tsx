import { Modal } from 'antd'
import React from 'react'

import type { IgdDashboardPatient } from './igd.data'

type IgdReferralDispositionModalProps = {
  open: boolean
  encounterId: string
  patient: IgdDashboardPatient
  onCancel: () => void
  onReferralCreated: () => void | Promise<void>
  renderReferralForm?: (props: {
    encounterId: string
    patientId?: string
    patientData?: any
    onSuccess: () => void | Promise<void>
  }) => React.ReactElement | null
}

const LazyReferralForm = React.lazy(async () => {
  const module = await import('../../components/organisms/ReferralForm')
  return { default: module.ReferralForm }
})

export function buildIgdReferralPatientData(patient: IgdDashboardPatient) {
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

export function IgdReferralDispositionModal({
  open,
  encounterId,
  patient,
  onCancel,
  onReferralCreated,
  renderReferralForm
}: IgdReferralDispositionModalProps) {
  const referralFormProps = {
    encounterId,
    patientId: patient.id,
    patientData: buildIgdReferralPatientData(patient),
    onSuccess: onReferralCreated
  }

  return (
    <Modal
      title="Form Rujukan IGD"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1100}
      destroyOnClose
    >
      {renderReferralForm ? (
        renderReferralForm(referralFormProps)
      ) : (
        <React.Suspense fallback={null}>
          <LazyReferralForm {...referralFormProps} />
        </React.Suspense>
      )}
    </Modal>
  )
}
