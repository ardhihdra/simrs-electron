import { DatePicker, Form, Input, Modal, Select, TimePicker } from 'antd'

interface MpdnDischargeModalProps {
  visible: boolean
  loading: boolean
  onConfirm: (values: any) => void
  onCancel: () => void
}

export function MpdnDischargeModal({
  visible,
  loading,
  onConfirm,
  onCancel
}: MpdnDischargeModalProps) {
  const [form] = Form.useForm()

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onConfirm(values)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  return (
    <Modal
      title="MPDN Discharge (Meninggal)"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={700}
    >
      <Form form={form} layout="vertical">
        <div className="grid grid-cols-2 gap-4">
            <Form.Item name="dateOfDeath" label="Tanggal Meninggal" rules={[{ required: true }]}>
                <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item name="timeOfDeath" label="Jam Meninggal" rules={[{ required: true }]}>
                <TimePicker className="w-full" format="HH:mm" />
            </Form.Item>
        </div>

        <Form.Item name="maternalPeriod" label="Periode Maternal">
          <Select placeholder="Pilih Periode Maternal">
            <Select.Option value="1156679005">Maternal antenatal period</Select.Option>
            <Select.Option value="1156682000">Maternal intrapartum period</Select.Option>
            <Select.Option value="255410009">Maternal postpartum period</Select.Option>
          </Select>
        </Form.Item>

         <Form.Item name="description" label="Keterangan / Penyebab Tambahan">
            <Input.TextArea rows={3} />
         </Form.Item>

         {/* Add other MPDN fields as needed based on mpdn.ts constants */}
         <div className="grid grid-cols-2 gap-4">
            <Form.Item name="organizationType" label="Tipe Faskes">
                <Select placeholder="Pilih Tipe Faskes">
                     <Select.Option value="OT000006">Rumah Sakit Pemerintah</Select.Option>
                     <Select.Option value="OT000007">Rumah Sakit Swasta</Select.Option>
                </Select>
            </Form.Item>
            <Form.Item name="locationType" label="Lokasi Meninggal">
                 <Select placeholder="Pilih Lokasi">
                     <Select.Option value="264362003">Rumah</Select.Option>
                     <Select.Option value="LT000009">Dalam Perjalanan</Select.Option>
                </Select>
            </Form.Item>
         </div>

      </Form>
    </Modal>
  )
}
