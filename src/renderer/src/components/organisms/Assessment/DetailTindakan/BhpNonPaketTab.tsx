import { Form, Card, Select, Input, InputNumber, Button, Row, Col, Tooltip, Spin } from 'antd'
import { useEffect } from 'react'
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'

interface BhpNonPaketTabProps {
  modalForm: any
  isLoadingConsumableItems: boolean
  consumableItemOptions: any[]
  consumableItemMap: Map<number, any>
  stockByItemMap: Map<string, number>
}

export default function BhpNonPaketTab({
  modalForm,
  isLoadingConsumableItems,
  consumableItemOptions,
  consumableItemMap,
  stockByItemMap
}: BhpNonPaketTabProps) {
  useEffect(() => {
    try {
      console.log('[BHP-NONPAKET] isLoadingConsumableItems:', isLoadingConsumableItems)
      console.log('[BHP-NONPAKET] options count:', Array.isArray(consumableItemOptions) ? consumableItemOptions.length : 0)
      console.log('[BHP-NONPAKET] options preview:', (Array.isArray(consumableItemOptions) ? consumableItemOptions.slice(0, 5) : []))
      console.log('[BHP-NONPAKET] stock map size:', stockByItemMap?.size ?? 0)
    } catch (e) {
      console.log('[BHP-NONPAKET] debug error:', e)
    }
  }, [isLoadingConsumableItems, consumableItemOptions, stockByItemMap])

  return (
    <Card size="small" title={<span className="font-semibold">BHP Non-Paket</span>}>
      <Form.List name="bhpList">
        {(fields, { add, remove }) => (
          <div className="flex flex-col gap-2">
            {fields.map(({ key, name, ...restField }) => (
              <Row key={key} gutter={8} align="middle">
                <Col span={10}>
                  <Form.Item
                    {...restField}
                    name={[name, 'itemId']}
                    label={name === 0 ? <span className="font-bold">Item BHP</span> : undefined}
                    rules={[{ required: true, message: 'Pilih item BHP' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      showSearch
                      allowClear
                      placeholder="Pilih item BHP"
                      loading={isLoadingConsumableItems}
                      options={consumableItemOptions}
                      optionFilterProp="searchLabel"
                      dropdownStyle={{ minWidth: 400 }}
                      optionRender={(option) => (
                        <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {option.label}
                        </div>
                      )}
                      filterOption={(input, option) =>
                        String(option?.searchLabel ?? '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      notFoundContent={
                        isLoadingConsumableItems ? (
                          <Spin size="small" />
                        ) : (
                          'Item consumable tidak ditemukan'
                        )
                      }
                      onChange={(value) => {
                        try {
                          console.log('[BHP-NONPAKET] selected itemId:', value)
                        } catch { }
                        if (!value) {
                          modalForm.setFieldValue(['bhpList', name, 'satuan'], undefined)
                          return
                        }
                        const selectedItem = consumableItemMap.get(Number(value))
                        try {
                          const kode = String(selectedItem?.kode || '').trim().toUpperCase()
                          const stock = stockByItemMap.get(kode) || 0
                          console.log('[BHP-NONPAKET] selected item detail:', selectedItem)
                          console.log('[BHP-NONPAKET] selected item stock:', { kode, stock })
                        } catch { }
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
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={3}>
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
                              <span
                                style={{
                                  fontSize: 10,
                                  color: stock <= 0 ? '#ff4d4f' : '#666'
                                }}
                              >
                              </span>
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
                          <Select
                            placeholder="Satuan"
                            options={unitOptions}
                            disabled={!itemId || unitOptions.length === 0}
                          />
                        </Form.Item>
                      )
                    }}
                  </Form.Item>
                </Col>
                <Col span={2} className="text-center flex items-end pb-0.5 justify-center">
                  {name === 0 && <div className="h-[22px] w-full" />}
                  <Tooltip title="Hapus BHP">
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<MinusCircleOutlined />}
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
