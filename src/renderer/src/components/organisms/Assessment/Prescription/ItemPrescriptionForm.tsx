import { Button, Form, Input, InputNumber, Select } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'

interface ItemPrescriptionFormProps {
  name?: string
  title?: React.ReactNode
  itemOptions: { label: string; value: number; [key: string]: any }[]
  loading?: boolean
}

export const ItemPrescriptionForm = ({
  name = 'items',
  title,
  itemOptions,
  loading
}: ItemPrescriptionFormProps) => {
  return (
    <div className={title ? 'mt-8' : ''}>
      {title && <h3 className="font-semibold text-lg mb-4">{title}</h3>}
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <div className="space-y-4">
            {fields.map(({ key, name: fieldName, ...restField }) => (
              <div
                key={`item-${key}`}
                className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg relative group"
              >
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Form.Item
                      {...restField}
                      name={[fieldName, 'itemId']}
                      label="Nama Item"
                      rules={[{ required: true, message: 'Pilih item' }]}
                      className="mb-0"
                    >
                      <Select
                        options={itemOptions}
                        placeholder="Pilih Item"
                        showSearch
                        optionFilterProp="label"
                        loading={loading}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[fieldName, 'quantity']}
                      label="Jumlah"
                      className="mb-0"
                    >
                      <InputNumber<number> min={1} className="w-full" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[fieldName, 'instruction']}
                      label="Instruksi"
                      className="mb-0"
                    >
                      <Input placeholder="Instruksi penggunaan" />
                    </Form.Item>
                  </div>
                  <Form.Item
                    {...restField}
                    name={[fieldName, 'note']}
                    label="Catatan"
                    className="mb-0"
                  >
                    <Input placeholder="Catatan tambahan" />
                  </Form.Item>
                </div>
                {fields.length > 0 && (
                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => remove(fieldName)}
                    className="mt-8"
                  />
                )}
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
