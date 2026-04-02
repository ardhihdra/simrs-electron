import { Form, Card, Input, InputNumber, Button, Row, Col, Tooltip, Space } from 'antd'
import { PlusCircleOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { ItemOption } from '@renderer/components/organisms/ItemSelectorModal'

interface BhpNonPaketTabProps {
  modalForm: any
  isLoadingConsumableItems: boolean
  consumableItemOptions: ItemOption[]
  consumableItemMap: Map<number, any>
  stockByItemMap: Map<string, number>
  setItemSelectorState: (state: { open: boolean; onSelect?: (item: ItemOption) => void }) => void
}

export default function BhpNonPaketTab({
  modalForm,
  consumableItemMap,
  stockByItemMap,
  setItemSelectorState
}: BhpNonPaketTabProps) {

  const handleSelectItem = (name: number, item: ItemOption) => {
    // 1. Set the item ID
    modalForm.setFieldValue(['bhpList', name, 'itemId'], item.value)
    
    // 2. Derive unit/satuan logic
    const selectedItem = consumableItemMap.get(item.value)
    if (!selectedItem) return

    const rules = selectedItem.buyPriceRules || []
    let firstValidUnit = selectedItem.kodeUnit
    if (Array.isArray(rules) && rules.length > 0) {
      firstValidUnit = rules[0].unitCode
    }

    const currentSatuan = modalForm.getFieldValue(['bhpList', name, 'satuan'])
    const isValid =
      Array.isArray(rules) && rules.length > 0
        ? rules.some((r: any) => r.unitCode === currentSatuan)
        : currentSatuan === selectedItem.kodeUnit

    if (!currentSatuan || !isValid) {
      modalForm.setFieldValue(['bhpList', name, 'satuan'], firstValidUnit)
    }
  }

  const openSelector = (name: number) => {
    setItemSelectorState({
      open: true,
      onSelect: (item) => handleSelectItem(name, item)
    })
  }

  return (
    <Card size="small" title={<span className="font-semibold">BHP Non-Paket</span>}>
      <Form.List name="bhpList">
        {(fields, { add, remove }) => (
          <div className="flex flex-col gap-2">
            {fields.map(({ key, name, ...restField }) => (
              <Row key={key} gutter={8} align="top">
                <Col span={10}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.bhpList?.[name]?.itemId !== curr.bhpList?.[name]?.itemId}
                  >
                    {({ getFieldValue }) => {
                      const itemId = getFieldValue(['bhpList', name, 'itemId'])
                      const item = itemId ? consumableItemMap.get(Number(itemId)) : null
                      const displayLabel = item ? `${item.nama || item.kode}` : 'Cari Item...'
                      
                      return (
                        <Form.Item
                          {...restField}
                          name={[name, 'itemId']}
                          label={name === 0 ? <span className="font-bold">Item BHP</span> : undefined}
                          rules={[{ required: true, message: 'Pilih item BHP' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Button 
                            block 
                            style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onClick={() => openSelector(name)}
                          >
                            <span className="truncate">{displayLabel}</span>
                            <SearchOutlined className="text-gray-400" />
                          </Button>
                        </Form.Item>
                      )
                    }}
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.bhpList?.[name]?.itemId !== currentValues.bhpList?.[name]?.itemId ||
                      prevValues.bhpList?.[name]?.jumlah !== currentValues.bhpList?.[name]?.jumlah
                    }
                  >
                    {({ getFieldValue }) => {
                      const itemId = getFieldValue(['bhpList', name, 'itemId'])
                      const selectedItem = itemId ? consumableItemMap.get(Number(itemId)) : null
                      const stock =
                        stockByItemMap.get(selectedItem?.kode?.trim()?.toUpperCase() ?? '') || 0

                      return (
                        <Form.Item
                          {...restField}
                          name={[name, 'jumlah']}
                          label={name === 0 ? <span className="font-bold">Qty</span> : undefined}
                          rules={[
                            { required: true, message: 'Wajib' },
                            {
                              validator: async (_rule, value) => {
                                if (value === undefined || value === null) return
                                if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
                                  throw new Error('Harus > 0')
                                }
                                if (itemId && stock <= 0) {
                                  throw new Error('Stok Kosong')
                                }
                                if (itemId && Number(value) > stock) {
                                  throw new Error(`Maks ${stock}`)
                                }
                              }
                            }
                          ]}
                          style={{ marginBottom: 0 }}
                          validateStatus={itemId && stock <= 0 ? 'error' : undefined}
                          help={
                            itemId ? (
                              <div className="text-[10px] leading-tight flex justify-between">
                                <span style={{ color: stock <= 0 ? '#ff4d4f' : '#8c8c8c' }}>
                                  Stok: {stock}
                                </span>
                              </div>
                            ) : null
                          }
                        >
                          <InputNumber
                            min={1}
                            step={1}
                            precision={0}
                            className="w-full"
                            placeholder="Qty"
                          />
                        </Form.Item>
                      )
                    }}
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.bhpList?.[name]?.itemId !== currentValues.bhpList?.[name]?.itemId
                    }
                  >
                    {({ getFieldValue }) => {
                      const itemId = getFieldValue(['bhpList', name, 'itemId'])
                      const selectedItem = itemId ? consumableItemMap.get(Number(itemId)) : null
                      const rules = selectedItem?.buyPriceRules || []

                      let unitOptions: any[] = []
                      if (Array.isArray(rules) && rules.length > 0) {
                        unitOptions = rules.map((r: any) => ({
                          label: r.unitCode,
                          value: r.unitCode
                        }))
                      } else if (selectedItem?.kodeUnit) {
                        unitOptions = [{ label: selectedItem.kodeUnit, value: selectedItem.kodeUnit }]
                      }

                      return (
                        <Form.Item
                          {...restField}
                          name={[name, 'satuan']}
                          label={name === 0 ? <span className="font-bold">Satuan</span> : undefined}
                          style={{ marginBottom: 0 }}
                          rules={[{ required: true, message: 'Wajib' }]}
                        >
                          <Input readOnly value={getFieldValue(['bhpList', name, 'satuan'])} />
                        </Form.Item>
                      )
                    }}
                  </Form.Item>
                </Col>
                <Col span={2} className="text-center flex items-start pt-[5px] justify-center">
                  {name === 0 && <div className="h-[22px] w-full" />}
                  <Tooltip title="Hapus BHP">
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Tooltip>
                </Col>
              </Row>
            ))}

            <Button
              type="dashed"
              size="small"
              icon={<PlusCircleOutlined />}
              onClick={() => add({ jumlah: 1, includedInPaket: false })}
              className="mt-1"
            >
              Tambah BHP
            </Button>
          </div>
        )}
      </Form.List>
    </Card>
  )
}
