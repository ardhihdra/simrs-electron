/**
 * Purpose: Tab input tindakan non-paket pada DetailTindakanForm.
 * Main callers: DetailTindakanForm.
 * Key dependencies: antd Form.List, SelectKelasTarif, AutoRolePetugasListCard, ProcedureSelectorModal state.
 * Main/public functions: TindakanNonPaketTab.
 * Side effects: update state form antd (`tindakanList`) dan trigger dialog pemilihan tindakan.
 */
import { Form, Card, Select, Input, InputNumber, Switch, Button, Row, Col, Tooltip } from 'antd'
import { PlusCircleOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { MasterTindakanItem } from '@renderer/hooks/query/use-master-tindakan'
import AutoRolePetugasListCard from './AutoRolePetugasListCard'
import { SelectKelasTarif } from '@renderer/components/molecules/SelectKelasTarif'

const { TextArea } = Input

interface TindakanNonPaketTabProps {
  modalForm: any
  token: any
  kelasOptions: Array<{ value: string; label: string }>
  setSearchTindakan: (value: string) => void
  isLoadingMaster: boolean
  tindakanOptions: any[]
  isLoadingPerformers: boolean
  performers: any[]
  roleLabelByCode: Map<string, string>
  setProcedureSelectorState: (state: {
    open: boolean
    mode?: 'select' | 'readonly'
    title?: string
    procedures?: MasterTindakanItem[]
    onSelect?: (item: MasterTindakanItem) => void
  }) => void
  masterTindakanList: MasterTindakanItem[]
  defaultKelas?: string
}

export default function TindakanNonPaketTab({
  modalForm,
  token,
  kelasOptions,
  isLoadingPerformers,
  performers,
  roleLabelByCode,
  setProcedureSelectorState,
  masterTindakanList,
  defaultKelas
}: TindakanNonPaketTabProps) {
  const masterTindakanMap = new Map(masterTindakanList.map((t) => [t.id, t]))

  const handleSelectProcedure = (index: number, proc: MasterTindakanItem) => {
    modalForm.setFieldValue(['tindakanList', index, 'masterTindakanId'], proc.id)
  }

  const openSelector = (index: number) => {
    setProcedureSelectorState({
      open: true,
      onSelect: (proc) => handleSelectProcedure(index, proc)
    })
  }

  return (
    <Card
      size="small"
      title={<span className="font-semibold">Tindakan Non-Paket</span>}
      extra={
        <Button
          type="dashed"
          size="small"
          icon={<PlusCircleOutlined />}
          onClick={() => {
            const currentList = modalForm.getFieldValue('tindakanList') || []
            const defaultKelas = modalForm.getFieldValue('kelas') || 'UMUM'
            modalForm.setFieldValue('tindakanList', [
              ...currentList,
              {
                kelas: defaultKelas,
                jumlah: 1,
                cyto: false,
                petugasList: []
              }
            ])
          }}
        >
          Tambah Tindakan Baru
        </Button>
      }
    >
      <Form.List name="tindakanList">
        {(fields, { remove }) => (
          <div className="flex flex-col gap-4">
            {fields.map((field, index) => (
              <Card
                key={`${field.key}-${index}`}
                size="small"
                className="border border-slate-200"
                title={<span className="font-semibold">Tindakan #{index + 1}</span>}
                extra={
                  fields.length > 0 ? (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    >
                      Hapus Tindakan
                    </Button>
                  ) : null
                }
              >
                <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-4 md:items-end">
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) =>
                      prev.tindakanList?.[index]?.masterTindakanId !==
                      curr.tindakanList?.[index]?.masterTindakanId
                    }
                  >
                    {({ getFieldValue }) => {
                      const id = getFieldValue(['tindakanList', index, 'masterTindakanId'])
                      const proc = id ? masterTindakanMap.get(id) : null
                      const displayLabel = proc
                        ? `${proc.namaTindakan} (${proc.kodeTindakan})`
                        : 'Cari Tindakan...'

                      return (
                        <Form.Item
                          {...field}
                          name={[field.name, 'masterTindakanId']}
                          label={<span className="font-bold">Pilih Tindakan</span>}
                          rules={[{ required: true, message: 'Pilih tindakan' }]}
                          className="col-span-1 md:col-span-2 mb-0"
                        >
                          <Button
                            block
                            style={{
                              textAlign: 'left',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onClick={() => openSelector(index)}
                          >
                            <span className="truncate">{displayLabel}</span>
                            <SearchOutlined className="text-gray-400" />
                          </Button>
                        </Form.Item>
                      )
                    }}
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'kelas']}
                    label={<span className="font-bold">Kelas</span>}
                    rules={[{ required: true, message: 'Pilih kelas' }]}
                    className="col-span-1 mb-0"
                  >
                    <SelectKelasTarif placeholder="Pilih kelas..." options={kelasOptions} />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'cyto']}
                    label={<span className="font-bold">Cyto</span>}
                    valuePropName="checked"
                    className="col-span-1 mb-0 text-center"
                  >
                    <Switch size="small" checkedChildren="Cyto" unCheckedChildren="Tidak" />
                  </Form.Item>
                </div>

                <Row gutter={12} className="mt-3">
                  <Col span={12}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'jumlah']}
                      label={<span className="font-bold">Jumlah (Qty)</span>}
                      rules={[{ required: true, message: 'Wajib' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={0.01} step={1} className="w-full" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'satuan']}
                      label={<span className="font-bold">Satuan</span>}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        placeholder="Pilih satuan..."
                        options={[
                          { value: 'kali', label: 'Kali' },
                          { value: 'usap', label: 'Usap' },
                          { value: 'jahit', label: 'Jahit' }
                        ]}
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <AutoRolePetugasListCard
                  form={modalForm}
                  listName={[field.name, 'petugasList']}
                  valuePathPrefix={['tindakanList', field.name, 'petugasList']}
                  token={token}
                  performers={performers}
                  isLoadingPerformers={isLoadingPerformers}
                  roleLabelByCode={roleLabelByCode}
                  emptyText="Role tenaga medis akan muncul otomatis setelah tindakan dan kelas dipilih."
                  className="mt-4!"
                />

                <Form.Item
                  {...field}
                  name={[field.name, 'catatanTambahan']}
                  label={<span className="font-bold">Catatan Pelaksanaan</span>}
                  className="mt-4! mb-0"
                >
                  <TextArea rows={2} placeholder="Catatan tambahan untuk tindakan ini..." />
                </Form.Item>
              </Card>
            ))}
          </div>
        )}
      </Form.List>
    </Card>
  )
}
