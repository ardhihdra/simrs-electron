import { useState, useMemo } from 'react'
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
  Descriptions
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SaveOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  HistoryOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { AssessmentHeader } from '@renderer/components/organisms/Assessment/AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useMasterTindakanList } from '@renderer/hooks/query/use-master-tindakan'
import {
  useDetailTindakanByEncounter,
  useCreateDetailTindakan,
  useVoidDetailTindakan,
  type DetailTindakanPasienItem
} from '@renderer/hooks/query/use-detail-tindakan-pasien'
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
  const [searchTindakan, setSearchTindakan] = useState('')

  const patientId = patientData?.patient?.id || patientData?.id || ''

  // --- Performers (untuk AssessmentHeader — dokter & perawat pelaksana utama) ---
  const { data: performers = [], isLoading: isLoadingPerformers } = usePerformers([
    'doctor',
    'nurse',
    'bidan'
  ])
  const performerOptions = useMemo(
    () =>
      performers.map((p: any) => ({
        id: p.id,
        name: p.namaLengkap ?? p.name ?? ''
      })),
    [performers]
  )

  // --- Master Tindakan untuk Select di modal ---
  const { data: masterTindakanList = [], isLoading: isLoadingMaster } = useMasterTindakanList({
    q: searchTindakan || undefined,
    items: 150,
    status: 'active'
  })
  const tindakanOptions = masterTindakanList.map((t) => ({
    value: t.id,
    label: `[${t.kode}] ${t.nama}${t.kategori ? ` — ${t.kategori}` : ''}`,
    kode: t.kode,
    nama: t.nama,
    kategori: t.kategori
  }))

  // --- Data riwayat tindakan per encounter ---
  const { data: tindakanList = [], isLoading: isLoadingList } =
    useDetailTindakanByEncounter(encounterId)

  const createMutation = useCreateDetailTindakan(encounterId)
  const voidMutation = useVoidDetailTindakan(encounterId)

  // --- Submit handler ---
  const handleSubmit = async (values: any) => {
    try {
      await createMutation.mutateAsync({
        encounterId,
        patientId,
        masterTindakanId: values.masterTindakanId,
        tanggalTindakan: values.assessment_date
          ? values.assessment_date.format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD'),
        jumlah: values.jumlah,
        satuan: values.satuan,
        cyto: values.cyto ?? false,
        catatanTambahan: values.catatanTambahan,
        // Dokter utama dari AssessmentHeader → dokterPemeriksaId
        dokterPemeriksaId: values.performerId ? Number(values.performerId) : null,
        dokterDelegasiId: values.dokterDelegasiId ?? null,
        dokterAnestesiId: values.dokterAnestesiId ?? null,
        perawatId: values.perawatId ?? null,
        perawat2Id: values.perawat2Id ?? null,
        perawat3Id: values.perawat3Id ?? null
      })
      message.success('Detail tindakan berhasil disimpan')
      modalForm.resetFields()
      setIsModalOpen(false)
    } catch (err: any) {
      message.error(err?.message ?? 'Gagal menyimpan detail tindakan')
    }
  }

  const handleOpenModal = () => {
    modalForm.resetFields()
    modalForm.setFieldsValue({
      assessment_date: dayjs(),
      jumlah: 1,
      cyto: false
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
          <span className="font-semibold text-sm">{record.masterTindakan?.nama ?? '-'}</span>
          <span className="text-xs" style={{ color: token.colorTextTertiary }}>
            [{record.masterTindakan?.kode}]
            {record.masterTindakan?.kategori ? ` · ${record.masterTindakan.kategori}` : ''}
          </span>
        </div>
      )
    },
    {
      title: 'Jumlah',
      key: 'jumlah',
      width: 80,
      render: (_, record) => `${record.jumlah} ${record.satuan ?? ''}`
    },
    {
      title: 'Cyto',
      dataIndex: 'cyto',
      key: 'cyto',
      width: 80,
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
        const dokterPemeriksa = record.dokterPemeriksa?.namaLengkap
        const lines = [
          record.dokterDelegasi?.namaLengkap && `Delegasi: ${record.dokterDelegasi.namaLengkap}`,
          record.dokterAnestesi?.namaLengkap && `Anestesi: ${record.dokterAnestesi.namaLengkap}`,
          record.perawat?.namaLengkap && `Perawat: ${record.perawat.namaLengkap}`,
          record.perawat2?.namaLengkap && `Perawat 2: ${record.perawat2.namaLengkap}`,
          record.perawat3?.namaLengkap && `Perawat 3: ${record.perawat3.namaLengkap}`
        ].filter(Boolean)

        const popoverContent = (
          <Descriptions column={1} size="small" style={{ minWidth: 220 }}>
            <Descriptions.Item label="Dokter Pemeriksa">
              {record.dokterPemeriksa?.namaLengkap ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Dokter Delegasi">
              {record.dokterDelegasi?.namaLengkap ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Dokter Anestesi">
              {record.dokterAnestesi?.namaLengkap ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Perawat / Terapis">
              {record.perawat?.namaLengkap ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Perawat 2">
              {record.perawat2?.namaLengkap ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Perawat 3">
              {record.perawat3?.namaLengkap ?? '-'}
            </Descriptions.Item>
          </Descriptions>
        )

        return (
          <Popover title="Detail Tim Pelaksana" content={popoverContent} trigger="click">
            <div className="flex flex-col gap-0.5 cursor-pointer">
              <span className="text-sm font-medium">
                {dokterPemeriksa ?? <span style={{ color: token.colorTextTertiary }}>-</span>}
              </span>
              {lines.length > 0 && (
                <span className="text-xs" style={{ color: token.colorTextTertiary }}>
                  +{lines.length} petugas lainnya
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
        width={800}
        destroyOnClose
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={handleSubmit}
          className="flex! flex-col! gap-4!"
          initialValues={{ assessment_date: dayjs(), jumlah: 1, cyto: false }}
        >
          {/* Assessment Header — tanggal + dokter pemeriksa utama */}
          <AssessmentHeader performers={performerOptions} loading={isLoadingPerformers} />

          {/* Pilih Tindakan + Cyto */}
          <Row gutter={12}>
            <Col span={18}>
              <Form.Item
                name="masterTindakanId"
                label={<span className="font-bold">Nama Tindakan</span>}
                rules={[{ required: true, message: 'Nama tindakan wajib dipilih' }]}
              >
                <Select
                  showSearch
                  placeholder="Cari dan pilih tindakan..."
                  filterOption={false}
                  onSearch={(val) => setSearchTindakan(val)}
                  loading={isLoadingMaster}
                  options={tindakanOptions}
                  notFoundContent={
                    isLoadingMaster ? <Spin size="small" /> : 'Tindakan tidak ditemukan'
                  }
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="cyto"
                label={<span className="font-bold">Cyto / Mendesak</span>}
                valuePropName="checked"
              >
                <Switch
                  checkedChildren={
                    <Space size={4}>
                      <ThunderboltOutlined /> Cyto
                    </Space>
                  }
                  unCheckedChildren="Tidak"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Jumlah + Satuan */}
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item
                name="jumlah"
                label={<span className="font-bold">Jumlah</span>}
                rules={[{ required: true, message: 'Jumlah wajib diisi' }]}
              >
                <InputNumber min={0.01} step={1} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="satuan" label={<span className="font-bold">Satuan</span>}>
                <Input placeholder="cth: tindakan, sesi, kali" />
              </Form.Item>
            </Col>
          </Row>

          {/* Petugas tambahan */}
          <Card
            size="small"
            title={<span className="font-semibold">Petugas Pelaksana Lainnya</span>}
          >
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="dokterDelegasiId"
                  label={<span className="font-bold">Dokter Delegasi</span>}
                >
                  <Select
                    showSearch
                    allowClear
                    placeholder="Pilih dokter delegasi..."
                    options={performerOptions.map((p) => ({ value: p.id, label: p.name }))}
                    loading={isLoadingPerformers}
                    filterOption={(input, opt) =>
                      (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="dokterAnestesiId"
                  label={<span className="font-bold">Dokter Anestesi</span>}
                >
                  <Select
                    showSearch
                    allowClear
                    placeholder="Pilih dokter anestesi..."
                    options={performerOptions.map((p) => ({ value: p.id, label: p.name }))}
                    loading={isLoadingPerformers}
                    filterOption={(input, opt) =>
                      (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="perawatId"
                  label={<span className="font-bold">Perawat / Terapis</span>}
                >
                  <Select
                    showSearch
                    allowClear
                    placeholder="Perawat utama..."
                    options={performerOptions.map((p) => ({ value: p.id, label: p.name }))}
                    loading={isLoadingPerformers}
                    filterOption={(input, opt) =>
                      (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="perawat2Id" label={<span className="font-bold">Perawat 2</span>}>
                  <Select
                    showSearch
                    allowClear
                    placeholder="Perawat 2..."
                    options={performerOptions.map((p) => ({ value: p.id, label: p.name }))}
                    loading={isLoadingPerformers}
                    filterOption={(input, opt) =>
                      (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="perawat3Id" label={<span className="font-bold">Perawat 3</span>}>
                  <Select
                    showSearch
                    allowClear
                    placeholder="Perawat 3..."
                    options={performerOptions.map((p) => ({ value: p.id, label: p.name }))}
                    loading={isLoadingPerformers}
                    filterOption={(input, opt) =>
                      (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
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
