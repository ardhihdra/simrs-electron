import {
  App,
  Button,
  Card,
  Col,
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
import { PlusOutlined, MedicineBoxOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useState } from 'react'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import {
  useClinicalImpressionByEncounter,
  useSaveClinicalImpression
} from '@renderer/hooks/query/use-clinical-impression'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'

const { TextArea } = Input
const { Text } = Typography

interface PrognosisFormProps {
  encounterId: string
  patientData: { patient: { id: string; name?: string } }
}

const PROGNOSIS_CODE_OPTIONS = [
  { value: 'prognosis-good', label: 'Baik (Good)' },
  { value: 'prognosis-fair', label: 'Cukup (Fair)' },
  { value: 'prognosis-poor', label: 'Buruk (Poor)' },
  { value: 'prognosis-uncertain', label: 'Tidak Pasti (Uncertain)' },
  { value: 'prognosis-favorable', label: 'Menguntungkan (Favorable)' },
  { value: 'prognosis-unfavorable', label: 'Tidak Menguntungkan (Unfavorable)' }
]

const PROGNOSIS_TAG_COLOR: Record<string, string> = {
  'prognosis-good': 'green',
  'prognosis-favorable': 'green',
  'prognosis-fair': 'blue',
  'prognosis-uncertain': 'orange',
  'prognosis-poor': 'red',
  'prognosis-unfavorable': 'red'
}

function getPrognosisDisplay(ci: Record<string, unknown>): string {
  const codes = ci.prognosisCodeableConcept as unknown[]
  if (!Array.isArray(codes) || !codes.length) return '-'
  const first = codes[0] as Record<string, unknown>
  return (
    (first?.text as string) ||
    ((first?.coding as Array<Record<string, unknown>>)?.[0]?.display as string) ||
    '-'
  )
}

function getPrognosisCode(ci: Record<string, unknown>): string {
  const codes = ci.prognosisCodeableConcept as unknown[]
  if (!Array.isArray(codes) || !codes.length) return ''
  const first = codes[0] as Record<string, unknown>
  return ((first?.coding as Array<Record<string, unknown>>)?.[0]?.code as string) || ''
}

export const PrognosisForm = ({ encounterId, patientData }: PrognosisFormProps) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])
  const { data: ciData, isLoading } = useClinicalImpressionByEncounter(encounterId)
  const saveMutation = useSaveClinicalImpression()

  const impressions = (ciData?.data ?? []) as Record<string, unknown>[]

  const handleEdit = (record: Record<string, unknown>) => {
    setEditingId(record.id as string)
    const code = getPrognosisCode(record)
    const codes = record.prognosisCodeableConcept as Array<Record<string, unknown>>
    form.setFieldsValue({
      prognosisCode: code,
      prognosisSummary: record.summary as string,
      description: record.description as string
    })
    setModalOpen(true)
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    const performer = (performersData as Array<Record<string, unknown>>)?.find(
      (p): p is Record<string, unknown> => p.id === values.performerId
    )

    const label =
      PROGNOSIS_CODE_OPTIONS.find((o) => o.value === values.prognosisCode)?.label ??
      String(values.prognosisCode ?? '')

    const prognosisCodeableConcept = values.prognosisCode
      ? [
          {
            coding: [
              {
                system: 'http://terminology.kemkes.go.id/CodeSystem/prognosis',
                code: values.prognosisCode,
                display: label
              }
            ],
            text: label
          }
        ]
      : []

    const payload: Record<string, unknown> = {
      encounterId,
      subjectId: patientData.patient.id,
      status: 'completed',
      effectiveDateTime: new Date().toISOString(),
      description: values.description as string,
      summary: values.prognosisSummary as string,
      assessor: performer
        ? { reference: `Practitioner/${performer.id}`, display: performer.name }
        : undefined,
      prognosisCodeableConcept
    }

    if (editingId) {
      payload.id = editingId
    }

    try {
      await saveMutation.mutateAsync(payload)
      message.success(editingId ? 'Prognosis berhasil diperbarui' : 'Prognosis berhasil disimpan')
      form.resetFields()
      setEditingId(null)
      setModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      message.error(`Gagal menyimpan: ${msg}`)
    }
  }

  const columns = [
    {
      title: 'Prognosis',
      key: 'prognosis',
      render: (_: unknown, r: Record<string, unknown>) => {
        const display = getPrognosisDisplay(r)
        const code = getPrognosisCode(r)
        return (
          <Space>
            <Tag color={PROGNOSIS_TAG_COLOR[code] ?? 'default'}>{display}</Tag>
          </Space>
        )
      }
    },
    {
      title: 'Ringkasan',
      dataIndex: 'summary',
      key: 'summary',
      render: (v: string) => v || <Text type="secondary">-</Text>
    },
    {
      title: 'Deskripsi',
      dataIndex: 'description',
      key: 'description',
      render: (v: string) =>
        v ? <Text className="text-sm">{v}</Text> : <Text type="secondary">-</Text>
    },
    {
      title: 'Tanggal',
      key: 'date',
      width: 110,
      render: (_: unknown, r: Record<string, unknown>) => {
        const d = (r.effectiveDateTime as string) || (r.date as string) || (r.createdAt as string)
        return d ? dayjs(d).format('DD/MM/YYYY') : '-'
      }
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 90,
      render: (_: unknown, r: Record<string, unknown>) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(r)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Prognosis"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Tambah Prognosis
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={impressions}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Belum ada data prognosis' }}
          size="small"
        />
      </Card>

      <Modal
        title={
          <>
            <MedicineBoxOutlined className="mr-2" />
            {editingId ? 'Edit Prognosis' : 'Tambah Prognosis Klinis'}
          </>
        }
        open={modalOpen}
        onCancel={() => {
          form.resetFields()
          setEditingId(null)
          setModalOpen(false)
        }}
        footer={null}
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

          <Form.Item
            name="prognosisCode"
            label="Kode Prognosis"
            rules={[{ required: true, message: 'Pilih kode prognosis' }]}
          >
            <Select placeholder="Pilih prognosis klinis..." options={PROGNOSIS_CODE_OPTIONS} />
          </Form.Item>

          <Form.Item name="prognosisSummary" label="Ringkasan Prognosis">
            <Input placeholder="Cth: Prognosis baik dengan kepatuhan obat" />
          </Form.Item>

          <Form.Item name="description" label="Deskripsi Klinis">
            <TextArea
              rows={4}
              placeholder="Jelaskan dasar alasan prognosis klinis, faktor penyulit, rencana tindak lanjut, dll..."
            />
          </Form.Item>

          <Row>
            <Col span={24}>
              <div className="text-xs text-gray-400 mb-3">
                Catatan: Prognosis disimpan sebagai bagian dari FHIR ClinicalImpression resource.
                Field <code>prognosisCodeableConcept</code> menggunakan sistem kode SatuSehat.
              </div>
            </Col>
          </Row>

          <Form.Item>
            <Space className="flex justify-end w-full">
              <Button
                onClick={() => {
                  form.resetFields()
                  setEditingId(null)
                  setModalOpen(false)
                }}
              >
                Batal
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saveMutation.isPending}
              >
                {editingId ? 'Perbarui' : 'Simpan Prognosis'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
