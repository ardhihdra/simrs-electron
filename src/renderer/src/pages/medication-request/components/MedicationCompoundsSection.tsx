import { Button, Form, Input, InputNumber, Select, Card } from 'antd'
import { MinusCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { ItemSelectorModal } from '@renderer/components/organisms/ItemSelectorModal'

interface MedicationCompoundsSectionProps {
  form: any
  itemOptions: any[]
  itemLoading: boolean
  itemKodeMap: Map<number, string>
  signaOptions: any[]
  signaLoading: boolean
}

export const MedicationCompoundsSection = ({
  form,
  itemOptions,
  itemLoading,
  signaOptions,
  signaLoading
}: MedicationCompoundsSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentRow, setCurrentRow] = useState<{ compoundIndex: number; itemIndex: number | null } | null>(null)

  const openModal = (compoundIndex: number, itemIndex: number | null = null) => {
    setCurrentRow({ compoundIndex, itemIndex })
    setIsModalOpen(true)
  }

  const handleSelect = (item: any, addFn?: (config: any) => void) => {
    if (currentRow) {
      const { compoundIndex, itemIndex } = currentRow
      const compounds = form.getFieldValue('compounds') || []

      if (itemIndex !== null) {
        // Update existing item in compound
        const updated = [...compounds]
        if (updated[compoundIndex]?.items) {
          updated[compoundIndex].items[itemIndex] = {
            ...updated[compoundIndex].items[itemIndex],
            itemId: item.value
          }
          form.setFieldsValue({ compounds: updated })
        }
      } else if (addFn) {
        // Add new item to compound
        addFn({ itemId: item.value, quantity: 0 })
      }
    }
    setIsModalOpen(false)
    setCurrentRow(null)
  }

  return (
    <div className="mt-8">
      <h3 className="font-semibold text-lg mb-4 text-gray-700">Daftar Obat Racikan</h3>
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
                className="bg-orange-50 border-orange-100 rounded-xl overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-2">
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
                    <Select
                      placeholder="Pilih Signa / Dosis Racikan"
                      options={signaOptions}
                      loading={signaLoading}
                      showSearch
                      mode="tags"
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    label="Jumlah Racikan"
                    className="mb-0"
                  >
                    <InputNumber<number> min={1} className="w-full" />
                  </Form.Item>
                  {/* <Form.Item
                    {...restField}
                    name={[name, 'quantityUnit']}
                    label="Satuan Racikan"
                    className="mb-0"
                  >
                    <Input placeholder="Contoh: bungkus, botol" />
                  </Form.Item> */}
                </div>

                <div className="pl-4 border-l-2 border-orange-200 ml-2">
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Komposisi:</p>
                  <Form.List name={[name, 'items']}>
                    {(subFields, subOpt) => (
                      <div className="space-y-2">
                        {subFields.map((subField) => {
                          const { key: subKey, ...subRestField } = subField

                          return (
                            <div key={`compoundItem-${subKey}`} className="flex gap-2 items-start flex-wrap bg-white/50 p-2 rounded-lg border border-orange-50">
                              <Form.Item
                                {...subRestField}
                                name={[subRestField.name, 'itemId']}
                                className="mb-0 flex-1"
                                label="Nama Obat"
                                rules={[{ required: true, message: 'Pilih obat' }]}
                              >
                                <Select
                                  options={itemOptions}
                                  placeholder="Pilih Obat atau klik Cari"
                                  showSearch
                                  optionFilterProp="label"
                                  loading={itemLoading}
                                  dropdownRender={(menu) => (
                                    <div>
                                      {menu}
                                      <div className="p-2 border-t text-center">
                                        <Button
                                          type="primary"
                                          size="small"
                                          icon={<SearchOutlined />}
                                          onClick={() => openModal(name, subRestField.name)}
                                          block
                                        >
                                          Pencarian Lanjut
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  allowClear
                                />
                              </Form.Item>
                              <Form.Item
                                {...subRestField}
                                name={[subRestField.name, 'quantity']}
                                className="mb-0 w-32"
                                label="Jumlah"
                                rules={[{ required: true, message: 'Wajib' }]}
                              >
                                <InputNumber placeholder="Jml" min={0} className="w-full" />
                              </Form.Item>
                              <Button
                                type="text"
                                danger
                                icon={<MinusCircleOutlined />}
                                onClick={() => subOpt.remove(subField.name)}
                                className="mt-8"
                              />
                            </div>
                          )
                        })}
                        <Button
                          type="dashed"
                          size="small"
                          onClick={() => openModal(name, null)}
                          icon={<PlusOutlined />}
                          className="mt-2"
                        >
                          Tambah Komposisi (Pencarian Lanjut)
                        </Button>

                        <ItemSelectorModal
                          open={isModalOpen && currentRow?.compoundIndex === name}
                          onCancel={() => {
                            setIsModalOpen(false)
                            setCurrentRow(null)
                          }}
                          onSelect={(item) => handleSelect(item, subOpt.add)}
                          itemOptions={itemOptions}
                          loading={itemLoading}
                        />
                      </div>
                    )}
                  </Form.List>
                </div>
              </Card>
            ))}
            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="large">
              Tambah Racikan Baru
            </Button>
          </div>
        )}
      </Form.List>
    </div>
  )
}

