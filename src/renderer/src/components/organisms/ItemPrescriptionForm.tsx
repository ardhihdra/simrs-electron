import { Button, Form, Input, InputNumber, Select } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'

interface ItemPrescriptionFormProps {
  itemOptions: { label: string; value: number; [key: string]: any }[]
  loading?: boolean
}

export const ItemPrescriptionForm = ({ itemOptions, loading }: ItemPrescriptionFormProps) => {
  return (
    <div className="space-y-6">
      <Form.List name="items">
        {(fields, { add, remove }) => (
          <div className="space-y-6">
            {fields.map(({ key, name, ...restField }) => (
              <div
                key={`item-${key}`}
                className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg relative group border border-gray-200"
              >
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Form.Item
                      {...restField}
                      name={[name, 'itemId']}
                      label="Nama Item"
                      rules={[{ required: true, message: 'Pilih item' }]}
                      className="mb-0"
                    >
                      <Select
                        options={itemOptions}
                        placeholder="Pilih Item (Obat/Barang)"
                        showSearch
                        optionFilterProp="label"
                        loading={loading}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      label="Jumlah"
                      className="mb-0"
                      rules={[{ required: true, message: 'Wajib' }]}
                    >
                      <InputNumber<number> min={1} className="w-full" placeholder="Jml" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'instruction']}
                      label="Instruksi (Signa)"
                      className="mb-0"
                    >
                      <Input placeholder="Contoh: 3x1 sehari" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'note']}
                      label="Catatan"
                      className="mb-0"
                    >
                      <Input placeholder="Catatan tambahan" />
                    </Form.Item>
                  </div>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() => remove(name)}
                  className="mt-8"
                />
              </div>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Tambah Item
              </Button>
            </Form.Item>
          </div>
        )}
      </Form.List>
    </div>
  )
}
