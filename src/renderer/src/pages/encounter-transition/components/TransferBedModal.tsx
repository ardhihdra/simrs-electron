/**
 * TransferBedModal Component
 */

import { client } from '@renderer/utils/client'
import { Form, Input, Modal, Select } from 'antd'

interface TransferBedModalProps {
  visible: boolean
  loading: boolean
  onConfirm: (values: TransferBedFormValues) => void
  onCancel: () => void
}

export interface TransferBedFormValues {
  newRoomCodeId: string
  newBedCodeId: string
  newClassOfCareCodeId: string
  transferReason: string
  roomCodeId: string
}

export function TransferBedModal({ visible, loading, onConfirm, onCancel }: TransferBedModalProps) {
  const [form] = Form.useForm()

  // Use useQuery to fetch available beds using window.api
  const { data: availableBeds, isLoading: loadingBeds } = client.room.available.useQuery({
    paginated: false
  })
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onConfirm(values)
    } catch (error) {
      // Validation failed
    }
  }

  return (
    <Modal
      title="Pindah Kamar (Transfer Bed)"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="newBedCodeId"
          label="Pilih Bed Baru (Available)"
          rules={[{ required: true, message: 'Pilih Bed' }]}
        >
          <Select
            placeholder="Pilih Bed"
            loading={loadingBeds}
            showSearch
            optionFilterProp="label"
            onChange={(val, option: any) => {
              if (option && option.item) {
                const item = option.item
                form.setFieldsValue({
                  newRoomCodeId: item.room?.id, // Send UUID
                  newClassOfCareCodeId: item.room?.roomClassCodeId,
                  newBedCodeId: item.bed?.id, // Send UUID
                  roomCodeId: item.room?.roomCodeId
                })
              }
            }}
          >
            {availableBeds?.result?.map((item) => (
              <Select.Option
                key={item.bedId}
                value={item.bedId} // This is the UUID
                label={item.bed.bedCodeId}
                item={item} // Pass full item to option for onChange handler
              >
                {item.bed.bedCodeId} - {item.room.roomCodeId} ({item.room.roomClassCodeId})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* hide actual id */}
        <Form.Item
          name="newRoomCodeId"
          label="ID Ruangan Baru (Auto-filled)"
          rules={[{ required: true, message: 'ID Ruangan Wajib' }]}
          style={{ display: 'none' }}
        >
          <Input disabled placeholder="Auto-filled from Bed" />
        </Form.Item>

        {/* display code id */}
        <Form.Item
          name="roomCodeId"
          label="Ruangan Baru (Auto-filled)"
          rules={[{ required: true, message: 'ID Ruangan Wajib' }]}
        >
          <Input disabled placeholder="Auto-filled from Bed" />
        </Form.Item>

        <Form.Item
          name="newClassOfCareCodeId"
          label="Kelas Rawat (Auto-filled)"
          rules={[{ required: true, message: 'ID Kelas Rawat Wajib' }]}
        >
          <Input disabled placeholder="Auto-filled from Bed" />
        </Form.Item>

        <Form.Item
          name="transferReason"
          label="Alasan Pindah"
          initialValue="TRANSFER"
          rules={[{ required: true, message: 'Pilih alasan pindah' }]}
        >
          <Select>
            <Select.Option value="TRANSFER">Transfer Biasa</Select.Option>
            <Select.Option value="UPGRADE">Naik Kelas</Select.Option>
            <Select.Option value="DOWNGRADE">Turun Kelas</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}
