import { client } from '@renderer/utils/client'
import { App, Form, Input, Modal, Select } from 'antd'

interface DischargeModalProps {
  open: boolean
  record?: any
  onClose: () => void
  onSuccess: () => void
}

const DISCHARGE_OPTIONS = [
  { value: 'home', label: 'Pulang ke Rumah' },
  { value: 'alt-home', label: 'Rumah Keluarga/Lainnya' },
  { value: 'other-hcf', label: 'Fasilitas Kesehatan Lainnya' },
  { value: 'hosp', label: 'Hospice/Paliatif' },
  { value: 'long', label: 'Layanan Jangka Panjang' },
  { value: 'aadvice', label: 'Atas Permintaan Sendiri (APS)' },
  { value: 'exp', label: 'Meninggal' },
  { value: 'psy', label: 'RS Jiwa' },
  { value: 'rehab', label: 'Rehabilitasi' },
  { value: 'snf', label: 'Layanan Perawatan Mahir' },
  { value: 'oth', label: 'Lainnya' }
]

export default function DischargeModal({ open, record, onClose, onSuccess }: DischargeModalProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const dischargeMutation = client.registration.dischargeEncounter.useMutation()

  const handleOk = () => {
    form.submit()
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  const handleFinish = async (values: any) => {
    try {
      await dischargeMutation.mutateAsync({
        id: record.encounterId,
        dischargeDisposition: values.dischargeDisposition,
        dischargeNote: values.dischargeNote
      })
      message.success('Pasien berhasil dipulangkan')
      form.resetFields()
      onSuccess()
      onClose()
    } catch (error: any) {
      message.error(error.message || 'Gagal memulangkan pasien')
    }
  }

  return (
    <Modal
      title="Pulangkan Pasien"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={dischargeMutation.isPending}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <p>
          Pasien: <b>{record?.patientName}</b>
        </p>
        <Form.Item
          name="dischargeDisposition"
          label="Disposisi"
          rules={[{ required: true, message: 'Harap pilih disposisi' }]}
        >
          <Select placeholder="Pilih disposisi" allowClear options={DISCHARGE_OPTIONS} />
        </Form.Item>
        <Form.Item name="dischargeNote" label="Catatan Pulang">
          <Input.TextArea placeholder="Tambahkan catatan jika perlu" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
