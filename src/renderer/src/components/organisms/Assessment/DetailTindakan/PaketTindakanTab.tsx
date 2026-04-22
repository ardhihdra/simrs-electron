/**
 * Purpose: Tab input paket tindakan pada DetailTindakanForm untuk pilih paket, tampilkan tindakan/BHP bawaan, dan isi petugas.
 * Main callers: DetailTindakanForm.
 * Key dependencies: antd Form.List/Modal/Table, SelectKelasTarif, AutoRolePetugasListCard, cache master tindakan & item.
 * Main/public functions: PaketTindakanTab.
 * Side effects: update state form antd (`paketEntries`) termasuk paketId/masterTindakanId, bhp itemId, kelas, cyto, petugas, dan trigger modal pemilihan paket.
 */
import { Form, Card, Button, Select, Spin, Switch, InputNumber, Input, Row, Col, Modal, Table } from 'antd'
import AutoRolePetugasListCard from './AutoRolePetugasListCard'
import { PlusCircleOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { ItemOption } from '@renderer/components/organisms/ItemSelectorModal'
import { MasterTindakanItem } from '@renderer/hooks/query/use-master-tindakan'
import { SelectKelasTarif } from '@renderer/components/molecules/SelectKelasTarif'
import { useMemo, useState } from 'react'

const { TextArea } = Input

interface PaketTindakanTabProps {
  modalForm: any
  token: any
  setSearchPaket: (value: string) => void
  searchPaket?: string
  isLoadingPaket: boolean
  paketPagination?: {
    page: number
    pages: number
    count: number
    limit?: number
  }
  onPaketPageChange: (page: number, pageSize: number) => void
  paketKategoriOptions?: Array<{ label: string; value: string }>
  selectedPaketKategori?: string
  onPaketKategoriChange: (value?: string) => void
  paketKategoriBpjsOptions?: Array<{ label: string; value: string }>
  selectedPaketKategoriBpjs?: string
  onPaketKategoriBpjsChange: (value?: string) => void
  selectedPaketStatus?: string
  onPaketStatusChange: (value?: string) => void
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
  masterTindakanList: MasterTindakanItem[]
}

export default function PaketTindakanTab({
  modalForm,
  token,
  setSearchPaket,
  searchPaket,
  isLoadingPaket,
  paketPagination,
  onPaketPageChange,
  paketKategoriOptions,
  selectedPaketKategori,
  onPaketKategoriChange,
  paketKategoriBpjsOptions,
  selectedPaketKategoriBpjs,
  onPaketKategoriBpjsChange,
  selectedPaketStatus,
  onPaketStatusChange,
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
  const [paketSelectorState, setPaketSelectorState] = useState<{
    open: boolean
    targetIndex: number | null
  }>({
    open: false,
    targetIndex: null
  })
  const SATUAN_DEFAULT_OPTIONS = [
    { value: 'kali', label: 'Kali' },
    { value: 'usap', label: 'Usap' },
    { value: 'jahit', label: 'Jahit' }
  ]

  const masterTindakanMap = new Map(masterTindakanList.map(t => [t.id, t]))
  const tindakanOptionLabelById = new Map<number, string>(
    (Array.isArray(tindakanOptions) ? tindakanOptions : [])
      .map((option) => [Number(option?.value), String(option?.label || '').trim()] as const)
      .filter(([id, label]) => Number.isFinite(id) && id > 0 && Boolean(label))
  )
  const paketOptionLabelById = new Map<number, string>(
    (Array.isArray(paketOptions) ? paketOptions : [])
      .map((option) => [Number(option?.value), String(option?.label || '').trim()] as const)
      .filter(([id, label]) => Number.isFinite(id) && id > 0 && Boolean(label))
  )

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

  const openPaketSelector = (targetIndex: number) => {
    setPaketSelectorState({
      open: true,
      targetIndex
    })
  }

  const closePaketSelector = () => {
    setPaketSelectorState({
      open: false,
      targetIndex: null
    })
  }

  const paketSelectorRows = useMemo(
    () =>
      (Array.isArray(paketOptions) ? paketOptions : []).map((item) => ({
        value: Number(item?.value),
        label: String(item?.label || '').trim(),
        disabled: Boolean(item?.disabled)
      })),
    [paketOptions]
  )

  const selectPaketFromModal = (paketId: number) => {
    const targetIndex = Number(paketSelectorState.targetIndex)
    if (!Number.isFinite(targetIndex) || targetIndex < 0) return
    modalForm.setFieldValue(['paketEntries', targetIndex, 'paketId'], paketId)
    handlePaketEntryChange(targetIndex, paketId)
    closePaketSelector()
  }

  const buildSatuanOptions = (currentValue?: string | null) => {
    const baseOptions = [...SATUAN_DEFAULT_OPTIONS]
    const normalizedCurrent = String(currentValue || '').trim().toLowerCase()
    const exists = baseOptions.some((opt) => opt.value === normalizedCurrent)
    if (normalizedCurrent && !exists) {
      baseOptions.push({
        value: normalizedCurrent,
        label: `${String(currentValue).trim()} (Legacy)`
      })
    }
    return baseOptions
  }

  return (
    <>
      <Card
        size="small"
        title={<span className="font-semibold">Paket Tindakan</span>}
        extra={
          <Button
            type="dashed"
            size="small"
            icon={<PlusCircleOutlined />}
            onClick={() => {
              const currentEntries = modalForm.getFieldValue('paketEntries') || []
              const defaultKelas = modalForm.getFieldValue('kelas') || 'UMUM'
              modalForm.setFieldValue('paketEntries', [
                ...currentEntries,
                {
                  paketCytoGlobal: false,
                  kelas: defaultKelas,
                  tindakanList: [],
                  bhpList: [],
                  petugasList: []
                }
              ])
            }}
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
                      noStyle
                      shouldUpdate={(prev, curr) =>
                        prev.paketEntries?.[paketIndex]?.paketId !==
                        curr.paketEntries?.[paketIndex]?.paketId
                      }
                    >
                      {({ getFieldValue }) => {
                        const paketId = Number(getFieldValue(['paketEntries', paketIndex, 'paketId']))
                        const label =
                          paketOptionLabelById.get(paketId) ||
                          (Number.isFinite(paketId) && paketId > 0 ? `Paket ID ${paketId}` : '') ||
                          'Pilih paket tindakan...'

                        return (
                          <>
                            <Form.Item
                              {...paketField}
                              name={[paketField.name, 'paketId']}
                              rules={[{ required: true, message: 'Pilih paket tindakan' }]}
                              hidden
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item
                              label={<span className="font-bold">Pilih Paket Tindakan</span>}
                              className="mb-0"
                            >
                              <Button
                                block
                                style={{
                                  textAlign: 'left',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                                onClick={() => openPaketSelector(paketIndex)}
                              >
                                <span className="truncate">{label}</span>
                                <SearchOutlined className="text-gray-400" />
                              </Button>
                            </Form.Item>
                          </>
                        )
                      }}
                    </Form.Item>
                  <Form.Item
                    {...paketField}
                    name={[paketField.name, 'kelas']}
                    label={<span className="font-bold">Kelas</span>}
                    rules={[{ required: true, message: 'Pilih kelas' }]}
                  >
                    <SelectKelasTarif
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
                                  const rawId = getFieldValue([
                                    'paketEntries',
                                    paketIndex,
                                    'tindakanList',
                                    name,
                                    'masterTindakanId'
                                  ])
                                  const tindakanId = Number(rawId)
                                  const proc = Number.isFinite(tindakanId)
                                    ? masterTindakanMap.get(tindakanId)
                                    : null
                                  const displayLabel =
                                    tindakanOptionLabelById.get(tindakanId) ||
                                    (proc ? `${proc.namaTindakan} (${proc.kodeTindakan})` : '') ||
                                    'Item Tindakan...'
                                  
                                  return (
                                    <>
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'masterTindakanId']}
                                        rules={[{ required: true, message: 'Pilih tindakan' }]}
                                        hidden
                                      >
                                        <Input />
                                      </Form.Item>
                                      <Form.Item
                                        label={
                                          name === 0 ? (
                                            <span className="font-bold">Tindakan</span>
                                          ) : undefined
                                        }
                                        style={{ marginBottom: 0 }}
                                      >
                                        <Input readOnly value={displayLabel} size="small" />
                                      </Form.Item>
                                    </>
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
                                noStyle
                                shouldUpdate={(prev, curr) =>
                                  prev.paketEntries?.[paketIndex]?.tindakanList?.[name]?.satuan !==
                                  curr.paketEntries?.[paketIndex]?.tindakanList?.[name]?.satuan
                                }
                              >
                                {({ getFieldValue }) => {
                                  const currentSatuan = String(
                                    getFieldValue([
                                      'paketEntries',
                                      paketIndex,
                                      'tindakanList',
                                      name,
                                      'satuan'
                                    ]) || ''
                                  ).trim()

                                  return (
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'satuan']}
                                      label={
                                        name === 0 ? <span className="font-bold">Satuan</span> : undefined
                                      }
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Select
                                        showSearch
                                        placeholder="Pilih satuan..."
                                        options={buildSatuanOptions(currentSatuan)}
                                        optionFilterProp="label"
                                        filterOption={(input, option) =>
                                          (option?.label ?? '')
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                        }
                                      />
                                    </Form.Item>
                                  )
                                }}
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
                <AutoRolePetugasListCard
                  form={modalForm}
                  listName={[paketField.name, 'petugasList']}
                  valuePathPrefix={['paketEntries', paketField.name, 'petugasList']}
                  token={token}
                  performers={performers}
                  isLoadingPerformers={isLoadingPerformers}
                  roleLabelByCode={roleLabelByCode}
                  className="mt-4!"
                  />

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

      <Modal
        title="Pilih Paket Tindakan"
        open={paketSelectorState.open}
        onCancel={closePaketSelector}
        footer={null}
        width={860}
        destroyOnClose
      >
        <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <Select
            allowClear
            placeholder="Filter kategori paket"
            options={paketKategoriOptions || []}
            value={selectedPaketKategori}
            onChange={(value) => onPaketKategoriChange(value)}
          />
          <Select
            allowClear
            placeholder="Filter kategori BPJS"
            options={paketKategoriBpjsOptions || []}
            value={selectedPaketKategoriBpjs}
            onChange={(value) => onPaketKategoriBpjsChange(value)}
          />
          <Select
            allowClear
            placeholder="Filter status"
            value={selectedPaketStatus}
            onChange={(value) => onPaketStatusChange(value)}
            options={[
              { label: 'Aktif', value: 'active' },
              { label: 'Nonaktif', value: 'inactive' }
            ]}
          />
        </div>

        <div className="mb-3">
          <Input
            allowClear
            autoFocus
            prefix={<SearchOutlined />}
            placeholder="Cari paket tindakan..."
            value={searchPaket || ''}
            onChange={(event) => {
              const value = event.target.value
              setSearchPaket(value)
            }}
          />
        </div>

        <Table
          size="small"
          rowKey="value"
          loading={isLoadingPaket}
          dataSource={paketSelectorRows}
          pagination={{
            current: paketPagination?.page ?? 1,
            pageSize: paketPagination?.limit ?? 10,
            total: paketPagination?.count ?? 0,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total}`
          }}
          locale={{ emptyText: 'Paket tidak ditemukan' }}
          columns={[
            {
              title: 'Paket',
              dataIndex: 'label',
              key: 'label'
            },
            {
              title: 'Aksi',
              key: 'action',
              width: 100,
              render: (_, row: { value: number; disabled: boolean }) => (
                <Button
                  size="small"
                  type="primary"
                  disabled={row.disabled}
                  onClick={() => selectPaketFromModal(row.value)}
                >
                  Pilih
                </Button>
              )
            }
          ]}
          onChange={(tablePagination) => {
            onPaketPageChange(tablePagination.current ?? 1, tablePagination.pageSize ?? 10)
          }}
        />
      </Modal>
    </>
  )
}
