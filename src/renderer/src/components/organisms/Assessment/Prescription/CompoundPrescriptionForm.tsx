import { Button, Card, Form, Input, InputNumber, Select } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'

import { FormInstance } from 'antd'

interface CompoundPrescriptionFormProps {
  form: FormInstance<any>
  name?: string
  title?: React.ReactNode
  itemOptions: { label: string; value: number; [key: string]: any }[]
  rawMaterialOptions: { label: string; value: number; [key: string]: any }[]
  loading?: boolean
}

export const CompoundPrescriptionForm = ({
  form,
  name = 'compounds',
  title,
  itemOptions,
  rawMaterialOptions,
  loading
}: CompoundPrescriptionFormProps) => {
  return (
    <div className={title ? 'mt-8' : ''}>
      {title && <h3 className="font-semibold text-lg mb-4">{title}</h3>}
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <div className="space-y-6">
            {fields.map(({ key, name: fieldName, ...restField }) => (
              <Card
                key={`compound-${key}`}
                size="small"
                title={`Racikan ${fieldName + 1}`}
                extra={
                  <Button type="text" danger onClick={() => remove(fieldName)}>
                    Hapus
                  </Button>
                }
                className="bg-orange-50 border-orange-100"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <Form.Item
                    {...restField}
                    name={[fieldName, 'name']}
                    label="Nama Racikan"
                    rules={[{ required: true, message: 'Nama racikan wajib diisi' }]}
                    className="mb-0"
                  >
                    <Input placeholder="Contoh: Puyer Batuk Pilek" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[fieldName, 'dosageInstruction']}
                    label="Signa / Dosis Racikan"
                    rules={[{ required: true, message: 'Dosis racikan wajib diisi' }]}
                    className="mb-0"
                  >
                    <Input placeholder="Contoh: 3x1 Bungkus" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[fieldName, 'quantity']}
                    label="Jumlah Racikan"
                    className="mb-0"
                  >
                    <InputNumber<number> min={1} className="w-full" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[fieldName, 'quantityUnit']}
                    label="Satuan Racikan"
                    className="mb-0"
                  >
                    <Input placeholder="Contoh: bungkus, botol" />
                  </Form.Item>
                </div>

                <div className="pl-4 border-l-2 border-orange-200">
                  <p className="text-xs text-gray-500 mb-2 font-semibold">KOMPOSISI:</p>
                  <Form.List name={[fieldName, 'items']}>
                    {(subFields, subOpt) => (
                      <div className="space-y-2">
                        {subFields.map((subField) => {
                          const { key: subKey, ...subRestField } = subField

                          return (
                            <div key={`compoundItem-${subKey}`} className="flex gap-2 items-start">
                              <Form.Item
                                {...subRestField}
                                name={[subRestField.name, 'itemId']}
                                className="mb-0 flex-1"
                                rules={[{ required: true, message: 'Pilih obat' }]}
                              >
                                <Select
                                  options={itemOptions.filter(
                                    (option) => option.categoryType === 'obat'
                                  )}
                                  placeholder="Pilih Obat"
                                  showSearch
                                  optionFilterProp="label"
                                  loading={loading}
                                />
                              </Form.Item>
                              <Form.Item
                                {...subRestField}
                                name={[subRestField.name, 'quantity']}
                                className="mb-0 w-24"
                                rules={[{ required: true, message: 'Wajib' }]}
                              >
                                <InputNumber placeholder="Jml" min={0} className="w-full" />
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
            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
              Tambah Racikan Baru
            </Button>
          </div>
        )}
      </Form.List>
    </div>
  )
}
