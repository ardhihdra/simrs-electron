import { Form, Input, Button, DatePicker, Select, message, Table, Card } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import type {
  ServiceRequestAttributes,
  ServiceRequestStatus,
  ServiceRequestIntent,
  ServiceRequestPriority
} from '@shared/service-request'
import type { PatientAttributes } from '@shared/patient'
import {
  SaveOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons'

// Form values might differ slightly from attributes (e.g. Dayjs instead of Date)
type ServiceRequestFormValues = {
  patientId: number
  authoredOn: Dayjs
  serviceText: string
  status: ServiceRequestStatus
  intent: ServiceRequestIntent
  priority: ServiceRequestPriority
  note?: string
  performer?: string
  requester?: string
  referral?: string
  labResults?: Array<{
    key: number
    bidang: string
    nama: string
    detail: string
    hasil: string
    rujukan: string
    satuan: string
    status: string
    keterangan: string
  }>
}

function ServiceRequestForm() {
  const [form] = Form.useForm<ServiceRequestFormValues>()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const params = useParams<{ id: string }>()
  const isEdit = !!params.id

  const patients = useQuery({
    queryKey: ['patient', 'list'],
    queryFn: () => {
      // @ts-ignore - dynamic API call not typed in window
      const fn = window.api?.query?.patient?.list
      if (!fn) throw new Error('API patient tidak tersedia')
      return fn()
    }
  })

  const detail = useQuery({
    queryKey: ['serviceRequest', 'detail', params.id],
    queryFn: () => {
      // @ts-ignore - dynamic API call not typed in window
      const fn = window.api?.query?.serviceRequest?.getById
      if (!fn || !params.id) throw new Error('API serviceRequest tidak tersedia')
      return fn({ id: Number(params.id) })
    },
    enabled: isEdit
  })

  // Watch patientId to display details
  const selectedPatientId = Form.useWatch('patientId', form)
  const selectedPatient = (patients.data?.data as PatientAttributes[] | undefined)?.find(
    (p) => p.id === selectedPatientId
  )

  useEffect(() => {
    const item = detail.data?.data as Partial<ServiceRequestAttributes> | undefined
    if (item) {
      // Extract patient ID from subject.reference "Patient/123"
      let pId: number | undefined
      const subjectRef = item.subject?.reference
      if (subjectRef) {
        const parts = subjectRef.split('/')
        if (parts.length === 2 && parts[0] === 'Patient') {
          pId = Number(parts[1])
        }
      }

      // Parse lab results and user note from notes
      const notes = item.note || []
      const resultNote = notes.find((n) => n.text?.startsWith('LAB_RESULTS:'))
      const userNote = notes.find((n) => !n.text?.startsWith('LAB_RESULTS:'))

      let parsedResults = undefined
      if (resultNote && resultNote.text) {
        try {
          parsedResults = JSON.parse(resultNote.text.substring(12))
        } catch (e) {
          console.error('Failed to parse lab results', e)
        }
      }

      form.setFieldsValue({
        patientId: pId,
        authoredOn: item.authoredOn ? dayjs(item.authoredOn) : dayjs(),
        serviceText: item.code?.text || item.code?.coding?.[0]?.display,
        status: item.status,
        intent: item.intent,
        priority: item.priority || undefined,
        note: userNote?.text,
        performer: item.performer?.[0]?.display,
        requester: item.requester?.display,
        referral: item.reason?.[0]?.text,
        labResults: parsedResults
      })
    } else if (!isEdit) {
      // Defaults
      form.setFieldsValue({
        authoredOn: dayjs(),
        status: 'active' as ServiceRequestStatus,
        intent: 'order' as ServiceRequestIntent,
        priority: 'routine' as ServiceRequestPriority,
        requester: '',
        labResults: [
          {
            key: 1,
            bidang: '',
            nama: '',
            detail: '',
            hasil: '',
            rujukan: '',
            satuan: '',
            status: 'draft',
            keterangan: ''
          }
        ]
      })
    }
  }, [detail.data, form, isEdit])

  // Watch serviceText to update default lab result name if not edited yet
  const serviceText = Form.useWatch('serviceText', form)
  useEffect(() => {
    if (!isEdit && serviceText) {
      const currentResults = form.getFieldValue('labResults')
      if (currentResults && currentResults.length === 1 && currentResults[0].nama !== serviceText) {
        form.setFieldsValue({
          labResults: [
            {
              ...currentResults[0],
              nama: serviceText,
              detail: serviceText
            }
          ]
        })
      }
    }
  }, [serviceText, form, isEdit])

  const createMutation = useMutation({
    mutationKey: ['serviceRequest', 'create'],
    mutationFn: async (payload: ServiceRequestAttributes) => {
      // @ts-ignore - dynamic API call not typed in window
      const fn = window.api?.query?.serviceRequest?.create
      if (!fn) throw new Error('API serviceRequest tidak tersedia')
      const result = await fn(payload)
      if (!result.success) throw new Error(result.error || 'Failed to create service request')
      return result
    },
    onSuccess: () => {
      message.success('Permintaan Lab berhasil disimpan')
      navigate('/dashboard/service-request')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['serviceRequest', 'update'],
    mutationFn: async (payload: ServiceRequestAttributes & { id: number }) => {
      // @ts-ignore - dynamic API call not typed in window
      const fn = window.api?.query?.serviceRequest?.update
      if (!fn) throw new Error('API serviceRequest tidak tersedia')
      const result = await fn({ ...payload, id: payload.id })
      if (!result.success) throw new Error(result.error || 'Failed to update service request')
      return result
    },
    onSuccess: () => {
      message.success('Permintaan Lab berhasil diperbarui')
      navigate('/dashboard/service-request')
    }
  })

  const onFinish = async (values: ServiceRequestFormValues) => {
    try {
      setSubmitting(true)

      const patient = (patients.data?.data as PatientAttributes[] | undefined)?.find(
        (p) => p.id === values.patientId
      )

      const payload: ServiceRequestAttributes = {
        resourceType: 'ServiceRequest',
        status: values.status,
        intent: values.intent,
        priority: values.priority,
        code: {
          text: values.serviceText
        },
        subject: {
          reference: `Patient/${values.patientId}`,
          display: patient?.name
        },
        authoredOn: values.authoredOn.toDate(),
        // Combine note and labResults into notes array
        note: [
          ...(values.note ? [{ text: values.note, time: new Date() }] : []),
          ...(values.labResults
            ? [{ text: 'LAB_RESULTS:' + JSON.stringify(values.labResults), time: new Date() }]
            : [])
        ],
        performer: values.performer ? [{ display: values.performer }] : undefined,
        requester: values.requester ? { display: values.requester } : undefined,
        reason: values.referral ? [{ text: values.referral }] : undefined
      }

      if (isEdit && params.id) {
        await updateMutation.mutateAsync({ ...payload, id: Number(params.id) })
      } else {
        await createMutation.mutateAsync(payload)
      }
    } catch (err: unknown) {
      console.error(err)
      message.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { title: 'No.', render: (_: unknown, __: unknown, index: number) => index + 1, width: 50 },
    {
      title: 'Bidang',
      dataIndex: 'bidang',
      render: (_: unknown, field: { name: number }) => (
        <Form.Item name={[field.name, 'bidang']} noStyle>
          <Input />
        </Form.Item>
      )
    },
    {
      title: 'Nama Pemeriksaan',
      dataIndex: 'nama',
      render: (_: unknown, field: { name: number }) => (
        <Form.Item name={[field.name, 'nama']} noStyle>
          <Input />
        </Form.Item>
      )
    },
    {
      title: 'Detail Pemeriksaan',
      dataIndex: 'detail',
      render: (_: unknown, field: { name: number }) => (
        <Form.Item name={[field.name, 'detail']} noStyle>
          <Input />
        </Form.Item>
      )
    },
    {
      title: 'Hasil',
      dataIndex: 'hasil',
      render: (_: unknown, field: { name: number }) => (
        <Form.Item name={[field.name, 'hasil']} noStyle>
          <Input />
        </Form.Item>
      )
    },
    {
      title: 'Nilai Rujukan',
      dataIndex: 'rujukan',
      render: (_: unknown, field: { name: number }) => (
        <Form.Item name={[field.name, 'rujukan']} noStyle>
          <Input />
        </Form.Item>
      )
    },
    {
      title: 'Satuan',
      dataIndex: 'satuan',
      render: (_: unknown, field: { name: number }) => (
        <Form.Item name={[field.name, 'satuan']} noStyle>
          <Input />
        </Form.Item>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (_: unknown, field: { name: number }) => (
        <Form.Item name={[field.name, 'status']} noStyle>
          <Select style={{ width: 120 }}>
            <Select.Option value="draft">Draft</Select.Option>
            <Select.Option value="normal">Normal</Select.Option>
            <Select.Option value="high">High</Select.Option>
            <Select.Option value="low">Low</Select.Option>
          </Select>
        </Form.Item>
      )
    },
    {
      title: 'Keterangan',
      dataIndex: 'keterangan',
      render: (_: unknown, field: { name: number }) => (
        <Form.Item name={[field.name, 'keterangan']} noStyle>
          <Input />
        </Form.Item>
      )
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_: unknown, field: { name: number }) => (
        <DeleteOutlined
          className="text-red-500 cursor-pointer hover:text-red-700"
          onClick={() => {
            const current = form.getFieldValue('labResults') || []
            const newResults = current.filter((_: unknown, idx: number) => idx !== field.name)
            form.setFieldsValue({ labResults: newResults })
          }}
        />
      )
    }
  ]

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Card className="">
        <div className="text-center text-2xl font-bold mb-6 text-gray-700">
          Pemeriksaan Laboratorium
        </div>

        <Form
          form={form}
          layout="horizontal"
          onFinish={onFinish}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {/* Left Column - Patient Info */}
            <div>
              <Form.Item label="No. RM">
                <Input readOnly value={selectedPatient?.identifier || '-'} className="bg-gray-50" />
              </Form.Item>
              <Form.Item label="Pasien" name="patientId" rules={[{ required: true }]}>
                <Select
                  placeholder="Pilih Pasien"
                  showSearch
                  optionFilterProp="children"
                  loading={patients.isLoading}
                >
                  {(patients.data?.data as PatientAttributes[] | undefined)?.map((p) => (
                    <Select.Option key={String(p.id)} value={p.id!}>
                      {p.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Jaminan Pasien">
                <Input readOnly value="UMUM" className="bg-gray-50" />
              </Form.Item>
              <Form.Item label="Umur">
                <Input
                  readOnly
                  value={
                    selectedPatient?.birthDate
                      ? `${dayjs().diff(selectedPatient.birthDate, 'year')} Tahun`
                      : '-'
                  }
                  className="bg-gray-50"
                />
              </Form.Item>
              <Form.Item label="Alamat">
                <Input.TextArea
                  readOnly
                  value={selectedPatient?.addressLine || '-'}
                  rows={2}
                  className="bg-gray-50"
                />
              </Form.Item>
            </div>

            {/* Right Column - Request Info */}
            <div>
              <Form.Item label="No. Faktur">
                <Input
                  readOnly
                  value={isEdit ? `INV-${params.id}` : 'AUTO'}
                  className="bg-gray-50"
                />
              </Form.Item>
              <Form.Item label="Tanggal" name="authoredOn" rules={[{ required: true }]}>
                <DatePicker showTime className="w-full" format="DD MMM YYYY HH:mm:ss" />
              </Form.Item>
              <Form.Item label="Rujukan" name="referral">
                <Input placeholder="" />
              </Form.Item>
              <Form.Item label="Dokter" name="requester">
                <Input />
              </Form.Item>
              <Form.Item label="Performer" name="performer">
                <Select placeholder="Pilih Performer">
                  <Select.Option value="Petugas A">Petugas A</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Catatan / Kesimpulan" name="note">
                <Input.TextArea rows={2} />
              </Form.Item>

              {/* Hidden fields for required FHIR attributes not shown in UI */}
              <Form.Item name="serviceText" hidden initialValue="General Checkup">
                <Input />
              </Form.Item>
              <Form.Item name="status" hidden initialValue="active">
                <Input />
              </Form.Item>
              <Form.Item name="intent" hidden initialValue="order">
                <Input />
              </Form.Item>
              <Form.Item name="priority" hidden initialValue="routine">
                <Input />
              </Form.Item>
            </div>
          </div>

          <div className="flex gap-2 mt-6 mb-6">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={submitting}
              className="bg-green-600 hover:bg-green-700 border-none"
            >
              Selesai
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => form.resetFields()}>
              Reset
            </Button>
            <Button
              type="primary"
              danger
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard/service-request')}
            >
              Kembali
            </Button>
          </div>

          <Form.List name="labResults">
            {(fields, { add }) => (
              <>
                <Table
                  dataSource={fields}
                  columns={columns}
                  pagination={false}
                  bordered
                  size="small"
                  rowKey="key"
                />
                <div className="mt-2">
                  <Button
                    type="dashed"
                    onClick={() =>
                      add({
                        key: Date.now(),
                        bidang: '',
                        nama: '',
                        detail: '',
                        hasil: '',
                        rujukan: '',
                        satuan: '',
                        status: 'draft',
                        keterangan: ''
                      })
                    }
                    block
                    icon={<PlusOutlined />}
                  >
                    Tambah Pemeriksaan
                  </Button>
                </div>
              </>
            )}
          </Form.List>
        </Form>
      </Card>
    </div>
  )
}

export default ServiceRequestForm
