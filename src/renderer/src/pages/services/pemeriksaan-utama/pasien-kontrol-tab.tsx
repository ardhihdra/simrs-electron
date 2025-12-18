import { Form, DatePicker, Select, Input, Button, Divider } from 'antd'

const { TextArea } = Input

export const PasienKontrolTab = () => {
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
        <Form.Item label="Tanggal Control" name="tanggalControl">
          <DatePicker className="w-full" placeholder="Pilih Tanggal Control" />
        </Form.Item>

        <Form.Item label="Dokter" name="dokter">
          <Select placeholder="Pilih Dokter" allowClear />
        </Form.Item>

        <Form.Item label="Diagnosa Utama">
          <Input placeholder="J02 / Faringitis akut ( )" disabled />
        </Form.Item>

        <Form.Item label="Diagnosa Sekunder">
          <Input placeholder="Pilih Diagnosa Pada Tab Assessment" disabled />
        </Form.Item>

        <Form.Item label="Keterangan" name="keterangan">
          <TextArea rows={4} />
        </Form.Item>
      </Form>
      <Divider />
      <div className="flex justify-end">
        <Button type="primary">Simpan</Button>
      </div>
    </div>
  )
}
