import { Modal } from 'antd'
import { PatientFormComponent } from '@renderer/pages/patient/patient-form'

interface CreatePatientModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (data: any) => void
}

const CreatePatientModal = ({ open, onClose, onSuccess }: CreatePatientModalProps) => {
  return (
    <Modal
      title="Buat Pasien Baru"
      open={open}
      onCancel={onClose}
      footer={null} // Footer is handled by PatientFormComponent
      width={800}
      destroyOnClose
    >
      <PatientFormComponent 
        onSuccess={(data) => {
            onSuccess(data)
            onClose()
        }}
        onCancel={onClose}
      />
    </Modal>
  )
}

export default CreatePatientModal
