import { Form, Card, Select, Input, InputNumber, Button, Row, Col, Spin, Collapse } from 'antd'
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'

interface PaketBhpTabProps {
  modalForm: any
  isLoadingPaketBhp: boolean
  paketBhpOptions: any[]
  setSearchPaketBhp: (val: string) => void
  paketBhpCache: Record<number, any>
  isLoadingConsumableItems: boolean
  consumableItemOptions: any[]
  consumableItemMap: Map<number, any>
  stockByItemMap: Map<string, number>
}

export default function PaketBhpTab({
  modalForm,
  isLoadingPaketBhp,
  paketBhpOptions,
  setSearchPaketBhp,
  paketBhpCache,
  isLoadingConsumableItems,
  consumableItemOptions,
  consumableItemMap,
  stockByItemMap
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
      const mappedBhp = listBhp.map((bhp: any) => {
        const item = consumableItemMap.get(Number(bhp.itemId))
        const rules = item?.buyPriceRules || []
        let unit = bhp.satuan
        if (!unit && Array.isArray(rules) && rules.length > 0) {
          unit = rules[0].unitCode
        } else if (!unit && item?.kodeUnit) {
          unit = item.kodeUnit
        }

        return {
          paketBhpDetailId: bhp.id,
          itemId: bhp.itemId,
          jumlah: Number(bhp.jumlahDefault ?? 1),
          satuan: unit
        }
      })

      currentEntries[namePath] = {
        paketBhpId: value,
        bhpList: mappedBhp,
        jumlah: 1
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
                <Row gutter={[8, 16]}>
                  <Col span={19}>
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
                  <Col span={5}>
                    <Form.Item
                      {...restField}
                      name={[name, 'jumlah']}
                      label={<span className="font-bold">Qty Paket</span>}
                      rules={[{ required: true, message: 'Wajib' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={1} placeholder="Qty" className="w-full" />
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
                                      <Form.Item
                                        key={bhpKey}
                                        noStyle
                                        shouldUpdate={(prev, curr) =>
                                          prev.paketBhpEntries?.[name]?.bhpList?.[bhpName] !==
                                            curr.paketBhpEntries?.[name]?.bhpList?.[bhpName] ||
                                          prev.paketBhpEntries?.[name]?.jumlah !==
                                            curr.paketBhpEntries?.[name]?.jumlah
                                        }
                                      >
                                        {({ getFieldValue }) => {
                                          const entry = getFieldValue(['paketBhpEntries', name])
                                          const pkgJumlah = Number(entry?.jumlah || 1)
                                          const itemId = getFieldValue([
                                            'paketBhpEntries',
                                            name,
                                            'bhpList',
                                            bhpName,
                                            'itemId'
                                          ])
                                          const baseJumlah = getFieldValue([
                                            'paketBhpEntries',
                                            name,
                                            'bhpList',
                                            bhpName,
                                            'jumlah'
                                          ])
                                          const jumlahTotal = Number(baseJumlah || 0) * pkgJumlah

                                          const satuan = getFieldValue([
                                            'paketBhpEntries',
                                            name,
                                            'bhpList',
                                            bhpName,
                                            'satuan'
                                          ])
                                          const item = itemId
                                            ? consumableItemMap.get(Number(itemId))
                                            : null
                                          const stock = item?.kode
                                            ? stockByItemMap.get(item.kode.trim().toUpperCase())
                                            : 0

                                          return (
                                            <div className="border-b border-slate-50 last:border-0 pb-1 mb-1">
                                              <Row gutter={8} align="middle">
                                                <Col span={14}>
                                                  <span className="text-sm font-medium">
                                                    {item?.nama || 'Item tidak ditemukan'}
                                                  </span>
                                                </Col>
                                                <Col span={4} className="text-right">
                                                  <span className="text-sm font-bold text-blue-600">
                                                    {jumlahTotal}
                                                  </span>
                                                </Col>
                                                <Col span={6}>
                                                  <span className="text-xs text-slate-500">
                                                    {satuan}
                                                  </span>
                                                  {stock !== undefined && (
                                                    <span
                                                      className="ml-2 text-[10px]"
                                                      style={{
                                                        color: stock <= 0 ? '#f5222d' : '#8c8c8c'
                                                      }}
                                                    >
                                                      (Stok: {stock})
                                                    </span>
                                                  )}
                                                </Col>
                                              </Row>
                                              {/* Hidden fields for form submission */}
                                              <Form.Item
                                                {...bhpRestField}
                                                name={[bhpName, 'itemId']}
                                                hidden
                                              >
                                                <Input />
                                              </Form.Item>
                                              <Form.Item
                                                {...bhpRestField}
                                                name={[bhpName, 'jumlah']}
                                                hidden
                                              >
                                                <Input />
                                              </Form.Item>
                                              <Form.Item
                                                {...bhpRestField}
                                                name={[bhpName, 'satuan']}
                                                hidden
                                              >
                                                <Input />
                                              </Form.Item>
                                              <Form.Item
                                                {...bhpRestField}
                                                name={[bhpName, 'paketBhpDetailId']}
                                                hidden
                                              >
                                                <Input />
                                              </Form.Item>
                                            </div>
                                          )
                                        }}
                                      </Form.Item>
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
