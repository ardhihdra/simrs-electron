import { Form, Card, Button, Select, Spin, Switch, InputNumber, Input, Row, Col } from 'antd'
import { PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons'

const { TextArea } = Input

interface PaketTindakanTabProps {
  modalForm: any
  token: any
  setSearchPaket: (value: string) => void
  isLoadingPaket: boolean
  paketOptions: any[]
  handlePaketEntryChange: (entryIndex: number, rawPaketId?: number) => void
  kelasOptions: Array<{ value: string; label: string }>
  tindakanOptions: any[]
  consumableItemOptions: any[]
  isLoadingConsumableItems: boolean
  consumableItemMap: Map<number, any>
  isLoadingPerformers: boolean
  performers: any[]
  roleLabelByCode: Map<string, string>
}

export default function PaketTindakanTab({
  modalForm,
  token,
  setSearchPaket,
  isLoadingPaket,
  paketOptions,
  handlePaketEntryChange,
  kelasOptions,
  tindakanOptions,
  consumableItemOptions,
  isLoadingConsumableItems,
  consumableItemMap,
  isLoadingPerformers,
  performers,
  roleLabelByCode
}: PaketTindakanTabProps) {
  return (
    <Card
      size="small"
      title={<span className="font-semibold">Paket Tindakan</span>}
      extra={
        <Button
          type="dashed"
          size="small"
          icon={<PlusCircleOutlined />}
          onClick={() =>
            (modalForm.getFieldValue('paketEntries') || []).length === 0
              ? modalForm.setFieldValue('paketEntries', [
                  {
                    paketCytoGlobal: false,
                    kelas: undefined,
                    tindakanList: [],
                    bhpList: [],
                    petugasList: []
                  }
                ])
              : modalForm.setFieldValue('paketEntries', [
                  ...(modalForm.getFieldValue('paketEntries') || []),
                  {
                    paketCytoGlobal: false,
                    kelas: undefined,
                    tindakanList: [],
                    bhpList: [],
                    petugasList: []
                  }
                ])
          }
        >
          Tambah Paket Tindakan
        </Button>
      }
    >
      <Form.List name="paketEntries">
        {(paketFields, { remove: removePaket }) => (
          <div className="flex flex-col gap-4">
            {paketFields.map((paketField, paketIndex) => (
              <Card
                key={paketField.key}
                size="small"
                className="border border-slate-200 "
                title={<span className="font-semibold">Paket #{paketIndex + 1}</span>}
                extra={
                  paketFields.length > 0 ? (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<MinusCircleOutlined />}
                      onClick={() => removePaket(paketField.name)}
                    >
                      Hapus Paket
                    </Button>
                  ) : null
                }
              >
                <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-3 md:items-end">
                  <Form.Item
                    {...paketField}
                    name={[paketField.name, 'paketId']}
                    label={<span className="font-bold">Pilih Paket Tindakan</span>}
                    rules={[{ required: true, message: 'Pilih paket tindakan' }]}
                  >
                    <Select
                      showSearch
                      allowClear
                      placeholder="Pilih paket tindakan..."
                      filterOption={false}
                      onSearch={(val) => setSearchPaket(val)}
                      loading={isLoadingPaket}
                      options={paketOptions}
                      onChange={(val) => handlePaketEntryChange(paketField.name, Number(val))}
                      notFoundContent={
                        isLoadingPaket ? <Spin size="small" /> : 'Paket tidak ditemukan'
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    {...paketField}
                    name={[paketField.name, 'kelas']}
                    label={<span className="font-bold">Kelas</span>}
                    rules={[{ required: true, message: 'Pilih kelas' }]}
                  >
                    <Select
                      placeholder="Pilih kelas..."
                      options={kelasOptions}
                      onChange={(selectedKelas) => {
                        const currentList =
                          modalForm.getFieldValue([
                            'paketEntries',
                            paketField.name,
                            'tindakanList'
                          ]) || []
                        modalForm.setFieldValue(
                          ['paketEntries', paketField.name, 'tindakanList'],
                          currentList.map((item: any) => ({
                            ...item,
                            kelas: selectedKelas ?? undefined
                          }))
                        )
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    {...paketField}
                    name={[paketField.name, 'paketCytoGlobal']}
                    label={<span className="font-bold">Cyto</span>}
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="Cyto"
                      unCheckedChildren="Tidak"
                      onChange={(checked) => {
                        const currentList =
                          modalForm.getFieldValue([
                            'paketEntries',
                            paketField.name,
                            'tindakanList'
                          ]) || []
                        modalForm.setFieldValue(
                          ['paketEntries', paketField.name, 'tindakanList'],
                          currentList.map((item: any) => ({
                            ...item,
                            cyto: checked
                          }))
                        )
                      }}
                    />
                  </Form.Item>
                </div>

                <Card
                  size="small"
                  className="mt-4!"
                  title={<span className="font-semibold">Daftar Tindakan Paket</span>}
                >
                  <Form.List name={[paketField.name, 'tindakanList']}>
                    {(tindakanFields) => (
                      <div className="flex flex-col gap-2">
                        {tindakanFields.length === 0 && (
                          <div className="text-xs" style={{ color: token.colorTextSecondary }}>
                            Pilih paket untuk memuat daftar tindakan paket.
                          </div>
                        )}
                        {tindakanFields.map(({ key, name, ...restField }) => (
                          <Row key={key} gutter={8} align="middle">
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'masterTindakanId']}
                                label={
                                  name === 0 ? (
                                    <span className="font-bold">Tindakan</span>
                                  ) : undefined
                                }
                                rules={[{ required: true, message: 'Pilih tindakan' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Select
                                  showSearch
                                  disabled
                                  options={tindakanOptions}
                                  placeholder="Tindakan paket"
                                />
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item
                                {...restField}
                                name={[name, 'jumlah']}
                                label={
                                  name === 0 ? <span className="font-bold">Jml</span> : undefined
                                }
                                rules={[{ required: true, message: 'Wajib' }]}
                                style={{ marginBottom: 0 }}
                              >
                                <InputNumber min={0.01} step={1} className="w-full" />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                name={[name, 'satuan']}
                                label={
                                  name === 0 ? <span className="font-bold">Satuan</span> : undefined
                                }
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="cth: kali" />
                              </Form.Item>
                            </Col>
                            <Col span={2} className="flex items-end pb-0.5 justify-center">
                              {name === 0 && <div className="h-[22px]" />}
                            </Col>
                          </Row>
                        ))}
                      </div>
                    )}
                  </Form.List>
                </Card>

                <Card
                  size="small"
                  className="mt-4!"
                  title={<span className="font-semibold">BHP Paket</span>}
                >
                  <Form.List name={[paketField.name, 'bhpList']}>
                    {(fields) => (
                      <div className="flex flex-col gap-2">
                        {fields.length === 0 && (
                          <div className="text-xs" style={{ color: token.colorTextTertiary }}>
                            Belum ada BHP. Isi jika tindakan paket membutuhkan barang habis pakai.
                          </div>
                        )}

                        {fields.map(({ key, name, ...restField }) => (
                          <Row key={key} gutter={8} align="middle">
                            <Col span={13}>
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
                                      'paketEntries',
                                      paketField.name,
                                      'bhpList',
                                      name,
                                      'satuan'
                                    ])
                                    if (!currentSatuan && selectedItem.kodeUnit) {
                                      modalForm.setFieldValue(
                                        [
                                          'paketEntries',
                                          paketField.name,
                                          'bhpList',
                                          name,
                                          'satuan'
                                        ],
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
                            <Col span={8}>
                              <Form.Item
                                {...restField}
                                name={[name, 'satuan']}
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="Satuan" />
                              </Form.Item>
                            </Col>
                          </Row>
                        ))}
                      </div>
                    )}
                  </Form.List>
                </Card>

                <Card
                  size="small"
                  className="mt-4!"
                  title={<span className="font-semibold">Tenaga Medis Pelaksana</span>}
                >
                  <Form.List name={[paketField.name, 'petugasList']}>
                    {(fields) => (
                      <div className="flex flex-col gap-2">
                        {fields.length === 0 && (
                          <div className="text-xs" style={{ color: token.colorTextTertiary }}>
                            Belum ada role tenaga medis dari komponen jasa tindakan pada kelas
                            terpilih.
                          </div>
                        )}
                        {fields.map(({ key, name, ...restField }) => (
                          <Row key={key} gutter={8} align="middle">
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'pegawaiId']}
                                label={
                                  name === 0 ? (
                                    <span className="font-bold">Nama Petugas</span>
                                  ) : undefined
                                }
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
                                    (option?.children as unknown as string)
                                      .toLowerCase()
                                      .includes(input.toLowerCase())
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
                                label={
                                  name === 0 ? (
                                    <span className="font-bold">Role / Peran</span>
                                  ) : undefined
                                }
                                style={{ marginBottom: 0 }}
                              >
                                <Input
                                  disabled
                                  value={
                                    roleLabelByCode.get(
                                      modalForm.getFieldValue([
                                        'paketEntries',
                                        paketField.name,
                                        'petugasList',
                                        name,
                                        'roleTenaga'
                                      ]) || ''
                                    ) ||
                                    modalForm.getFieldValue([
                                      'paketEntries',
                                      paketField.name,
                                      'petugasList',
                                      name,
                                      'roleTenaga'
                                    ]) ||
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

                <Form.Item
                  {...paketField}
                  name={[paketField.name, 'catatanTambahan']}
                  label={<span className="font-bold">Catatan</span>}
                  className="mt-4! mb-0"
                >
                  <TextArea rows={3} placeholder="Catatan tambahan tindakan paket..." />
                </Form.Item>
              </Card>
            ))}
          </div>
        )}
      </Form.List>
    </Card>
  )
}