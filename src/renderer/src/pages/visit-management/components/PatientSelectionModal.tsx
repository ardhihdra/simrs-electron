import { usePatientList } from '@renderer/hooks/query/use-patient'
import { PatientAttributes } from '@shared/patient'
import { Modal } from 'antd'
import { useState } from 'react'
import { PatientSearch, PatientSearchFilter } from './PatientSearch'
import { PatientTable } from './PatientTable'

interface PatientSelectionModalProps {
  open: boolean
  onClose: () => void
  onSelect: (patient: PatientAttributes) => void
}

export const PatientSelectionModal = ({ open, onClose, onSelect }: PatientSelectionModalProps) => {
  const [filters, setFilters] = useState<PatientSearchFilter>({})
  const { data, isLoading } = usePatientList(filters)

  return (
    <Modal
      title="Pilih Pasien"
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnClose
    >
      <div className="py-4">
        <PatientSearch onSearch={setFilters} loading={isLoading} />
        <PatientTable
          dataSource={Array.isArray(data?.data) ? data.data : []}
          loading={isLoading}
          onRegister={(patient) => {
            onSelect(patient)
            onClose()
          }}
        />
      </div>
    </Modal>
  )
}
