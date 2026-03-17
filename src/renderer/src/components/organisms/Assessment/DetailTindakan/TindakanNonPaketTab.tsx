import {
  Form,
  Card,
  Select,
  Input,
  InputNumber,
  Switch,
  Button,
  Row,
  Col,
  Tooltip,
  Spin
} from 'antd'
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'

const { TextArea } = Input

interface TindakanNonPaketTabProps {
  modalForm: any
  token: any
  kelasOptions: Array<{ value: string; label: string }>
  setSearchTindakan: (value: string) => void
  isLoadingMaster: boolean
  tindakanOptions: any[]
  isLoadingConsumableItems: boolean
  consumableItemOptions: any[]
  consumableItemMap: Map<number, any>
  isLoadingPerformers: boolean
  performers: any[]
  roleLabelByCode: Map<string, string>
}

export default function TindakanNonPaketTab({
  modalForm,
  token,
  kelasOptions,
  setSearchTindakan,
  isLoadingMaster,
  tindakanOptions,
  isLoadingConsumableItems,
  consumableItemOptions,
  consumableItemMap,
  isLoadingPerformers,
  performers,
  roleLabelByCode
}: TindakanNonPaketTabProps) {
  return (
    <>
      <Card size="small" title={<span className="font-semibold">Kelas Non-Paket</span>}>
        <Form.Item name="kelas" label={<span className="font-bold">Kelas</span>} className="mb-0">
          <Select placeholder="Pilih kelas..." options={kelasOptions} />
        </Form.Item>
      </Card>

      <Card size="small" title={<span className="font-semibold">Tindakan Non-Paket</span>}>
        <Form.List name="tindakanList">
          {(fields, { add, remove }) => (
            <div className="flex flex-col gap-2">
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={8} align="middle">
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, 'masterTindakanId']}
                      label={name === 0 ? <span className="font-bold">Tindakan</span> : undefined}
                      rules={[{ required: true, message: 'Pilih tindakan' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        allowClear
                        placeholder="Cari tindakan..."
                        filterOption={false}
                        onSearch={(val) => setSearchTindakan(val)}
                        loading={isLoadingMaster}
                        options={tindakanOptions}
                        onChange={() => {
                          const currentList = modalForm.getFieldValue('tindakanList') || []
                          if (currentList[name]) {
                            currentList[name].paketId = undefined
                            currentList[name].paketDetailId = undefined
                            modalForm.setFieldValue('tindakanList', [...currentList])
                          }
                        }}
                        notFoundContent={isLoadingMaster ? <Spin size="small" /> : 'Tindakan tidak ditemukan'}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={3}>
                    <Form.Item
                      {...restField}
                      name={[name, 'jumlah']}
                      label={name === 0 ? <span className="font-bold">Jml</span> : undefined}
                      rules={[{ required: true, message: 'Wajib' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={0.01} step={1} className="w-full" />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      {...restField}
                      name={[name, 'satuan']}
                      label={name === 0 ? <span className="font-bold">Satuan</span> : undefined}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="cth: kali" />
                    </Form.Item>
                  </Col>
                  <Col span={3}>
                    <Form.Item
                      {...restField}
                      name={[name, 'cyto']}
                      valuePropName="checked"
                      label={
                        name === 0 ? <span className="font-bold flex justify-center">Cyto</span> : undefined
                      }
                      style={{ marginBottom: 0 }}
                      className="flex items-center justify-center w-full"
                    >
                      <Switch size="small" checkedChildren="Cyto" unCheckedChildren="Tidak" />
                    </Form.Item>
                  </Col>
                  <Col span={2} className="flex items-end pb-0.5 justify-center">
                    {name === 0 && <div className="h-[22px]" />}
                    {fields.length > 1 && (
                      <Tooltip title="Hapus tindakan">
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        />
                      </Tooltip>
                    )}
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                size="small"
                icon={<PlusCircleOutlined />}
                onClick={() => add({ jumlah: 1 })}
                className="mt-2"
              >
                Tambah Tindakan
              </Button>
            </div>
          )}
        </Form.List>
      </Card>

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
                    <Form.Item {...restField} name={[name, 'satuan']} style={{ marginBottom: 0 }}>
                      <Input placeholder="Satuan" />
                    </Form.Item>
                  </Col>
                  <Col span={2} className="text-center">
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

      <Card size="small" title={<span className="font-semibold">Tenaga Medis Pelaksana</span>}>
        <Form.List name="petugasList">
          {(fields) => (
            <div className="flex flex-col gap-2">
              {fields.length === 0 && (
                <div className="text-xs" style={{ color: token.colorTextTertiary }}>
                  Belum ada role tenaga medis dari komponen jasa tindakan pada kelas terpilih.
                </div>
              )}
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={8} align="middle">
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, 'pegawaiId']}
                      label={name === 0 ? <span className="font-bold">Nama Petugas</span> : undefined}
                      rules={[{ required: true, message: 'Pilih petugas' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        allowClear
                        placeholder="Pilih tenaga medis..."
                        loading={isLoadingPerformers}
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {performers.map((p) => (
                          <Select.Option key={p.id} value={p.id}>
                            {p.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={9}>
                    <Form.Item
                      {...restField}
                      name={[name, 'roleTenaga']}
                      rules={[{ required: true, message: 'Role belum tersedia' }]}
                      style={{ display: 'none' }}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      label={name === 0 ? <span className="font-bold">Role / Peran</span> : undefined}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        disabled
                        value={
                          roleLabelByCode.get(modalForm.getFieldValue(['petugasList', name, 'roleTenaga']) || '') ||
                          modalForm.getFieldValue(['petugasList', name, 'roleTenaga']) ||
                          '-'
                        }
                      />
                    </Form.Item>
                  </Col>
                  <Col span={3} className="flex items-end pb-0.5">
                    {name === 0 && <div className="h-[22px]" />}
                  </Col>
                </Row>
              ))}
            </div>
          )}
        </Form.List>
      </Card>

      <Form.Item name="catatanTambahan" label={<span className="font-bold">Catatan Non-Paket</span>}>
        <TextArea rows={3} placeholder="Catatan tambahan tindakan..." />
      </Form.Item>
    </>
  )
}
