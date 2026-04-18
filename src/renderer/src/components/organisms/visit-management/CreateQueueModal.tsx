import VisitQueueForm from '@renderer/components/organisms/visit-management/VisitQueueForm'
import { PatientAttributes } from 'simrs-types'
import { Drawer } from 'antd'

export type CreateQueueModalProps = {
  open: boolean
  onClose: () => void
  patient?: PatientAttributes
  onSuccess?: () => void
  showDate?: boolean
}

const CreateQueueModal = ({
  open,
  onClose,
  patient,
  onSuccess,
  showDate = true
}: CreateQueueModalProps) => {
  return (
    <Drawer
      title={patient ? `Buat Antrian Pasien: ${patient.name}` : 'Buat Antrian'}
      width={600}
      open={open}
      onClose={onClose}
      maskClosable={false}
      destroyOnClose
      footer={null}
    >
      <VisitQueueForm
        patient={patient}
        showDate={showDate}
        showPatientLookup={false}
        onCancel={onClose}
        onSuccess={() => {
          onSuccess?.()
          onClose()
        }}
      />
    </Drawer>
  )
}

export default CreateQueueModal
