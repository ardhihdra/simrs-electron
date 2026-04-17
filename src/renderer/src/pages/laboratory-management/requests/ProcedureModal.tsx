import DetailTindakanForm from '@renderer/components/organisms/Assessment/DetailTindakan/DetailTindakanForm'
import { Modal } from 'antd'

interface ProcedureModalProps {
  open: boolean
  onClose: () => void
  encounterId?: string | null
  patientData?: any
}

export default function ProcedureModal({
  open,
  onClose,
  encounterId,
  patientData
}: ProcedureModalProps) {
  if (!encounterId) return null
  return (
    <Modal open={open} onCancel={onClose} title="Tambah Tindakan" centered width="80vw">
      <DetailTindakanForm encounterId={encounterId} patientData={patientData} />
    </Modal>
  )
}
