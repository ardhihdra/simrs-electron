/**
 * DischargeModal Component
 */

import { Modal, Select, Typography } from 'antd'
import { DISCHARGE_OPTIONS } from '../types'

const { Text } = Typography

interface DischargeModalProps {
  visible: boolean
  loading: boolean
  selectedDisposition: string
  onDispositionChange: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function DischargeModal({
  visible,
  loading,
  selectedDisposition,
  onDispositionChange,
  onConfirm,
  onCancel
}: DischargeModalProps) {
  return (
    <Modal
      title="Pulangkan Pasien"
      open={visible}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Pulangkan"
      cancelText="Batal"
      confirmLoading={loading}
    >
      <div style={{ marginTop: 16 }}>
        <Text>Pilih disposisi pulang:</Text>
        <Select
          style={{ width: '100%', marginTop: 8 }}
          placeholder="Pilih disposisi..."
          value={selectedDisposition || undefined}
          onChange={onDispositionChange}
          options={[...DISCHARGE_OPTIONS]}
        />
      </div>
    </Modal>
  )
}
