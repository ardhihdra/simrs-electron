import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import { PlusOutlined, DeleteOutlined, AimOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useState } from 'react'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useGoalsByEncounter, useCreateGoal, useDeleteGoal } from '@renderer/hooks/query/use-goal'

const { TextArea } = Input
const { Text } = Typography

interface GoalFormProps {
  encounterId: string
  patientData: { patient: { id: string; name?: string } }
}

const LIFECYCLE_OPTIONS = [
  { value: 'proposed', label: 'Proposed — Diusulkan' },
  { value: 'planned', label: 'Planned — Direncanakan' },
  { value: 'accepted', label: 'Accepted — Diterima' },
  { value: 'active', label: 'Active — Aktif' },
  { value: 'on-hold', label: 'On-Hold — Ditunda' },
  { value: 'completed', label: 'Completed — Selesai' },
  { value: 'cancelled', label: 'Cancelled — Dibatalkan' }
]

const PRIORITY_OPTIONS = [
  { value: 'high-priority', label: 'Tinggi' },
  { value: 'medium-priority', label: 'Sedang' },
  { value: 'low-priority', label: 'Rendah' }
]

const STATUS_TAG_COLOR: Record<string, string> = {
  active: 'green',
  completed: 'blue',
  cancelled: 'red',
  proposed: 'orange',
  planned: 'cyan',
  accepted: 'geekblue',
  'on-hold': 'volcano'
}

export const GoalForm = ({ encounterId, patientData }: GoalFormProps) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)

  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])
  const { data: goals = [], isLoading } = useGoalsByEncounter(encounterId)
  const createGoal = useCreateGoal()
  const deleteGoal = useDeleteGoal(encounterId)

  const handleSubmit = async (values: Record<string, any>) => {
    const performer = performersData?.find((p: any) => p.id === values.performerId)

    try {
      await createGoal.mutateAsync({
        encounterId,
        patientId: patientData.patient.id,
        performerId: String(values.performerId),
        performerName: performer?.name,
        lifecycleStatus: values.lifecycleStatus,
        description: values.description,
        priority: values.priority,
        startDate: values.startDate?.toISOString(),
        targets:
          values.targets?.map((t: any) => ({
            measureDisplay: t.measureDisplay,
            detailQuantityValue: t.detailQuantityValue,
            detailQuantityUnit: t.detailQuantityUnit,
            dueDate: t.dueDate?.toISOString()
          })) ?? []
      })
      message.success('Tujuan perawatan berhasil disimpan')
      form.resetFields()
      setModalOpen(false)
    } catch (err: any) {
      message.error(`Gagal menyimpan: ${err?.message}`)
    }
  }

  const columns = [
    {
      title: 'Tujuan Perawatan',
      key: 'description',
      render: (_: any, record: any) => {
        const desc = record.description?.text ?? record.description?.coding?.[0]?.display ?? '-'
        return <Text strong>{desc}</Text>
      }
    },
    {
      title: 'Status',
      dataIndex: 'lifecycleStatus',
      key: 'lifecycleStatus',
      width: 130,
      render: (status: string) => (
        <Tag color={STATUS_TAG_COLOR[status] ?? 'default'}>{status?.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Prioritas',
      key: 'priority',
      width: 90,
      render: (_: any, record: any) => {
        const p = record.priority?.text || record.priority?.coding?.[0]?.display
        if (!p) return '-'
        const colorMap: Record<string, string> = {
          'high-priority': 'red',
          'medium-priority': 'orange',
          'low-priority': 'blue'
        }
        return <Tag color={colorMap[p] ?? 'default'}>{p.replace('-priority', '')}</Tag>
      }
    },
    {
      title: 'Target',
      key: 'targets',
      render: (_: any, record: any) => {
        const targets = record.targets ?? []
        if (!targets.length) return <Text type="secondary">-</Text>
        return targets.map((t: any, i: number) => (
          <div key={i} className="text-xs">
            {t.measureDisplay && <span className="font-medium">{t.measureDisplay}: </span>}
            {t.detailQuantityValue != null && (
              <span>
                {t.detailQuantityValue} {t.detailQuantityUnit}
              </span>
            )}
            {t.dueDate && (
              <span className="text-gray-400 ml-1">
                (s/d {dayjs(t.dueDate).format('DD/MM/YYYY')})
              </span>
            )}
          </div>
        ))
      }
    },
    {
      title: 'Tanggal',
      key: 'startDate',
      width: 100,
      render: (_: any, record: any) =>
        record.startDate ? dayjs(record.startDate).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 70,
      render: (_: any, record: any) => (
        <Tooltip title="Hapus">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            loading={deleteGoal.isPending}
            onClick={() => {
              Modal.confirm({
                title: 'Hapus Tujuan Perawatan?',
                content: 'Data ini akan dihapus permanen.',
                okText: 'Hapus',
                okType: 'danger',
                cancelText: 'Batal',
                onOk: () => deleteGoal.mutate(record.id)
              })
            }}
          />
        </Tooltip>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Tujuan Perawatan"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Tambah Tujuan
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={goals}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Belum ada tujuan perawatan yang dicatat' }}
          size="small"
        />
      </Card>

      <Modal
        title="Tambah Tujuan Perawatan"
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
          className="flex! flex-col gap-4!"
          initialValues={{ lifecycleStatus: 'active', priority: 'medium-priority' }}
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
          <Form.Item
            name="description"
            label="Deskripsi Tujuan Perawatan"
            rules={[{ required: true, message: 'Deskripsi wajib diisi' }]}
          >
            <TextArea
              rows={3}
              placeholder="Contoh: Tekanan darah terkontrol di bawah 130/80 mmHg dalam 4 minggu"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="lifecycleStatus" label="Status" rules={[{ required: true }]}>
                <Select options={LIFECYCLE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Prioritas">
                <Select options={PRIORITY_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="startDate" label="Tanggal Mulai">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Card title="Target Tujuan (Opsional)" size="small" className="">
            <Form.List name="targets">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-2">
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={8} align="middle">
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'measureDisplay']} className="mb-0">
                          <Input placeholder="Parameter (cth: Tekanan darah)" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'detailQuantityValue']}
                          className="mb-0"
                        >
                          <InputNumber placeholder="Nilai" className="w-full" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'detailQuantityUnit']}
                          className="mb-0"
                        >
                          <Input placeholder="Satuan" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item {...restField} name={[name, 'dueDate']} className="mb-0">
                          <DatePicker
                            placeholder="Target tanggal"
                            format="DD/MM/YYYY"
                            className="w-full"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                    Tambah Target
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
                loading={createGoal.isPending}
              >
                Simpan Tujuan
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
