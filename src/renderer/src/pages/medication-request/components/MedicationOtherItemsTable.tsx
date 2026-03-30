import { Button, Form, Input, InputNumber, Select } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'

interface MedicationOtherItemsTableProps {
  form: any
  itemOptions: any[]
  itemLoading: boolean
  itemKodeMap: Map<number, string>
  signaOptions: any[]
  signaLoading: boolean
}

export const MedicationOtherItemsTable = ({
  itemOptions,
  itemLoading,
  signaOptions,
  signaLoading
}: MedicationOtherItemsTableProps) => {
  return (
    <div className="mt-8">
      <h3 className="font-semibold text-lg mb-4 text-gray-700">Obat dan Barang</h3>
      <Form.List name="otherItems">
        {(fields, { add, remove }) => (
          <div className="space-y-4">
            {fields.map(({ key, name, ...restField }) => (
              <div
                key={`otherItem-${key}`}
                className="flex gap-4 items-start bg-gray-50 p-4 rounded-xl relative group border border-gray-100"
              >
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Form.Item
                      {...restField}
                      name={[name, 'itemId']}
                      label="Nama Item"
                      rules={[{ required: true, message: 'Pilih item' }]}
                      className="mb-0"
                    >
                      <Select
                        options={itemOptions}
                        placeholder="Pilih Item"
                        showSearch
                        optionFilterProp="label"
                        loading={itemLoading}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      label="Jumlah"
                      className="mb-0"
                    >
                      <InputNumber<number> min={1} className="w-full" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'instruction']}
                      label="Signa / Dosis Racikan"
                      className="mb-0"
                    >
                      <Select
                        placeholder="Pilih Signa / Dosis Racikan"
                        options={signaOptions}
                        loading={signaLoading}
                        showSearch
                        mode="tags"
                      />
                    </Form.Item>
                  </div>
                  <div className="flex items-center gap-4">
                    <Form.Item
                      {...restField}
                      name={[name, 'note']}
                      label="Catatan"
                      className="mb-0 flex-1"
                    >
                      <Input placeholder="Catatan tambahan" />
                    </Form.Item>
                  </div>
                </div>
                {fields.length > 0 && (
                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => remove(name)}
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
