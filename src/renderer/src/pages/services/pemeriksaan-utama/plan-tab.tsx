import { Form, Input, Select, Button, Divider } from 'antd'

const { TextArea } = Input

export const PlanTab = () => {
  const [form] = Form.useForm()

  return (
    <div className="p-4">
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        labelAlign="left"
        className="max-w-5xl"
      >
        <Form.Item label="Terapi Obat" name="terapiObat">
          <TextArea rows={4} placeholder="Contoh: obh syr 3 x 10ml" />
        </Form.Item>

        <Form.Item label="Saran / Anjuran" name="saranAnjuran">
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item label="Status Pasien Pulang" name="statusPasienPulang">
          <Select placeholder="Pilih Status" allowClear options={[]} />
        </Form.Item>
      </Form>
      <Divider />
      <div className="flex justify-end">
        <Button type="primary">Simpan</Button>
      </div>
    </div>
  )
}
