import { Form, Card, Select, InputNumber, Button, Row, Col, Tooltip, Spin } from 'antd'
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'

interface BhpNonPaketTabProps {
  modalForm: any
  isLoadingUnitList: boolean
  unitOptions: Array<{ value: string; label: string }>
  isLoadingConsumableItems: boolean
  consumableItemOptions: any[]
  consumableItemMap: Map<number, any>
}

export default function BhpNonPaketTab({
  modalForm,
  isLoadingUnitList,
  unitOptions,
  isLoadingConsumableItems,
  consumableItemOptions,
  consumableItemMap
}: BhpNonPaketTabProps) {
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
                      filterOption={(input, option) =>
                        String(option?.searchLabel ?? '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      notFoundContent={
                        isLoadingConsumableItems ? <Spin size="small" /> : 'Item consumable tidak ditemukan'
                      }
                      onChange={(value) => {
                        if (!value) return
                        const selectedItem = consumableItemMap.get(Number(value))
                        if (!selectedItem) return

                        const currentSatuan = modalForm.getFieldValue(['bhpList', name, 'satuan'])
                        if (!currentSatuan && selectedItem.kodeUnit) {
                          modalForm.setFieldValue(['bhpList', name, 'satuan'], selectedItem.kodeUnit)
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={3}>
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
                            throw new Error('Harus bilangan bulat')
                          }
                        }
                      }
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber min={1} step={1} precision={0} className="w-full" placeholder="Qty" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item 
                    {...restField} 
                    name={[name, 'satuan']} 
                    label={name === 0 ? <span className="font-bold">Satuan</span> : undefined}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      showSearch
                      allowClear
                      loading={isLoadingUnitList}
                      options={unitOptions}
                      placeholder="Pilih satuan..."
                      optionFilterProp="label"
                    />
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
