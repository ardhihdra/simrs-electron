import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
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
import { PlusOutlined, DeleteOutlined, FileProtectOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useState } from 'react'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import {
  useCarePlansByEncounter,
  useCreateCarePlan,
  useDeleteCarePlan,
  CarePlanActivityInput
} from '@renderer/hooks/query/use-care-plan'

const { TextArea } = Input
const { Text } = Typography

interface CarePlanFormProps {
  encounterId: string
  patientData: { patient: { id: string; name?: string } }
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active — Aktif' },
  { value: 'on-hold', label: 'On-Hold — Ditunda' },
  { value: 'revoked', label: 'Revoked — Dicabut' },
  { value: 'completed', label: 'Completed — Selesai' },
  { value: 'entered-in-error', label: 'Entered in Error' }
]

const INTENT_OPTIONS = [
  { value: 'proposal', label: 'Proposal — Usulan' },
  { value: 'plan', label: 'Plan — Rencana' },
  { value: 'order', label: 'Order — Instruksi' },
  { value: 'option', label: 'Option — Opsi' }
]

const ACTIVITY_KIND_OPTIONS = [
  { value: 'Appointment', label: 'Appointment' },
  { value: 'MedicationRequest', label: 'Medication Request' },
  { value: 'NutritionOrder', label: 'Nutrition Order' },
  { value: 'Observation', label: 'Observation' },
  { value: 'Procedure', label: 'Procedure' },
  { value: 'ServiceRequest', label: 'Service Request' },
  { value: 'VisionPrescription', label: 'Vision Prescription' }
]

const ACTIVITY_STATUS_OPTIONS = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

const STATUS_TAG_COLOR: Record<string, string> = {
  active: 'green',
  completed: 'blue',
  draft: 'default',
  'on-hold': 'volcano',
  revoked: 'red',
  'entered-in-error': 'magenta'
}

const ACTIVITY_STATUS_COLOR: Record<string, string> = {
  'not-started': 'default',
  scheduled: 'cyan',
  'in-progress': 'processing',
  'on-hold': 'warning',
  completed: 'success',
  cancelled: 'error'
}

