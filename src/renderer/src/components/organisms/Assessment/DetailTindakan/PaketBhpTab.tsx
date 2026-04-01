import { Form, Card, Select, InputNumber, Button, Row, Col, Spin, Collapse } from 'antd'
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'

interface PaketBhpTabProps {
  modalForm: any
  isLoadingPaketBhp: boolean
  isLoadingUnitList: boolean
  unitOptions: Array<{ value: string; label: string }>
  paketBhpOptions: any[]
  setSearchPaketBhp: (val: string) => void
  paketBhpCache: Record<number, any>
  isLoadingConsumableItems: boolean
  consumableItemOptions: any[]
  consumableItemMap: Map<number, any>
}

export default function PaketBhpTab({
  modalForm,
  isLoadingPaketBhp,
  isLoadingUnitList,
  unitOptions,
  paketBhpOptions,
  setSearchPaketBhp,
  paketBhpCache,
  isLoadingConsumableItems,
  consumableItemOptions,
  consumableItemMap
}: PaketBhpTabProps) {
  const handlePaketBhpChange = (value: number, namePath: number) => {
    const currentEntries = modalForm.getFieldValue('paketBhpEntries') || []
    if (!value) {
      currentEntries[namePath] = { paketBhpId: undefined, bhpList: [] }
      modalForm.setFieldValue('paketBhpEntries', [...currentEntries])
      return
    }

    const selectedPaket = paketBhpCache[value]
    if (selectedPaket) {
      const listBhp = Array.isArray(selectedPaket?.listBhp) ? selectedPaket.listBhp : []
      const mappedBhp = listBhp.map((bhp: any) => ({
        paketBhpDetailId: bhp.id,
        itemId: bhp.itemId,
        jumlah: Number(bhp.jumlahDefault ?? 1),
        satuan: bhp.satuan ?? undefined
      }))

      currentEntries[namePath] = {
        paketBhpId: value,
        bhpList: mappedBhp
      }
      modalForm.setFieldValue('paketBhpEntries', [...currentEntries])
    }
  }

  return (
    <Card
      size="small"
      title={<span className="font-semibold">Paket BHP</span>}
      extra={
        <Button
          type="dashed"
          size="small"
          icon={<PlusCircleOutlined />}
          onClick={() =>
            (modalForm.getFieldValue('paketBhpEntries') || []).length === 0
              ? modalForm.setFieldValue('paketBhpEntries', [{ bhpList: [] }])
              : modalForm.setFieldValue('paketBhpEntries', [
                  ...(modalForm.getFieldValue('paketBhpEntries') || []),
                  { bhpList: [] }
                ])
          }
        >
          Tambah Paket BHP
        </Button>
      }
    >
      <Form.List name="paketBhpEntries">
        {(fields, { remove }) => (
          <div className="flex flex-col gap-4">
            {fields.map(({ key, name, ...restField }) => (
              <Card
                key={key}
                size="small"
                className="border border-slate-200"
                title={<span className="font-semibold">Paket BHP #{name + 1}</span>}
                extra={
                  fields.length > 0 ? (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                    >
                      Hapus Paket
                    </Button>
                  ) : null
                }
                bodyStyle={{ padding: 12 }}
              >
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Form.Item
                      {...restField}
                      name={[name, 'paketBhpId']}
                      label={<span className="font-bold">Paket BHP</span>}
                      rules={[{ required: true, message: 'Pilih Paket BHP' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        allowClear
                        placeholder="Cari paket BHP..."
                        filterOption={false}
                        onSearch={(val) => setSearchPaketBhp(val)}
                        loading={isLoadingPaketBhp}
                        options={paketBhpOptions}
                        onChange={(val) => handlePaketBhpChange(val, name)}
                        notFoundContent={
                          isLoadingPaketBhp ? <Spin size="small" /> : 'Paket tidak ditemukan'
                        }
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Collapse
                      size="small"
                      items={[
                        {
                          key: '1',
                          label: <span className="font-semibold text-xs">Rincian Item BHP</span>,
                          children: (
                            <Form.List name={[name, 'bhpList']}>
                              {(bhpFields) => (
                                <div className="flex flex-col gap-2">
                                  {bhpFields.map(
                                    ({ key: bhpKey, name: bhpName, ...bhpRestField }) => (
                                      <Row key={bhpKey} gutter={8} align="middle">
                                        <Col span={10}>
                                          <Form.Item
                                            {...bhpRestField}
                                            name={[bhpName, 'itemId']}
                                            rules={[{ required: true, message: 'Wajib' }]}
                                            style={{ marginBottom: 0 }}
                                          >
                                            <Select
                                              showSearch
                                              placeholder="Pilih BHP"
                                              loading={isLoadingConsumableItems}
                                              options={consumableItemOptions}
                                              optionFilterProp="searchLabel"
                                              filterOption={(input, option) =>
                                                String(option?.searchLabel ?? '')
                                                  .toLowerCase()
                                                  .includes(input.toLowerCase())
                                              }
                                              onChange={(val) => {
                                                if (!val) return
                                                const selectedItem = consumableItemMap.get(
                                                  Number(val)
                                                )
                                                if (!selectedItem) return
                                                const currentSatuan = modalForm.getFieldValue([
                                                  'paketBhpEntries',
                                                  name,
                                                  'bhpList',
                                                  bhpName,
                                                  'satuan'
                                                ])
                                                if (!currentSatuan && selectedItem.kodeUnit) {
                                                  modalForm.setFieldValue(
                                                    [
                                                      'paketBhpEntries',
                                                      name,
                                                      'bhpList',
                                                      bhpName,
                                                      'satuan'
                                                    ],
                                                    selectedItem.kodeUnit
                                                  )
                                                }
                                              }}
                                            />
                                          </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                          <Form.Item
                                            {...bhpRestField}
                                            name={[bhpName, 'jumlah']}
                                            rules={[
                                              { required: true, message: 'Wajib' },
                                              {
                                                validator: async (_rule, value) => {
                                                  if (value === undefined || value === null) return
                                                  if (
                                                    !Number.isInteger(Number(value)) ||
                                                    Number(value) <= 0
                                                  ) {
                                                    throw new Error('Bulat > 0')
                                                  }
                                                }
                                              }
                                            ]}
                                            style={{ marginBottom: 0 }}
                                          >
                                            <InputNumber
                                              min={1}
                                              step={1}
                                              className="w-full"
                                              placeholder="Qty"
                                            />
                                          </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                          <Form.Item
                                            {...bhpRestField}
                                            name={[bhpName, 'satuan']}
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
                                        <Col span={2} className="text-center"></Col>
                                      </Row>
                                    )
                                  )}
                                </div>
                              )}
                            </Form.List>
                          )
                        }
                      ]}
                    />
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        )}
      </Form.List>
    </Card>
  )
}
