import { Form, Card, Button, Select, Spin, Switch, InputNumber, Input, Row, Col } from 'antd'
import { PlusCircleOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { ItemOption } from '@renderer/components/organisms/ItemSelectorModal'
import { MasterTindakanItem } from '@renderer/hooks/query/use-master-tindakan'
import { ProcedureSelectorModal } from '@renderer/components/organisms/ProcedureSelectorModal'

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
  consumableItemOptions: ItemOption[]
  isLoadingConsumableItems: boolean
  consumableItemMap: Map<number, any>
  isLoadingPerformers: boolean
  performers: any[]
  roleLabelByCode: Map<string, string>
  setItemSelectorState: (state: { open: boolean; onSelect?: (item: ItemOption) => void }) => void
  setProcedureSelectorState: (state: { open: boolean; onSelect?: (item: MasterTindakanItem) => void }) => void
  masterTindakanList: MasterTindakanItem[]
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
  isLoadingConsumableItems,
  consumableItemMap,
  isLoadingPerformers,
  performers,
  roleLabelByCode,
  setItemSelectorState,
  masterTindakanList
}: PaketTindakanTabProps) {

  const masterTindakanMap = new Map(masterTindakanList.map(t => [t.id, t]))

  const handleSelectBhp = (paketName: number, bhpName: number, item: ItemOption) => {
    modalForm.setFieldValue(['paketEntries', paketName, 'bhpList', bhpName, 'itemId'], item.value)
    
    const selectedItem = consumableItemMap.get(item.value)
    if (!selectedItem) return

    const currentSatuan = modalForm.getFieldValue([
      'paketEntries',
      paketName,
      'bhpList',
      bhpName,
      'satuan'
    ])
    if (!currentSatuan && selectedItem.kodeUnit) {
      modalForm.setFieldValue(
        ['paketEntries', paketName, 'bhpList', bhpName, 'satuan'],
        selectedItem.kodeUnit
      )
    }
  }

  const openBhpSelector = (paketName: number, bhpName: number) => {
    setItemSelectorState({
      open: true,
      onSelect: (item) => handleSelectBhp(paketName, bhpName, item)
    })
  }

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
                      icon={<DeleteOutlined />}
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
                                noStyle
                                shouldUpdate={(prev, curr) => 
                                  prev.paketEntries?.[paketIndex]?.tindakanList?.[name]?.masterTindakanId !== 
                                  curr.paketEntries?.[paketIndex]?.tindakanList?.[name]?.masterTindakanId
                                }
                              >
                                {({ getFieldValue }) => {
                                  const id = getFieldValue(['paketEntries', paketIndex, 'tindakanList', name, 'masterTindakanId'])
                                  const proc = id ? masterTindakanMap.get(id) : null
                                  const displayLabel = proc ? `${proc.namaTindakan} (${proc.kodeTindakan})` : 'Item Tindakan...'
                                  
                                  return (
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
                                      <Input readOnly value={displayLabel} size="small" />
                                    </Form.Item>
                                  )
                                }}
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
                                <InputNumber min={0.01} step={1} className="w-full" size="small" />
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
                                <Input placeholder="cth: kali" size="small" />
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
                                noStyle
                                shouldUpdate={(prev, curr) => 
                                  prev.paketEntries?.[paketIndex]?.bhpList?.[name]?.itemId !== 
                                  curr.paketEntries?.[paketIndex]?.bhpList?.[name]?.itemId
                                }
                              >
                                {({ getFieldValue }) => {
                                  const id = getFieldValue(['paketEntries', paketIndex, 'bhpList', name, 'itemId'])
                                  const item = id ? consumableItemMap.get(Number(id)) : null
                                  const displayLabel = item ? `${item.nama || item.kode}` : 'Cari Item BHP...'

                                  return (
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'itemId']}
                                      rules={[{ required: true, message: 'Pilih item BHP' }]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Button 
                                        block 
                                        size="small"
                                        style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        onClick={() => openBhpSelector(paketIndex, name)}
                                      >
                                        <span className="truncate">{displayLabel}</span>
                                        <SearchOutlined className="text-gray-400" />
                                      </Button>
                                    </Form.Item>
                                  )
                                }}
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
                                <InputNumber min={1} step={1} precision={0} className="w-full" size="small" />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item
                                {...restField}
                                name={[name, 'satuan']}
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="Satuan" size="small" readOnly />
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
                                    String(option?.children ?? '')
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
