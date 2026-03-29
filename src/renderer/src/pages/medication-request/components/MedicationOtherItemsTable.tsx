import { Button, Form, Input, InputNumber, Select, Switch, Tag } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'

interface MedicationOtherItemsTableProps {
  form: any
  itemOptions: any[]
  itemLoading: boolean
  itemKodeMap: Map<number, string>
  signaOptions: any[]
  signaLoading: boolean
  batchOptionsMap: Map<string, any[]>
  batchLoadingMap: Map<string, boolean>
  batchSortModeMap: Map<string, boolean>
  setBatchSortModeMap: React.Dispatch<React.SetStateAction<Map<string, boolean>>>
  sortBatches: (batches: any[], rowKey: string) => any[]
  fetchBatchesForItem: (kodeItem: string, rowKey: string) => void
}

export const MedicationOtherItemsTable = ({
  form,
  itemOptions,
  itemLoading,
  itemKodeMap,
  signaOptions,
  signaLoading,
  batchOptionsMap,
  batchLoadingMap,
  batchSortModeMap,
  setBatchSortModeMap,
  sortBatches,
  fetchBatchesForItem
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Form.Item
                      {...restField}
                      name={[name, 'itemId']}
                      label="Nama Item"
                      rules={[{ required: true, message: 'Pilih item' }]}
                      className="mb-0"
                    >
                      <Select
                        options={itemOptions.filter((option) => option.categoryType === 'obat')}
                        placeholder="Pilih Item"
                        showSearch
                        optionFilterProp="label"
                        loading={itemLoading}
                        onChange={(itemId: number) => {
                          const kode = itemKodeMap.get(itemId)
                          if (kode) {
                            fetchBatchesForItem(kode, `otherItem-${name}`)
                          }
                          // reset batch selection
                          const otherItems = form.getFieldValue('otherItems') || []
                          if (otherItems[name]) {
                            otherItems[name].batchNumber = undefined
                            otherItems[name].expiryDate = undefined
                            form.setFieldsValue({ otherItems })
                          }
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'batchNumber']}
                      label={
                        <div className="flex items-center gap-2">
                          <span>Expire Date</span>
                          <Switch
                            size="small"
                            checked={batchSortModeMap.get(`otherItem-${name}`) ?? true}
                            onChange={(checked) => {
                              setBatchSortModeMap(prev => new Map(prev).set(`otherItem-${name}`, checked))
                            }}
                            checkedChildren="FEFO"
                            unCheckedChildren="FIFO"
                          />
                        </div>
                      }
                      className="mb-0"
                    >
                      <Select
                        placeholder="Pilih Expire Date"
                        loading={batchLoadingMap.get(`otherItem-${name}`) ?? false}
                        allowClear
                        onChange={(val: string | undefined) => {
                          const batches = batchOptionsMap.get(`otherItem-${name}`) ?? []
                          const found = batches.find((b) => b.batchNumber === val)
                          const otherItems = form.getFieldValue('otherItems') || []
                          if (otherItems[name]) {
                            if (val && val.toUpperCase() === 'NO-BATCH') {
                              otherItems[name].batchNumber = undefined
                              otherItems[name].expiryDate = undefined
                            } else {
                              otherItems[name].expiryDate = found?.expiryDate ?? undefined
                            }
                            form.setFieldsValue({ otherItems })
                          }
                        }}
                        options={sortBatches(batchOptionsMap.get(`otherItem-${name}`) ?? [], `otherItem-${name}`).map((b) => ({
                          label: `${b.expiryDate ? b.expiryDate : 'Tanpa Exp'} | Stok: ${b.availableStock}`,
                          value: b.batchNumber
                        }))}
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
                    <Form.Item name={[name, 'expiryDate']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item shouldUpdate={(prev, curr) => prev.otherItems?.[name]?.expiryDate !== curr.otherItems?.[name]?.expiryDate}>
                      {({ getFieldValue }) => {
                        const exp = getFieldValue(['otherItems', name, 'expiryDate'])
                        if (!exp) return null
                        return <Tag color="orange" className="mt-5">Expire: {exp}</Tag>
                      }}
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
