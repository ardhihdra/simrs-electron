import { useRef } from 'react'
import { Form, Card, Select, Input, InputNumber, Button, Row, Col, Spin, Tooltip } from 'antd'
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'

interface BhpListCardProps {
  listName: string | (string | number)[]
  token: any
  modalForm: any
  /** Absolute path prefix used to auto-fill satuan on item select, e.g. ['paketEntries', 0, 'bhpList'] */
  satuanPathPrefix: (string | number)[]
  consumableItemOptions: any[]
  isLoadingConsumableItems: boolean
  consumableItemMap: Map<number, any>
}

export default function BhpListCard({
  listName,
  token,
  modalForm,
  satuanPathPrefix,
  consumableItemOptions,
  isLoadingConsumableItems,
  consumableItemMap
}: BhpListCardProps) {
  const addRef = useRef<((defaultValue?: any) => void) | undefined>(undefined)

  return (
    <Card
      size="small"
      className="mt-4!"
      title={<span className="font-semibold">BHP Paket</span>}
      extra={
        <Button
          type="dashed"
          size="small"
          icon={<PlusCircleOutlined />}
          onClick={() => addRef.current?.({ jumlah: 1 })}
        >
          Tambah BHP
        </Button>
      }
    >
      <Form.List name={listName}>
        {(fields, { add, remove }) => {
          addRef.current = add
          return (
            <div className="flex flex-col gap-2">
              {fields.length === 0 && (
                <div className="text-xs" style={{ color: token.colorTextTertiary }}>
                  Belum ada BHP. Isi jika tindakan paket membutuhkan barang habis pakai.
                </div>
              )}
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={8} align="middle">
                  <Col span={12}>
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
                          isLoadingConsumableItems ? (
                            <Spin size="small" />
                          ) : (
                            'Item consumable tidak ditemukan'
                          )
                        }
                        onChange={(value) => {
                          if (!value) return
                          const selectedItem = consumableItemMap.get(Number(value))
                          if (!selectedItem) return
                          const currentSatuan = modalForm.getFieldValue([
                            ...satuanPathPrefix,
                            name,
                            'satuan'
                          ])
                          if (!currentSatuan && selectedItem.kodeUnit) {
                            modalForm.setFieldValue(
                              [...satuanPathPrefix, name, 'satuan'],
                              selectedItem.kodeUnit
                            )
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
                      <InputNumber min={1} step={1} precision={0} className="w-full" />
                    </Form.Item>
                  </Col>
                  <Col span={7}>
                    <Form.Item
                      {...restField}
                      name={[name, 'satuan']}
                      label={name === 0 ? <span className="font-bold">Satuan</span> : undefined}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="Satuan" />
                    </Form.Item>
                  </Col>
                  <Col span={2} className="flex items-end pb-0.5 justify-center">
                    {name === 0 && <div className="h-5.5" />}
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
            </div>
          )
        }}
      </Form.List>
    </Card>
  )
}
