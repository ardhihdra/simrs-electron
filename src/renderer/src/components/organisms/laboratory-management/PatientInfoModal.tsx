import {
  buildPatientSummary,
  type PatientInfoSource
} from '@renderer/pages/laboratory-management/table-info'
import { Descriptions, Modal } from 'antd'

interface PatientInfoModalProps {
  open: boolean
  onClose: () => void
  patient?: PatientInfoSource | null
  referenceDate?: string
}

function renderSummaryRows(rows: Array<{ label: string; value: string }>) {
  return (
    <div className="space-y-1 text-xs leading-relaxed">
      <Descriptions bordered column={1}>
        {rows.map((row) => (
          <Descriptions.Item key={row.label} label={row.label}>
            {row.value}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </div>
  )
}

export default function PatientInfoModal({
  open,
  onClose,
  patient,
  referenceDate
}: PatientInfoModalProps) {
  return (
    <Modal open={open} title="Data Pasien" width={640} footer={null} onCancel={onClose}>
      {renderSummaryRows(buildPatientSummary(patient, referenceDate))}
    </Modal>
  )
}
