import { Button, Form, Input, InputNumber, Select, Space } from 'antd'
import { MinusCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { ItemSelectorModal } from '@renderer/components/organisms/ItemSelectorModal'

interface MedicationOtherItemsTableProps {
  form: any
  itemOptions: any[]
  itemLoading: boolean
  itemKodeMap: Map<number, string>
  signaOptions: any[]
  signaLoading: boolean
  onAddSigna: () => void
}

export const MedicationOtherItemsTable = ({
  form,
  itemOptions,
  itemLoading,
  signaOptions,
  signaLoading,
  onAddSigna = () => { console.warn('onAddSigna prop is missing in MedicationOtherItemsTable') }
}: MedicationOtherItemsTableProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentRowIndex, setCurrentRowIndex] = useState<number | null>(null)

  const openModal = (index: number | null = null) => {
    setCurrentRowIndex(index)
    setIsModalOpen(true)
  }

  const handleSelect = (item: any, addFn?: (config: any) => void) => {
    if (currentRowIndex !== null) {
      // Update existing row
      const otherItems = form.getFieldValue('otherItems') || []
      const updated = [...otherItems]
      updated[currentRowIndex] = {
        ...updated[currentRowIndex],
        itemId: item.value
      }
      form.setFieldsValue({ otherItems: updated })
    } else if (addFn) {
      // Add new row
      addFn({ itemId: item.value, quantity: 1 })
    }
    setIsModalOpen(false)
    setCurrentRowIndex(null)
  }

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
                        placeholder="Pilih Item atau klik Cari"
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
                                onClick={() => openModal(name)}
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
                        dropdownRender={(menu) => (
                          <div>
                            {menu}
                            <div className="p-2 border-t text-center">
                              <Button
                                type="primary"
                                size="small"
                                icon={<PlusOutlined />}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  onAddSigna()
                                }}
                                block
                              >
                                Tambah Signa Baru
                              </Button>
                            </div>
                          </div>
                        )}
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
              <Button
                type="dashed"
                onClick={() => openModal(null)}
                block
                icon={<PlusOutlined />}
                size="large"
              >
                Tambah Item (Pencarian Lanjut)
              </Button>
            </Form.Item>

            <ItemSelectorModal
              open={isModalOpen}
              onCancel={() => setIsModalOpen(false)}
              onSelect={(item) => handleSelect(item, add)}
              itemOptions={itemOptions}
              loading={itemLoading}
            />
          </div>
        )}
      </Form.List>
    </div>
  )
}

