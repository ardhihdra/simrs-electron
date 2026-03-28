import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useState } from 'react'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import {
  useCarePlansByEncounter,
  useCreateCarePlan,
  useDeleteCarePlan,
  CarePlanGoalInput
} from '@renderer/hooks/query/use-care-plan'
import { useGoalsByEncounter } from '@renderer/hooks/query/use-goal'

const { TextArea } = Input
const { Text } = Typography

// ─── FHIR Category: SNOMED CT 736271009 ──────────────────────────────────────
const INSTRUKSI_CATEGORY = [
  {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '736271009',
        display: 'Outpatient care plan'
      }
    ]
  }
]

const FIXED_TITLE = 'Instruksi Medik dan Keperawatan Pasien'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active — Aktif' },
  { value: 'on-hold', label: 'On-Hold — Ditunda' },
  { value: 'revoked', label: 'Revoked — Dicabut' },
  { value: 'completed', label: 'Completed — Selesai' },
  { value: 'entered-in-error', label: 'Entered in Error' }
]

const STATUS_TAG_COLOR: Record<string, string> = {
  active: 'green',
  completed: 'blue',
  draft: 'default',
  'on-hold': 'volcano',
  revoked: 'red',
  'entered-in-error': 'magenta'
}

// Jenis instruksi medik yang umum sebagai pilihan cepat deskripsi
const INSTRUKSI_QUICK = [
  'Pemberian infus',
  'Pemeriksaan laboratorium',
  'Pemeriksaan radiologi (CXR)',
  'Pemberian oksigen',
  'Pemasangan kateter urin',
  'Pemasangan NGT',
  'Evaluasi tanda vital per 4 jam',
  'Bed rest total',
  'Diit khusus sesuai kebutuhan',
  'Konsultasi spesialis'
]

interface InstruksiMedikFormProps {
  encounterId: string
  patientData: { patient: { id: string; name?: string } }
  hideHeader?: boolean
  globalPerformerId?: string | number
}

