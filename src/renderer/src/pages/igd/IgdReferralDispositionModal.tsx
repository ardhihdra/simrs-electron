import { Modal } from 'antd'
import React from 'react'

import type { IgdDashboardPatient } from './igd.data'
import { buildIgdReferralPatientData, type IgdReferralFormRenderProps } from './igd.referral'

type IgdReferralDispositionModalProps = {
  open: boolean
  encounterId: string
  patient: IgdDashboardPatient
  onCancel: () => void
  onReferralCreated: () => void | Promise<void>
  renderReferralForm?: (props: IgdReferralFormRenderProps) => React.ReactElement | null
}

const LazyReferralForm = React.lazy(async () => {
  const module = await import('../../components/organisms/ReferralForm')
  return { default: module.ReferralForm }
})

export function IgdReferralDispositionModal({
  open,
  encounterId,
  patient,
  onCancel,
  onReferralCreated,
  renderReferralForm
}: IgdReferralDispositionModalProps) {
  return (
    <Modal
      title="Form Rujukan IGD"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1100}
      destroyOnHidden
    >
      <IgdReferralDispositionContent
        encounterId={encounterId}
        patient={patient}
        onReferralCreated={onReferralCreated}
        renderReferralForm={renderReferralForm}
      />
    </Modal>
  )
}

export function IgdReferralDispositionContent({
  encounterId,
  patient,
  onReferralCreated,
  renderReferralForm
}: Omit<IgdReferralDispositionModalProps, 'open' | 'onCancel'>) {
  const referralFormProps = {
    encounterId,
    patientId: patient.id,
    patientData: buildIgdReferralPatientData(patient),
    variant: 'embedded' as const,
    showHistory: false,
    title: 'Buat Rujukan',
    submitLabel: 'Buat Rujukan & Proses Disposition',
    onSuccess: onReferralCreated
  }

  return renderReferralForm ? (
    renderReferralForm(referralFormProps)
  ) : (
    <React.Suspense fallback={null}>
      <LazyReferralForm {...referralFormProps} />
    </React.Suspense>
  )
}
