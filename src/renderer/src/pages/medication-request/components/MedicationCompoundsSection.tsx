import { Button, Form, Input, InputNumber, Select, Switch, Tag, Card } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'

interface MedicationCompoundsSectionProps {
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

export const MedicationCompoundsSection = ({
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
}: MedicationCompoundsSectionProps) => {
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
                  <Form.Item
                    {...restField}
                    name={[name, 'quantityUnit']}
                    label="Satuan Racikan"
                    className="mb-0"
                  >
                    <Input placeholder="Contoh: bungkus, botol" />
                  </Form.Item>
                </div>

                <div className="pl-4 border-l-2 border-orange-200 ml-2">
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Komposisi:</p>
                  <Form.List name={[name, 'items']}>
                    {(subFields, subOpt) => (
                      <div className="space-y-2">
                        {subFields.map((subField) => {
                          const { key: subKey, ...subRestField } = subField
                          const compoundBatchKey = `compound-${name}-ing-${subRestField.name}`

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
                                  options={itemOptions.filter((option) => option.categoryType === 'obat')}
                                  placeholder="Pilih Obat"
                                  showSearch
                                  optionFilterProp="label"
                                  loading={itemLoading}
                                  onChange={(itemId: number) => {
                                    const kode = itemKodeMap.get(itemId)
                                    if (kode) {
                                      fetchBatchesForItem(kode, compoundBatchKey)
                                    }
                                  }}
                                />
                              </Form.Item>
                              <Form.Item
                                {...subRestField}
                                name={[subRestField.name, 'batchNumber']}
                                className="mb-0 w-56"
                                label={
                                  <div className="flex items-center gap-2">
                                    <span>Expire Date</span>
                                    <Switch
                                      size="small"
                                      checked={batchSortModeMap.get(compoundBatchKey) ?? true}
                                      onChange={(checked) => {
                                        setBatchSortModeMap(prev => new Map(prev).set(compoundBatchKey, checked))
                                      }}
                                      checkedChildren="FEFO"
                                      unCheckedChildren="FIFO"
                                    />
                                  </div>
                                }
                              >
                                <Select
                                  placeholder="Pilih Expire Date"
                                  loading={batchLoadingMap.get(compoundBatchKey) ?? false}
                                  allowClear
                                  onChange={(val: string | undefined) => {
                                    const batches = batchOptionsMap.get(compoundBatchKey) ?? []
                                    const found = batches.find((b) => b.batchNumber === val)
                                    const compounds = form.getFieldValue('compounds') || []
                                    
                                    if (compounds[name]?.items?.[subRestField.name]) {
                                      if (val && val.toUpperCase() === 'NO-BATCH') {
                                        compounds[name].items[subRestField.name].batchNumber = undefined
                                        compounds[name].items[subRestField.name].expiryDate = undefined
                                      } else {
                                        compounds[name].items[subRestField.name].expiryDate = found?.expiryDate ?? undefined
                                      }
                                      form.setFieldsValue({ compounds })
                                    }
                                  }}
                                  options={sortBatches(batchOptionsMap.get(compoundBatchKey) ?? [], compoundBatchKey).map((b) => ({
                                    label: `${b.expiryDate ? b.expiryDate : 'Tanpa Exp'} | Stok: ${b.availableStock}`,
                                    value: b.batchNumber
                                  }))}
                                />
                              </Form.Item>
                              <Form.Item name={[subRestField.name, 'expiryDate']} hidden>
                                <Input />
                              </Form.Item>
                              <Form.Item shouldUpdate={(prev, curr) => prev.compounds?.[name]?.items?.[subRestField.name]?.expiryDate !== curr.compounds?.[name]?.items?.[subRestField.name]?.expiryDate}>
                                {({ getFieldValue }) => {
                                  const exp = getFieldValue(['compounds', name, 'items', subRestField.name, 'expiryDate'])
                                  if (!exp) return null
                                  return <Tag color="orange" className="mt-5">Exp: {exp}</Tag>
                                }}
                              </Form.Item>
                              <Form.Item
                                {...subRestField}
                                name={[subRestField.name, 'quantity']}
                                className="mb-0 w-24"
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
                          onClick={() => subOpt.add()}
                          icon={<PlusOutlined />}
                          className="mt-2"
                        >
                          Tambah Komposisi
                        </Button>
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
