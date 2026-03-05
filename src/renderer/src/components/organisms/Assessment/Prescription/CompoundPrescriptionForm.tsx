import { Button, Card, Form, Input, InputNumber, Select } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'

interface CompoundPrescriptionFormProps {
  form: any
  itemOptions: { label: string; value: number; [key: string]: any }[]
  rawMaterialOptions: { label: string; value: number }[]
  loading?: boolean
}

export const CompoundPrescriptionForm = ({
  form,
  itemOptions,
  rawMaterialOptions,
  loading
}: CompoundPrescriptionFormProps) => {
  return (
    <div className="space-y-6">
      <Form.List name="compounds">
        {(fields, { add, remove }) => (
          <div className="space-y-6">
            {fields.map(({ key, name, ...restField }) => (
              <Card
                key={`compound-${key}`}
                size="small"
                title={`Racikan ${name + 1}`}
                extra={
                  <Button type="text" danger onClick={() => remove(name)}>
                    Hapus
                  </Button>
                }
                className="bg-orange-50 border-orange-100"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <Form.Item
                    {...restField}
                    name={[name, 'name']}
                    label="Nama Racikan"
                    rules={[{ required: true, message: 'Nama racikan wajib diisi' }]}
                    className="mb-0"
                  >
                    <Input placeholder="Contoh: Puyer Batuk Pilek" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'dosageInstruction']}
                    label="Signa / Dosis Racikan"
                    rules={[{ required: true, message: 'Dosis racikan wajib diisi' }]}
                    className="mb-0"
                  >
                    <Input placeholder="Contoh: 3x1 Bungkus" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    label="Jumlah Racikan"
                    className="mb-0"
                  >
                    <InputNumber<number> min={1} className="w-full" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'quantityUnit']}
                    label="Satuan Racikan"
                    className="mb-0"
                  >
                    <Input placeholder="Contoh: bungkus, botol" />
                  </Form.Item>
                </div>

                <div className="pl-4 border-l-2 border-orange-200">
                  <p className="text-xs text-gray-500 mb-2 font-semibold">KOMPOSISI:</p>
                  <Form.List name={[name, 'items']}>
                    {(subFields, subOpt) => (
                      <div className="space-y-2">
                        {subFields.map((subField) => {
                          const { key: subKey, ...subRestField } = subField

                          return (
                            <div key={`compoundItem-${subKey}`} className="flex gap-2 items-start">
                              <Form.Item
                                {...subRestField}
                                name={[subRestField.name, 'sourceType']}
                                className="mb-0 w-32"
                                initialValue="medicine"
                              >
                                <Select
                                  options={[
                                    { label: 'Obat', value: 'medicine' },
                                    { label: 'Bahan Baku', value: 'substance' }
                                  ]}
                                />
                              </Form.Item>
                              <Form.Item shouldUpdate noStyle>
                                {() => {
                                  const compounds = form.getFieldValue('compounds')
                                  const compound = Array.isArray(compounds)
                                    ? compounds[name]
                                    : undefined
                                  const items = compound?.items || []
                                  const currentItem = items[subField.name] || {}
                                  const sourceType = currentItem.sourceType || 'medicine'

                                  if (sourceType === 'substance') {
                                    return (
                                      <Form.Item
                                        {...subRestField}
                                        name={[subRestField.name, 'rawMaterialId']}
                                        className="mb-0 flex-1"
                                        rules={[{ required: true, message: 'Pilih bahan baku' }]}
                                      >
                                        <Select
                                          options={rawMaterialOptions}
                                          placeholder="Pilih Bahan Baku"
                                          showSearch
                                          optionFilterProp="label"
                                          loading={loading}
                                        />
                                      </Form.Item>
                                    )
                                  }

                                  return (
                                    <Form.Item
                                      {...subRestField}
                                      name={[subRestField.name, 'itemId']}
                                      className="mb-0 flex-1"
                                      rules={[{ required: true, message: 'Pilih obat' }]}
                                    >
                                      <Select
                                        options={itemOptions}
                                        placeholder="Pilih Obat"
                                        showSearch
                                        optionFilterProp="label"
                                        loading={loading}
                                      />
                                    </Form.Item>
                                  )
                                }}
                              </Form.Item>
                              <Form.Item
                                {...subRestField}
                                name={[subRestField.name, 'quantity']}
                                className="mb-0 w-24"
                                rules={[{ required: true, message: 'Wajib' }]}
                              >
                                <InputNumber placeholder="Jml" min={0} className="w-full" />
                              </Form.Item>
                              <Form.Item
                                {...subRestField}
                                name={[subRestField.name, 'unit']}
                                className="mb-0 w-24"
                              >
                                <Input placeholder="Satuan" />
                              </Form.Item>
                              <Form.Item
                                {...subRestField}
                                name={[subRestField.name, 'note']}
                                className="mb-0 w-32"
                              >
                                <Input placeholder="Kekuatan (mg)" />
                              </Form.Item>
                              <Button
                                type="text"
                                danger
                                icon={<MinusCircleOutlined />}
                                onClick={() => subOpt.remove(subField.name)}
                              />
                            </div>
                          )
                        })}
                        <Button
                          type="dashed"
                          size="small"
                          onClick={() => subOpt.add()}
                          icon={<PlusOutlined />}
                        >
                          Tambah Komposisi
                        </Button>
                      </div>
                    )}
                  </Form.List>
                </div>
              </Card>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                className=""
              >
                Tambah Racikan Baru
              </Button>
            </Form.Item>
          </div>
        )}
      </Form.List>
    </div>
  )
}
