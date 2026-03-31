import {
  Alert,
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
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined, MinusCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useState } from 'react'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useGoalsByEncounter, useCreateGoal, useDeleteGoal } from '@renderer/hooks/query/use-goal'
import { useConditionByEncounter } from '@renderer/hooks/query/use-condition'
import { useQueryObservationByEncounter } from '@renderer/hooks/query/use-observation'
import { useMedicationRequestByEncounter } from '@renderer/hooks/query/use-medication-request'
import { useNutritionOrderByEncounter } from '@renderer/hooks/query/use-nutrition-order'
import { useServiceRequestByEncounter } from '@renderer/hooks/query/use-service-request'
import {
  GOAL_CATEGORY_MAP,
  GOAL_MEASURE_LOINC_MAP,
  GOAL_DETAIL_SNOMED_MAP,
  GOAL_ADDRESS_REFERENCE_TYPES
} from '@renderer/config/maps/goal-maps'
import { createGoalTargetBatch } from '@renderer/utils/builders/goal-builder'

const { TextArea } = Input
const { Text } = Typography

interface GoalFormProps {
  encounterId: string
  patientData: { patient: { id: string; name?: string } }
  hideHeader?: boolean
  globalPerformerId?: string | number
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

const CATEGORY_OPTIONS = Object.values(GOAL_CATEGORY_MAP).map((c) => ({
  value: c.code,
  label: c.label
}))

const MEASURE_OPTIONS = Object.values(GOAL_MEASURE_LOINC_MAP).map((m) => ({
  value: m.code,
  label: m.label
}))

const DETAIL_SNOMED_OPTIONS = Object.values(GOAL_DETAIL_SNOMED_MAP).map((s) => ({
  value: s.code,
  label: s.label
}))

/** Helper: normalisasi respons API yang bisa berupa { result: [] } atau [] */
const safeArray = (data: unknown): any[] => {
  if (!data) return []
  if (Array.isArray(data)) return data
  const d = data as any
  if (Array.isArray(d?.result)) return d.result
  return []
}

export const GoalForm = ({
  encounterId,
  patientData,
  hideHeader = false,
  globalPerformerId
}: GoalFormProps) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const referenceType = Form.useWatch('referenceType', form)

  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])
  const { data: conditionsData, isLoading: isLoadingConditions } =
    useConditionByEncounter(encounterId)
  const { data: observationsData, isLoading: isLoadingObservations } =
    useQueryObservationByEncounter(encounterId)
  const { data: medicationsData, isLoading: isLoadingMedications } =
    useMedicationRequestByEncounter(encounterId)
  const { data: nutritionsData, isLoading: isLoadingNutritions } =
    useNutritionOrderByEncounter(encounterId)
  const { data: servicesData, isLoading: isLoadingServices } =
    useServiceRequestByEncounter(encounterId)

  const { data: goalsRaw, isLoading: isLoadingGoals } = useGoalsByEncounter(encounterId)
  const goals: any[] = (goalsRaw as any)?.result ?? []
  const createGoal = useCreateGoal()
  const deleteGoal = useDeleteGoal(encounterId)

  const referenceOptions = (() => {
    switch (referenceType) {
      case 'Condition':
        return safeArray(conditionsData).map((c: any) => ({
          value: c.id,
          label: c.code?.text || c.code?.coding?.[0]?.display || `Diagnosa ID: ${c.id}`
        }))
      case 'Observation':
        return safeArray(observationsData).map((o: any) => ({
          value: o.id,
          label: o.code?.text || o.code?.coding?.[0]?.display || `Observasi ID: ${o.id}`
        }))
      case 'MedicationStatement':
        return safeArray(medicationsData).map((m: any) => ({
          value: m.id,
          label:
            m.item?.nama ||
            m.medicationCodeableConcept?.text ||
            m.medicationCodeableConcept?.coding?.[0]?.display ||
            `Obat ID: ${m.id}`
        }))
      case 'NutritionOrder':
        return safeArray(nutritionsData).map((n: any) => {
          const dietType = n.oralDietTypes?.[0]?.display
          const formula = n.enteralFormula?.baseFormulaProductName
          return {
            value: n.id,
            label: dietType
              ? `Diet: ${dietType}`
              : formula
                ? `Enteral: ${formula}`
                : `Gizi ID: ${n.id}`
          }
        })
      case 'ServiceRequest':
        return safeArray(servicesData).map((s: any) => {
          const cat = s.category?.[0]?.text
          const detail = s.code?.text || s.orderDetail?.[0]?.text
          return {
            value: s.id,
            label: detail ? `${cat ? cat + ' - ' : ''}${detail}` : `Tindakan ID: ${s.id}`
          }
        })
      default:
        return []
    }
  })()

  const isLoadingReference =
    referenceType === 'Condition'
      ? isLoadingConditions
      : referenceType === 'Observation'
        ? isLoadingObservations
        : referenceType === 'MedicationStatement'
          ? isLoadingMedications
          : referenceType === 'NutritionOrder'
            ? isLoadingNutritions
            : referenceType === 'ServiceRequest'
              ? isLoadingServices
              : false

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      let performerId = values.performerId
      if (hideHeader && globalPerformerId) {
        performerId = globalPerformerId
      }

      if (!performerId) {
        message.warning('Mohon pilih pemeriksa atau pastikan dokter DPJP tersedia')
        return
      }

      const performer = performersData?.find((p: any) => p.id === Number(performerId))

      if (!values.description?.trim()) {
        message.warning('Deskripsi tujuan perawatan wajib diisi')
        return
      }

      const rawTargets: any[] = values.targets ?? []
      const validTargets = rawTargets.filter((t) => t?.measureCode)
      const targets = createGoalTargetBatch(
        validTargets.map((t) => ({
          measureCode: t.measureCode,
          detailSnomed: t.detailType === 'snomed' ? t.detailSnomed : undefined,
          detailQuantityValue:
            t.detailType === 'quantity' ? Number(t.detailQuantityValue) : undefined,
          detailQuantityUnit: t.detailType === 'quantity' ? t.detailQuantityUnit : undefined,
          detailString: t.detailType === 'string' ? t.detailString : undefined,
          dueDate: t.dueDate ? t.dueDate.format('YYYY-MM-DD') : undefined
        }))
      )

      const categoryEntry = values.category ? GOAL_CATEGORY_MAP[values.category] : undefined
      const categories = categoryEntry
        ? [
            {
              code: categoryEntry.code,
              display: categoryEntry.display,
              system: categoryEntry.system
            }
          ]
        : undefined

      // Addresses
      const addresses =
        values.referenceType && values.referenceId
          ? [{ referenceType: values.referenceType, referenceId: values.referenceId }]
          : undefined

      await createGoal.mutateAsync({
        encounterId,
        patientId: patientData.patient.id,
        performerId: performerId ? String(performerId) : undefined,
        performerName: performer?.name,
        lifecycleStatus: values.lifecycleStatus,
        description: values.description.trim(),
        priority: values.priority,
        startDate: values.startDate?.toISOString(),
        targets,
        categories,
        addresses
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
        // Kategori
        const cat = record.categories?.[0]
        const catLabel = cat
          ? (GOAL_CATEGORY_MAP[cat.code]?.label ?? cat.display ?? cat.code)
          : null
        return (
          <div>
            <Text strong>{desc}</Text>
            {catLabel && (
              <div>
                <Tag color="purple" className="mt-1 text-xs">
                  {catLabel}
                </Tag>
              </div>
            )}
          </div>
        )
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
        if (!p) return <Text type="secondary">-</Text>
        const colorMap: Record<string, string> = {
          'high-priority': 'red',
          'medium-priority': 'orange',
          'low-priority': 'blue'
        }
        return (
          <Tag color={colorMap[p] ?? 'default'}>{p.replace('-priority', '').toUpperCase()}</Tag>
        )
      }
    },
    {
      title: 'Target Klinis',
      key: 'targets',
      render: (_: any, record: any) => {
        const targets: any[] = record.targets ?? []
        if (!targets.length)
          return (
            <Text type="secondary" className="text-xs">
              Tidak ada target
            </Text>
          )
        return (
          <div className="space-y-1">
            {targets.map((t: any, i: number) => (
              <div key={i} className="text-xs">
                {t.measureDisplay && (
                  <span className="font-medium text-blue-600">{t.measureDisplay}</span>
                )}
                {t.detailString && (
                  <Tag color="green" className="ml-1">
                    {t.detailString}
                  </Tag>
                )}
                {t.detailQuantityValue != null && (
                  <Tag color="cyan" className="ml-1">
                    {t.detailQuantityValue} {t.detailQuantityUnit}
                  </Tag>
                )}
                {t.dueDate && (
                  <div className="text-gray-400 mt-0.5">
                    s/d {dayjs(t.dueDate).format('DD/MM/YYYY')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
    },
    {
      title: 'Referensi',
      key: 'addresses',
      width: 150,
      render: (_: any, record: any) => {
        const addresses: any[] = record.addresses ?? []
        if (!addresses.length)
          return (
            <Text type="secondary" className="text-xs">
              -
            </Text>
          )
        return (
          <div className="space-y-1">
            {addresses.map((a: any, i: number) => (
              <div key={i} className="text-xs">
                <Tag color="geekblue">{a.referenceType}</Tag>
                {a.display && <div className="text-gray-500 mt-0.5">{a.display}</div>}
              </div>
            ))}
          </div>
        )
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
          loading={isLoadingGoals}
          pagination={{ pageSize: 10 }}
          className="border-none"
          size="small"
          locale={{ emptyText: 'Belum ada tujuan perawatan' }}
          expandable={{
            expandedRowRender: (record: any) => {
              const targets: any[] = record.targets ?? []
              const addresses: any[] = record.addresses ?? []
              const notes: any[] = record.notes ?? []

              return (
                <div className="p-2 space-y-3 bg-gray-50 rounded">
                  {targets.length > 0 && (
                    <div>
                      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                        Target Klinis
                      </Text>
                      <div className="space-y-1">
                        {targets.map((t: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-xs bg-white border border-gray-100 rounded px-2 py-1"
                          >
                            <span className="text-blue-600 font-medium min-w-max">
                              {t.measureDisplay ?? t.measureCode ?? '-'}
                            </span>
                            <span className="text-gray-400">→</span>
                            {t.detailString && (
                              <Tag color="green" className="m-0">
                                {t.detailString}
                              </Tag>
                            )}
                            {t.detailQuantityValue != null && (
                              <Tag color="cyan" className="m-0">
                                {t.detailQuantityValue} {t.detailQuantityUnit}
                              </Tag>
                            )}
                            {t.dueDate && (
                              <span className="text-gray-400 ml-auto">
                                s/d {dayjs(t.dueDate).format('DD/MM/YYYY')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {addresses.length > 0 && (
                    <div>
                      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                        Referensi Terkait
                      </Text>
                      <div className="flex flex-wrap gap-1">
                        {addresses.map((a: any, i: number) => (
                          <div
                            key={i}
                            className="text-xs bg-white border border-gray-100 rounded px-2 py-1 flex items-center gap-1"
                          >
                            <Tag color="geekblue" className="m-0">
                              {a.referenceType}
                            </Tag>
                            {a.display && <span className="text-gray-500">{a.display}</span>}
                            {!a.display && (
                              <span className="text-gray-400 font-mono">
                                {a.referenceId?.slice(0, 8)}…
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {notes.length > 0 && (
                    <div>
                      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                        Catatan
                      </Text>
                      {notes.map((n: any, i: number) => (
                        <div
                          key={i}
                          className="text-xs bg-white border border-gray-100 rounded px-2 py-1"
                        >
                          <span className="font-medium text-gray-700">
                            {n.authorName ?? `ID: ${n.authorId}`}
                          </span>
                          <span className="text-gray-400 ml-2">
                            {n.time ? dayjs(n.time).format('DD/MM/YYYY HH:mm') : ''}
                          </span>
                          <div className="text-gray-600 mt-0.5">{n.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            },
            rowExpandable: (record: any) =>
              (record.targets?.length ?? 0) > 0 ||
              (record.addresses?.length ?? 0) > 0 ||
              (record.notes?.length ?? 0) > 0
          }}
        />
      </Card>

      <Modal
        title="Input Tujuan Perawatan Baru"
        open={modalOpen}
        onCancel={() => {
          form.resetFields()
          setModalOpen(false)
        }}
        footer={[
          <Button
            key="back"
            onClick={() => {
              form.resetFields()
              setModalOpen(false)
            }}
          >
            Batal
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<SaveOutlined />}
            loading={createGoal.isPending}
            onClick={() => form.submit()}
          >
            Simpan Tujuan
          </Button>
        ]}
        width={900}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="pt-4 space-y-4! flex! flex-col!"
          initialValues={{
            lifecycleStatus: 'planned',
            priority: 'medium-priority',
            startDate: dayjs(),
            targets: [{ detailType: 'snomed' }]
          }}
        >
          {!hideHeader && (
            <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
          )}

          {hideHeader && !globalPerformerId && (
            <Alert
              type="warning"
              showIcon
              message="Pilih Petugas Pemeriksa terlebih dahulu di bagian atas halaman sebelum menyimpan."
              className="mb-2"
            />
          )}

          {/* ── Kategori & Deskripsi ── */}
          <Row gutter={12} className="mt-2">
            <Col span={10}>
              <Form.Item
                name="category"
                label="Kategori Tujuan"
                rules={[{ required: true, message: 'Wajib memilih kategori' }]}
                className="mb-3"
              >
                <Select options={CATEGORY_OPTIONS} placeholder="Pilih kategori..." />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item
                name="description"
                label="Deskripsi Tujuan Perawatan"
                rules={[{ required: true, message: 'Deskripsi wajib diisi' }]}
                className="mb-3"
              >
                <TextArea
                  rows={2}
                  placeholder="Contoh: Perawatan dilakukan untuk mengatasi gejala DBD..."
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Status & Prioritas ── */}
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item
                name="lifecycleStatus"
                label="Status"
                rules={[{ required: true }]}
                className="mb-3"
              >
                <Select options={LIFECYCLE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="Prioritas" className="mb-3">
                <Select options={PRIORITY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="startDate" label="Tanggal Perencanaan" className="mb-3">
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" className="text-sm! my-1!">
            Referensi Terkait
          </Divider>

          <Row gutter={12}>
            <Col span={10}>
              <Form.Item name="referenceType" label="Tipe Referensi" className="mb-3">
                <Select
                  allowClear
                  placeholder="Pilih tipe referensi..."
                  options={GOAL_ADDRESS_REFERENCE_TYPES.map((r) => ({
                    value: r.value,
                    label: r.label
                  }))}
                  onChange={() => form.setFieldsValue({ referenceId: undefined })}
                />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item name="referenceId" label="Data Referensi" className="mb-3">
                <Select
                  allowClear
                  showSearch
                  placeholder={referenceType ? 'Pilih data...' : 'Pilih tipe referensi dulu'}
                  disabled={!referenceType}
                  loading={isLoadingReference}
                  options={referenceOptions}
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" className="text-sm! my-1!">
            Target Klinis
          </Divider>

          {/* ── Multi-Target Form.List ── */}
          <Form.List name="targets">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    className="mb-2"
                    extra={
                      fields.length > 1 ? (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          size="small"
                          onClick={() => remove(name)}
                        >
                          Hapus
                        </Button>
                      ) : null
                    }
                    title={<span className="text-xs text-gray-500">Target #{name + 1}</span>}
                  >
                    <Row gutter={12}>
                      {/* Measure (LOINC) */}
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'measureCode']}
                          label="Indikator / Ukuran (LOINC)"
                          rules={[{ required: true, message: 'Wajib dipilih' }]}
                          className="mb-2"
                        >
                          <Select
                            showSearch
                            placeholder="Pilih indikator..."
                            options={MEASURE_OPTIONS}
                            filterOption={(input, option) =>
                              String(option?.label ?? '')
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                          />
                        </Form.Item>
                      </Col>

                      {/* Tipe Detail */}
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'detailType']}
                          label="Tipe Detail Pencapaian"
                          initialValue="snomed"
                          className="mb-2"
                        >
                          <Select
                            options={[
                              { value: 'snomed', label: 'Kode SNOMED (Normal/Stabil/dll)' },
                              { value: 'quantity', label: 'Nilai Numerik (Kuantitas)' },
                              { value: 'string', label: 'Teks Bebas' }
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Detail berdasarkan tipe */}
                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, cur) =>
                        prev.targets?.[name]?.detailType !== cur.targets?.[name]?.detailType
                      }
                    >
                      {({ getFieldValue }) => {
                        const detailType = getFieldValue(['targets', name, 'detailType'])

                        if (detailType === 'snomed') {
                          return (
                            <Form.Item
                              {...restField}
                              name={[name, 'detailSnomed']}
                              label="Target Pencapaian (SNOMED)"
                              rules={[{ required: true, message: 'Wajib dipilih' }]}
                            >
                              <Select
                                placeholder="Pilih target pencapaian..."
                                options={DETAIL_SNOMED_OPTIONS}
                              />
                            </Form.Item>
                          )
                        }

                        if (detailType === 'quantity') {
                          return (
                            <Row gutter={12}>
                              <Col span={10}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'detailQuantityValue']}
                                  label="Nilai Target"
                                  rules={[{ required: true, message: 'Wajib diisi' }]}
                                >
                                  <Input type="number" placeholder="cth: 120" />
                                </Form.Item>
                              </Col>
                              <Col span={14}>
                                <Form.Item
                                  {...restField}
                                  name={[name, 'detailQuantityUnit']}
                                  label="Satuan"
                                >
                                  <Input placeholder="cth: mm[Hg], kg, mg/dL" />
                                </Form.Item>
                              </Col>
                            </Row>
                          )
                        }

                        return (
                          <Form.Item
                            {...restField}
                            name={[name, 'detailString']}
                            label="Keterangan Target"
                            rules={[{ required: true, message: 'Wajib diisi' }]}
                          >
                            <Input placeholder="Deskripsi target pencapaian..." />
                          </Form.Item>
                        )
                      }}
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'dueDate']}
                      label="Target Tanggal Selesai"
                      className="mb-0"
                    >
                      <DatePicker className="w-full" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Card>
                ))}

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add({ detailType: 'snomed' })}
                    icon={<PlusOutlined />}
                    block
                  >
                    Tambah Target
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  )
}
