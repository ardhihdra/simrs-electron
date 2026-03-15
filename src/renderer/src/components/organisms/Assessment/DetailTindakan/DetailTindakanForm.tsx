import { useMemo, useState } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  InputNumber,
  App,
  Modal,
  Table,
  Space,
  Tooltip,
  Popconfirm,
  Popover,
  Spin,
  Tag,
  Switch,
  Row,
  Col,
  Radio,
  Divider
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SaveOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { AssessmentHeader } from '@renderer/components/organisms/Assessment/AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useMasterTindakanList } from '@renderer/hooks/query/use-master-tindakan'
import {
  useMasterPaketTindakanList,
  type PaketDetailItem
} from '@renderer/hooks/query/use-master-paket-tindakan'
import {
  useDetailTindakanByEncounter,
  useCreateDetailTindakan,
  useVoidDetailTindakan,
  type DetailTindakanPasienItem
} from '@renderer/hooks/query/use-detail-tindakan-pasien'
import { useMasterJenisKomponenList } from '@renderer/hooks/query/use-master-jenis-komponen'
import { theme } from 'antd'

const { TextArea } = Input

interface DetailTindakanFormProps {
  encounterId: string
  patientData: any
}

export const DetailTindakanForm = ({ encounterId, patientData }: DetailTindakanFormProps) => {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const [modalForm] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'non-paket' | 'paket'>('non-paket')
  const [searchTindakan, setSearchTindakan] = useState('')
  const [searchPaket, setSearchPaket] = useState('')

  const patientId = patientData?.patient?.id || patientData?.id || ''

  const { data: performers = [], isLoading: isLoadingPerformers } = usePerformers([
    'doctor',
    'nurse',
    'bidan'
  ])

  const { data: masterTindakanList = [], isLoading: isLoadingMaster } = useMasterTindakanList({
    q: searchTindakan || undefined,
    items: 10,
    status: 'active'
  })

  const { data: paketList = [], isLoading: isLoadingPaket } = useMasterPaketTindakanList({
    q: searchPaket || undefined,
    items: 10
  })

  // Ambil rujukan jenis komponen untuk role nakes (Filter: isUntukMedis = true)
  const { data: listJenisKomponen = [], isLoading: isLoadingRoles } = useMasterJenisKomponenList({
    isUntukMedis: true,
    status: 'active'
  })

  const roleOptions = useMemo(() => {
    return listJenisKomponen.map((j) => ({
      label: j.label,
      value: j.kode
    }))
  }, [listJenisKomponen])

  const currentTindakanList = Form.useWatch('tindakanList', modalForm)

  const tindakanOptions = useMemo(() => {
    const list = masterTindakanList.map((t) => ({
      value: t.id,
      label: `[${t.kodeTindakan}] ${t.namaTindakan}${t.kategoriTindakan ? ` — ${t.kategoriTindakan}` : ''}`
    }))

    if (currentTindakanList) {
      currentTindakanList.forEach((item: any) => {
        if (item?.masterTindakan && !list.some((opt) => opt.value === item.masterTindakanId)) {
          list.push({
            value: item.masterTindakanId,
            label: `[${item.masterTindakan.kodeTindakan}] ${item.masterTindakan.namaTindakan}${item.masterTindakan.kategoriTindakan ? ` — ${item.masterTindakan.kategoriTindakan}` : ''}`
          })
        }
      })
    }

    if (paketList) {
      paketList.forEach((paket) => {
        paket.detailItems?.forEach((detail) => {
          if (detail.masterTindakan && !list.some((opt) => opt.value === detail.masterTindakanId)) {
            list.push({
              value: detail.masterTindakanId,
              label: `[${detail.masterTindakan.kodeTindakan}] ${detail.masterTindakan.namaTindakan}${detail.masterTindakan.kategoriTindakan ? ` — ${detail.masterTindakan.kategoriTindakan}` : ''}`
            })
          }
        })
      })
    }
    return list
  }, [masterTindakanList, paketList, currentTindakanList])

  const paketOptions = paketList.map((p) => ({
    value: p.id,
    label: `[${p.kodePaket}] ${p.namaPaket}${p.kategoriPaket ? ` — ${p.kategoriPaket}` : ''}`
  }))

  const { data: tindakanList = [], isLoading: isLoadingList } =
    useDetailTindakanByEncounter(encounterId)

  const createMutation = useCreateDetailTindakan(encounterId)
  const voidMutation = useVoidDetailTindakan(encounterId)

  const buildTindakanData = (values: any) => {
    const petugasList = (values.petugasList ?? []).filter((p: any) => p?.pegawaiId && p?.roleTenaga)
    const tanggal = values.assessment_date
      ? values.assessment_date.format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD')

    const items = values.tindakanList || []

    return items
      .filter((item: any) => item?.masterTindakanId)
      .map((item: any) => ({
        masterTindakanId: item.masterTindakanId,
        paketId: item.paketId,
        paketDetailId: item.paketDetailId,
        encounterId,
        patientId,
        tanggalTindakan: tanggal,
        jumlah: item.jumlah ?? 1,
        satuan: item.satuan,
        cyto: item.cyto ?? false,
        catatanTambahan: values.catatanTambahan,
        petugasList
      }))
  }

  const handleSubmit = async (values: any) => {
    try {
      const petugasList = (values.petugasList ?? []).filter(
        (p: any) => p?.pegawaiId && p?.roleTenaga
      )
      if (petugasList.length === 0) {
        message.error('Minimal harus ada 1 tenaga medis pelaksana')
        return
      }

      const tindakanData = buildTindakanData(values)
      if (tindakanData.length === 0) {
        message.error('Minimal harus mencatat 1 tindakan')
        return
      }

      await createMutation.mutateAsync({ tindakanData })
      message.success(`${tindakanData.length} tindakan berhasil disimpan`)
      modalForm.resetFields()
      setIsModalOpen(false)
    } catch (err: any) {
      message.error(err?.message ?? 'Gagal menyimpan detail tindakan')
    }
  }

  const handleOpenModal = () => {
    modalForm.resetFields()
    setMode('non-paket')
    modalForm.setFieldsValue({
      assessment_date: dayjs(),
      petugasList: [{}],
      tindakanList: [{ jumlah: 1, cyto: false }]
    })
    setIsModalOpen(true)
  }

  const handleVoid = async (id: number) => {
    try {
      await voidMutation.mutateAsync(id)
      message.success('Tindakan berhasil dibatalkan')
    } catch (err: any) {
      message.error(err?.message ?? 'Gagal membatalkan tindakan')
    }
  }

  // --- Kolom tabel riwayat ---
  const columns: ColumnsType<DetailTindakanPasienItem> = [
    {
      title: 'No',
      key: 'no',
      width: 48,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'Tanggal',
      dataIndex: 'tanggalTindakan',
      key: 'tanggal',
      width: 110,
      render: (val) => dayjs(val).format('DD/MM/YYYY')
    },
    {
      title: 'Tindakan',
      key: 'tindakan',
      render: (_, record) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm">
            {record.masterTindakan?.namaTindakan ?? '-'}
          </span>
          <span className="text-xs" style={{ color: token.colorTextTertiary }}>
            [{record.masterTindakan?.kodeTindakan}]
            {record.masterTindakan?.kategoriTindakan
              ? ` · ${record.masterTindakan.kategoriTindakan}`
              : ''}
          </span>
        </div>
      )
    },
    {
      title: 'Jumlah',
      key: 'jumlah',
      width: 80,
      render: (_, record) => `${Number(record.jumlah)} ${record.satuan ?? ''}`
    },
    {
      title: 'Cyto',
      dataIndex: 'cyto',
      key: 'cyto',
      width: 72,
      align: 'center',
      render: (val) =>
        val ? (
          <Tag color="error" icon={<ThunderboltOutlined />}>
            Cyto
          </Tag>
        ) : (
          <Tag color="default" icon={<CheckCircleOutlined />}>
            Tidak
          </Tag>
        )
    },
    {
      title: 'Tim Pelaksana',
      key: 'tim',
      render: (_, record) => {
        const petugas = record.tindakanPelaksanaList ?? []
        if (petugas.length === 0) return <span style={{ color: token.colorTextTertiary }}>-</span>

        const first = petugas[0]
        const popoverContent = (
          <div className="flex flex-col gap-1 min-w-[200px]">
            {petugas.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                  {roleOptions.find((r) => r.value === p.roleTenaga)?.label ?? p.roleTenaga}
                </Tag>
                <span className="text-sm">{p.pegawai?.namaLengkap ?? `ID: ${p.pegawaiId}`}</span>
              </div>
            ))}
          </div>
        )

        return (
          <Popover title="Tim Pelaksana Tindakan" content={popoverContent} trigger="click">
            <div className="flex flex-col gap-0.5 cursor-pointer">
              <span className="text-sm font-medium">{first.pegawai?.namaLengkap ?? `-`}</span>
              {petugas.length > 1 && (
                <span className="text-xs" style={{ color: token.colorTextTertiary }}>
                  +{petugas.length - 1} petugas lainnya
                </span>
              )}
            </div>
          </Popover>
        )
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (val) =>
        val === 'void' ? <Tag color="error">Dibatalkan</Tag> : <Tag color="success">Aktif</Tag>
    },
    {
      title: 'Tarif',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      align: 'right',
      render: (val) =>
        new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(Number(val || 0))
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 70,
      align: 'center',
      render: (_, record) =>
        record.status !== 'void' ? (
          <Popconfirm
            title="Batalkan tindakan ini?"
            description="Tindakan akan ditandai sebagai void."
            onConfirm={() => handleVoid(record.id)}
            okText="Ya, batalkan"
            cancelText="Tidak"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Batalkan tindakan">
              <Button
                size="small"
                danger
                type="text"
                icon={<DeleteOutlined />}
                loading={voidMutation.isPending}
              />
            </Tooltip>
          </Popconfirm>
        ) : null
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* History table card */}
      <Card
        title={
          <Space>
            <HistoryOutlined />
            Detail Tindakan Medis
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            Catat Tindakan Baru
          </Button>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Spin spinning={isLoadingList}>
          <Table
            rowKey="id"
            dataSource={tindakanList}
            columns={columns}
            size="small"
            pagination={false}
            className="border-none"
            locale={{ emptyText: 'Belum ada tindakan yang dicatat untuk encounter ini' }}
            rowClassName={(record) => (record.status === 'void' ? 'opacity-40' : '')}
          />
        </Spin>
      </Card>

      {/* Modal form */}
      <Modal
        title="Catat Detail Tindakan"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          modalForm.resetFields()
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalOpen(false)
              modalForm.resetFields()
            }}
          >
            Batal
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<SaveOutlined />}
            loading={createMutation.isPending}
            onClick={() => modalForm.submit()}
          >
            Simpan
          </Button>
        ]}
        width={860}
        destroyOnClose
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={handleSubmit}
          className="flex! flex-col! gap-4!"
          initialValues={{ assessment_date: dayjs(), petugasList: [{}] }}
        >
          <AssessmentHeader performers={performers || []} loading={isLoadingPerformers} />
          <div className="flex items-center gap-3 mb-2">
            <span className="font-semibold text-sm">Mode Input:</span>
            <Radio.Group
              value={mode}
              onChange={(e) => {
                setMode(e.target.value)
                modalForm.resetFields(['masterTindakanId', 'paketId'])
              }}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="non-paket">
                <Space size={4}>
                  <UnorderedListOutlined />
                  Non-Paket
                </Space>
              </Radio.Button>
              <Radio.Button value="paket">
                <Space size={4}>
                  <AppstoreOutlined />
                  Paket Tindakan
                </Space>
              </Radio.Button>
            </Radio.Group>
          </div>

          <Divider style={{ margin: '0' }} />

          {/* Pilihan Khusus Mode Paket */}
          {mode === 'paket' && (
            <Form.Item
              name="paketId"
              label={<span className="font-bold">Salin dari Paket Tindakan</span>}
              extra="Tindakan dari paket yang dipilih akan ditambahkan ke daftar di bawah."
            >
              <Select
                showSearch
                allowClear
                placeholder="Cari dan pilih paket tindakan..."
                filterOption={false}
                onSearch={(val) => setSearchPaket(val)}
                loading={isLoadingPaket}
                options={paketOptions}
                onChange={(val) => {
                  if (!val) return

                  const selected = paketList.find((p) => p.id === val)
                  if (selected?.detailItems) {
                    const mappedItems = selected.detailItems.map((d: PaketDetailItem) => ({
                      masterTindakanId: d.masterTindakanId,
                      paketId: val, // Simpan referensi paket
                      paketDetailId: d.id, // Simpan referensi detail item paket
                      jumlah: Number(d.qty ?? 1),
                      satuan: d.satuan,
                      masterTindakan: d.masterTindakan, // store full label mapping locally
                      cyto: true // Masuk dari paket otomatis Cyto
                    }))

                    const currentActions = modalForm.getFieldValue('tindakanList') || []
                    const filteredCurrent = currentActions.filter(
                      (item: any) => item?.masterTindakanId
                    )

                    modalForm.setFieldValue('tindakanList', [...filteredCurrent, ...mappedItems])
                    message.success(`${mappedItems.length} tindakan ditambahkan dari paket`)
                  }
                }}
                notFoundContent={isLoadingPaket ? <Spin size="small" /> : 'Paket tidak ditemukan'}
              />
            </Form.Item>
          )}

          {/* Dynamic Form List untuk Tindakan */}
          <Card size="small" title={<span className="font-semibold">Daftar Tindakan Medis</span>}>
            <Form.List name="tindakanList">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-2">
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={8} align="middle">
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'masterTindakanId']}
                          label={
                            name === 0 ? <span className="font-bold">Tindakan</span> : undefined
                          }
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
                              // Jika user ganti tindakan manual, hapus referensi paket agar tidak salah harga
                              const currentList = modalForm.getFieldValue('tindakanList') || []
                              if (currentList[name]) {
                                currentList[name].paketId = undefined
                                currentList[name].paketDetailId = undefined
                                modalForm.setFieldValue('tindakanList', [...currentList])
                              }
                            }}
                            notFoundContent={
                              isLoadingMaster ? <Spin size="small" /> : 'Tindakan tidak ditemukan'
                            }
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
                            name === 0 ? (
                              <span className="font-bold flex justify-center">Cyto</span>
                            ) : undefined
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

          {/* Tenaga Medis Pelaksana — Form.List */}
          <Card size="small" title={<span className="font-semibold">Tenaga Medis Pelaksana</span>}>
            <Form.List name="petugasList">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-2">
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={8} align="middle">
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'pegawaiId']}
                          label={
                            name === 0 ? <span className="font-bold">Nama Petugas</span> : undefined
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
                          label={
                            name === 0 ? <span className="font-bold">Role / Peran</span> : undefined
                          }
                          rules={[{ required: true, message: 'Pilih role' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            placeholder="Pilih role..."
                            options={roleOptions}
                            loading={isLoadingRoles}
                            allowClear
                          />
                        </Form.Item>
                      </Col>
                      <Col span={3} className="flex items-end pb-0.5">
                        {name === 0 && <div className="h-[22px]" />}
                        {fields.length > 1 && (
                          <Tooltip title="Hapus petugas">
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
                    onClick={() => add()}
                    className="mt-1"
                  >
                    Tambah Petugas
                  </Button>
                </div>
              )}
            </Form.List>
          </Card>

          <Form.Item name="catatanTambahan" label={<span className="font-bold">Catatan</span>}>
            <TextArea rows={3} placeholder="Catatan tambahan tindakan..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DetailTindakanForm