export const InstruksiMedikForm = ({
  encounterId,
  patientData,
  hideHeader = false,
  globalPerformerId
}: InstruksiMedikFormProps) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)

  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])

  const { data: carePlansRaw, isLoading } = useCarePlansByEncounter(encounterId)
  const instruksiList: any[] = ((carePlansRaw as any)?.result ?? []).filter(
    (cp: any) => cp.title === FIXED_TITLE
  )

  const { data: goalsRaw } = useGoalsByEncounter(encounterId)
  const goalOptions = ((goalsRaw as any)?.result ?? []).map((g: any) => ({
    value: g.id,
    label: g.description?.text ?? g.id?.slice(0, 8)
  }))

  const createCarePlan = useCreateCarePlan()
  const deleteCarePlan = useDeleteCarePlan(encounterId)

  const handleSubmit = async (values: Record<string, any>) => {
    let performerId = values.performerId
    if (hideHeader && globalPerformerId) {
      performerId = globalPerformerId
    }

    if (!performerId) {
      message.error('Mohon pilih pemeriksa atau pastikan dokter DPJP tersedia')
      return
    }

    const performer = performersData?.find((p: any) => p.id === Number(performerId))
    try {
      const selectedGoalIds: string[] = values.goalIds ?? []
      const goals: CarePlanGoalInput[] = selectedGoalIds.map((id) => {
        const found = ((goalsRaw as any)?.result ?? []).find((g: any) => g.id === id)
        return { goalId: id, display: found?.description?.text }
      })

      await createCarePlan.mutateAsync({
        encounterId,
        patientId: patientData.patient.id,
        performerId: String(performerId),
        performerName: performer?.name,
        status: values.status,
        intent: 'plan',
        title: FIXED_TITLE,
        description: values.description,
        periodStart: values.periodStart?.toISOString(),
        periodEnd: values.periodEnd?.toISOString(),
        goals: goals.length ? goals : undefined,
        // Category SNOMED 736271009
        categories: [
          {
            code: INSTRUKSI_CATEGORY[0].coding[0].code,
            display: INSTRUKSI_CATEGORY[0].coding[0].display,
            system: INSTRUKSI_CATEGORY[0].coding[0].system
          }
        ]
      })
      message.success('Instruksi medik berhasil disimpan')
      form.resetFields()
      setModalOpen(false)
    } catch (err: any) {
      message.error(`Gagal menyimpan: ${err?.message}`)
    }
  }

  // ─── Expanded Row ──────────────────────────────────────────────────────────
  const expandedRowRender = (record: any) => {
    const goals: any[] = record.goals ?? []
    if (!goals.length) return <Text type="secondary">Tidak ada referensi Goal</Text>
    return (
      <div className="p-2">
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
          Tujuan Perawatan (Goals)
        </Text>
        <div className="flex flex-wrap gap-1">
          {goals.map((g: any, i: number) => (
            <Tag key={i} color="purple" className="text-xs">
              {g.display ?? g.goalId?.slice(0, 8)}
            </Tag>
          ))}
        </div>
      </div>
    )
  }

  // ─── Columns ──────────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'Instruksi',
      key: 'description',
      render: (_: any, r: any) => (
        <div>
          <Text strong className="text-xs text-purple-700">
            {r.title}
          </Text>
          {r.description && (
            <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{r.description}</div>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: string) => <Tag color={STATUS_TAG_COLOR[v] ?? 'default'}>{v?.toUpperCase()}</Tag>
    },
    {
      title: 'Tujuan (Goals)',
      key: 'goals',
      width: 160,
      render: (_: any, r: any) => {
        const goals: any[] = r.goals ?? []
        if (!goals.length)
          return (
            <Text type="secondary" className="text-xs">
              -
            </Text>
          )
        return (
          <div className="flex flex-wrap gap-1">
            {goals.slice(0, 2).map((g: any, i: number) => (
              <Tag key={i} color="purple" className="text-xs m-0">
                {g.display ?? g.goalId?.slice(0, 8)}
              </Tag>
            ))}
            {goals.length > 2 && <Tag className="text-xs m-0">+{goals.length - 2}</Tag>}
          </div>
        )
      }
    },
    {
      title: 'Periode',
      key: 'period',
      width: 160,
      render: (_: any, r: any) => {
        const start = r.periodStart ? dayjs(r.periodStart).format('DD/MM/YYYY') : null
        const end = r.periodEnd ? dayjs(r.periodEnd).format('DD/MM/YYYY') : null
        if (!start && !end) return <Text type="secondary">-</Text>
        return `${start ?? '?'} — ${end ?? '?'}`
      }
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 70,
      render: (_: any, r: any) => (
        <Tooltip title="Hapus">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            loading={deleteCarePlan.isPending}
            onClick={() =>
              Modal.confirm({
                title: 'Hapus Instruksi Medik?',
                content: 'Data ini akan dihapus permanen.',
                okText: 'Hapus',
                okType: 'danger',
                cancelText: 'Batal',
                onOk: () => deleteCarePlan.mutate(r.id)
              })
            }
          />
        </Tooltip>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Instruksi Medik dan Keperawatan"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Tambah Instruksi
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={instruksiList}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender,
            rowExpandable: (r: any) => (r.goals?.length ?? 0) > 0
          }}
          locale={{ emptyText: 'Belum ada instruksi medik yang dicatat' }}
          size="small"
        />
      </Card>

      <Modal
        title="Tambah Instruksi Medik dan Keperawatan"
        open={modalOpen}
        onCancel={() => {
          form.resetFields()
          setModalOpen(false)
        }}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'active' }}
        >
          {!hideHeader && (
            <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
          )}

          {/* ── Info Tetap ── */}
          <div className="bg-purple-50 border border-purple-100 rounded px-3 py-2 mb-4 text-xs text-purple-700">
            <span className="font-semibold">Judul FHIR:</span> {FIXED_TITLE}
            <br />
            <span className="font-semibold">Kategori:</span> SNOMED 736271009 — Outpatient care plan
          </div>

          {/* ── Deskripsi / Isi Instruksi ── */}
          <Form.Item
            name="description"
            label="Isi Instruksi Medik dan Keperawatan"
            rules={[{ required: true, message: 'Instruksi wajib diisi' }]}
          >
            <TextArea
              rows={4}
              placeholder="Contoh: Pemberian infus RL 20 tpm, pemeriksaan trombosit setiap 12 jam, istirahat total..."
            />
          </Form.Item>

          {/* Pilihan cepat */}
          <div className="mb-4">
            <Text className="text-xs text-gray-500 block mb-1">
              Pilihan cepat (klik untuk tambah ke instruksi):
            </Text>
            <div className="flex flex-wrap gap-1">
              {INSTRUKSI_QUICK.map((q) => (
                <Tag
                  key={q}
                  className="cursor-pointer hover:bg-purple-100 text-xs"
                  onClick={() => {
                    const current = form.getFieldValue('description') ?? ''
                    const separator = current ? '\n' : ''
                    form.setFieldValue('description', `${current}${separator}${q}`)
                  }}
                >
                  + {q}
                </Tag>
              ))}
            </div>
          </div>

          <Divider className="my-3" />

          {/* ── Tujuan Perawatan yg Dirujuk ── */}
          <Form.Item
            name="goalIds"
            label="Tujuan Perawatan yang Dirujuk (Goals)"
            tooltip="Goals yang terkait dengan instruksi ini"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder={
                goalOptions.length ? 'Pilih tujuan perawatan...' : 'Belum ada Goal yang dibuat'
              }
              options={goalOptions}
              disabled={!goalOptions.length}
              optionFilterProp="label"
            />
          </Form.Item>

          <Divider className="my-3" />

          {/* ── Status & Periode ── */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="periodStart" label="Tanggal Mulai">
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="periodEnd" label="Tanggal Selesai">
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space className="flex justify-end w-full">
              <Button
                onClick={() => {
                  form.resetFields()
                  setModalOpen(false)
                }}
              >
                Batal
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createCarePlan.isPending}
              >
                Simpan Instruksi
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