export const CarePlanForm = ({ encounterId, patientData }: CarePlanFormProps) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)

  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])
  const { data: carePlans = [], isLoading } = useCarePlansByEncounter(encounterId)
  const createCarePlan = useCreateCarePlan()
  const deleteCarePlan = useDeleteCarePlan(encounterId)

  const handleSubmit = async (values: Record<string, any>) => {
    const performer = performersData?.find((p: any) => p.id === values.performerId)
    try {
      await createCarePlan.mutateAsync({
        encounterId,
        patientId: patientData.patient.id,
        performerId: String(values.performerId),
        performerName: performer?.name,
        status: values.status,
        intent: values.intent,
        title: values.title,
        description: values.description,
        periodStart: values.periodStart?.toISOString(),
        periodEnd: values.periodEnd?.toISOString(),
        activities: (values.activities ?? []).map((a: CarePlanActivityInput) => ({
          ...a,
          scheduledPeriodStart:
            (a.scheduledPeriodStart as any)?.toISOString?.() ?? a.scheduledPeriodStart,
          scheduledPeriodEnd: (a.scheduledPeriodEnd as any)?.toISOString?.() ?? a.scheduledPeriodEnd
        }))
      })
      message.success('Rencana perawatan berhasil disimpan')
      form.resetFields()
      setModalOpen(false)
    } catch (err: any) {
      message.error(`Gagal menyimpan: ${err?.message}`)
    }
  }

  // Kolom tabel expansion untuk activities
  const expandedRowRender = (record: any) => {
    const activities: any[] = record.activities ?? []
    if (!activities.length) return <Text type="secondary">Tidak ada aktivitas tercatat</Text>
    return (
      <Table
        size="small"
        pagination={false}
        rowKey={(_, i) => `${record.id}-act-${i}`}
        dataSource={activities}
        columns={[
          {
            title: 'Jenis',
            dataIndex: 'kind',
            key: 'kind',
            width: 160,
            render: (v: string) => v || '-'
          },
          {
            title: 'Aktivitas',
            dataIndex: 'description',
            key: 'description',
            render: (v: string) => v || '-'
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (v: string) => <Tag color={ACTIVITY_STATUS_COLOR[v]}>{v}</Tag>
          },
          {
            title: 'Jadwal',
            key: 'schedule',
            width: 180,
            render: (_: any, act: any) => {
              const start = act.scheduledPeriodStart
                ? dayjs(act.scheduledPeriodStart).format('DD/MM/YYYY')
                : null
              const end = act.scheduledPeriodEnd
                ? dayjs(act.scheduledPeriodEnd).format('DD/MM/YYYY')
                : null
              if (!start && !end) return '-'
              return `${start ?? '?'} — ${end ?? '?'}`
            }
          }
        ]}
      />
    )
  }

  const columns = [
    {
      title: 'Judul / Deskripsi',
      key: 'title',
      render: (_: any, r: any) => (
        <div>
          {r.title && <Text strong>{r.title}</Text>}
          {r.description && <div className="text-xs text-gray-500">{r.description}</div>}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: string) => <Tag color={STATUS_TAG_COLOR[v] ?? 'default'}>{v?.toUpperCase()}</Tag>
    },
    {
      title: 'Intent',
      dataIndex: 'intent',
      key: 'intent',
      width: 100,
      render: (v: string) => <Tag color="geekblue">{v}</Tag>
    },
    {
      title: 'Periode',
      key: 'period',
      width: 160,
      render: (_: any, r: any) => {
        const start = r.periodStart ? dayjs(r.periodStart).format('DD/MM/YYYY') : null
        const end = r.periodEnd ? dayjs(r.periodEnd).format('DD/MM/YYYY') : null
        if (!start && !end) return '-'
        return `${start ?? '?'} — ${end ?? '?'}`
      }
    },
    {
      title: 'Aktivitas',
      key: 'activitiesCount',
      width: 90,
      render: (_: any, r: any) => <Tag>{(r.activities ?? []).length} item</Tag>
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
                title: 'Hapus Rencana Perawatan?',
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
        title="Rencana Rawat Pasien"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Tambah Rencana
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={carePlans}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          expandable={{ expandedRowRender }}
          locale={{ emptyText: 'Belum ada rencana perawatan yang dicatat' }}
          size="small"
        />
      </Card>
      <Modal
        title="Tambah Rencana Perawatan"
        open={modalOpen}
        onCancel={() => {
          form.resetFields()
          setModalOpen(false)
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="flex! flex-col! gap-4!"
          initialValues={{ status: 'active', intent: 'plan' }}
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

          <Form.Item name="title" label="Judul Rencana Perawatan">
            <Input placeholder="Cth: Rencana Perawatan Hipertensi Pasca Rawat Jalan" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Deskripsi Rencana"
            rules={[{ required: true, message: 'Deskripsi wajib diisi' }]}
          >
            <TextArea rows={3} placeholder="Jelaskan rencana perawatan secara ringkas..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="intent" label="Intent" rules={[{ required: true }]}>
                <Select options={INTENT_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="periodStart" label="Mulai">
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="periodEnd" label="Berakhir">
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Card title="Aktivitas Perawatan" size="small" className="">
            <Form.List name="activities">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-3">
                  {fields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      size="small"
                      extra={
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
                      }
                    >
                      <Row gutter={12}>
                        <Col span={10}>
                          <Form.Item
                            {...restField}
                            name={[name, 'kind']}
                            label="Jenis"
                            className="mb-2"
                          >
                            <Select options={ACTIVITY_KIND_OPTIONS} placeholder="Jenis aktivitas" />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item
                            {...restField}
                            name={[name, 'status']}
                            label="Status"
                            className="mb-2"
                            initialValue="not-started"
                          >
                            <Select options={ACTIVITY_STATUS_OPTIONS} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item
                        {...restField}
                        name={[name, 'description']}
                        label="Deskripsi Aktivitas"
                        className="mb-2"
                      >
                        <Input placeholder="Cth: Pemeriksaan tekanan darah rutin 2x seminggu" />
                      </Form.Item>
                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'scheduledPeriodStart']}
                            label="Jadwal Mulai"
                            className="mb-0"
                          >
                            <DatePicker className="w-full" format="DD/MM/YYYY" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'scheduledPeriodEnd']}
                            label="Jadwal Selesai"
                            className="mb-0"
                          >
                            <DatePicker className="w-full" format="DD/MM/YYYY" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                    Tambah Aktivitas
                  </Button>
                </div>
              )}
            </Form.List>
          </Card>

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
                Simpan Rencana
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
