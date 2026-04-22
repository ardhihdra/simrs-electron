import {
  PatientInfoCard,
  type PatientInfoCardData
} from '@renderer/components/molecules/PatientInfoCard'
import { Modal } from 'antd'

interface PatientInfoModalProps {
  open: boolean
  onClose: () => void
  patientData?: PatientInfoCardData | null
}

export default function PatientInfoModal({ open, onClose, patientData }: PatientInfoModalProps) {
  return (
    <Modal
      open={open}
      width={720}
      footer={null}
      onCancel={onClose}
      centered
      styles={{
        content: {
          padding: 0
        }
      }}
    >
      {patientData ? (
        <PatientInfoCard
          patientData={patientData}
          sections={{ showAllergies: false, showIdentityNumber: false }}
        />
      ) : null}
    </Modal>
  )
}
