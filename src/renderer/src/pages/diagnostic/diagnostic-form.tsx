import { Form, Input, Button, DatePicker, Select, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import type {
  DiagnosticReportAttributes,
  DiagnosticReportCreationAttributes
} from '@shared/diagnostic'
import { DiagnosticReportStatus } from '@shared/diagnostic'
import dayjs, { type Dayjs } from 'dayjs'

type DiagnosticFormValues = Omit<
  DiagnosticReportAttributes,
  'effectiveDateTime' | 'issued' | 'effectivePeriodStart' | 'effectivePeriodEnd'
> & {
  effectiveDateTime?: Dayjs
  issued?: Dayjs
  effectivePeriodStart?: Dayjs
  effectivePeriodEnd?: Dayjs
}

function DiagnosticForm() {
  const [form] = Form.useForm<DiagnosticFormValues>()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const params = useParams<{ id: string }>()
  const isEdit = !!params.id

  const detail = useQuery({
    queryKey: ['diagnostic', 'detail', params.id],
    queryFn: () => {
      const fn = window.api?.query?.diagnostic?.getById
      if (!fn || !params.id) throw new Error('API diagnostic tidak tersedia')
      return fn({ id: Number(params.id) })
    },
    enabled: isEdit
  })

  // Fetch patients for Subject selection
  const patientsQuery = useQuery({
    queryKey: ['patient', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.patient?.list
      if (!fn) throw new Error('API patient tidak tersedia')
      return fn()
    }
  })

  const formattedPatients =
    (patientsQuery.data?.data as any[])?.map((p) => ({
      label: `${p.name} (${p.kode})`,
      value: p.id
    })) || []

  const encountersQuery = useQuery({
    queryKey: ['encounter', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia')
      return fn()
    }
  })

  const formattedEncounters =
    (encountersQuery.data?.data as any[])?.map((e) => ({
      label: `Encounter: ${e.visitDate ? dayjs(e.visitDate).format('YYYY-MM-DD HH:mm') : ''} - ${e.status} (${e.serviceType})`,
      value: e.id
    })) || []

  useEffect(() => {
    const item = detail.data?.data as Partial<DiagnosticReportAttributes> | undefined
    console.log('Diagnostic detail:', item)
    if (item) {
      //@ts-expect-error - type mismatch
      form.setFieldsValue({
        ...item,
        subjectId: item.subjectId,
        status: item.status as any, // Ensure literal type match
        effectiveDateTime: item.effectiveDateTime ? dayjs(item.effectiveDateTime) : undefined,
        issued: item.issued ? dayjs(item.issued) : undefined,
        effectivePeriodStart: item.effectivePeriodStart
          ? dayjs(item.effectivePeriodStart)
          : undefined,
        effectivePeriodEnd: item.effectivePeriodEnd ? dayjs(item.effectivePeriodEnd) : undefined,
        media: item.media || undefined
      })
    }
  }, [detail.data, form])

  const createMutation = useMutation({
    mutationKey: ['diagnostic', 'create'],
    mutationFn: async (payload: DiagnosticReportCreationAttributes) => {
      const createFn = window.api?.query?.diagnostic?.create
      if (!createFn) {
        throw new Error('API diagnostic tidak tersedia. Silakan restart aplikasi/dev server.')
      }
      const result = await createFn(payload)
      if (!result.success) throw new Error(result.error || 'Failed to create diagnostic')
      return result
    },
    onSuccess: () => {
      message.success('Diagnostic report saved')
      form.resetFields()
      navigate('/dashboard/diagnostic')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['diagnostic', 'update'],
    mutationFn: async (payload: DiagnosticReportAttributes) => {
      const updateFn = window.api?.query?.diagnostic?.update
      if (!updateFn) throw new Error('API diagnostic tidak tersedia')
      const result = await updateFn(payload)
      if (!result.success) throw new Error(result.error || 'Failed to update diagnostic')
      return result
    },
    onSuccess: () => {
      message.success('Diagnostic report updated')
      navigate('/dashboard/diagnostic')
    }
  })

  const onFinish = async (values: DiagnosticFormValues) => {
    try {
      setSubmitting(true)

      const payload: any = {
        ...values,
        effectiveDateTime: values.effectiveDateTime?.toDate(),
        issued: values.issued?.toDate(),
        effectivePeriodStart: values.effectivePeriodStart?.toDate(),
        effectivePeriodEnd: values.effectivePeriodEnd?.toDate()
      }

      if (isEdit && params.id) {
        await updateMutation.mutateAsync({ ...payload, id: Number(params.id) })
      } else {
        await createMutation.mutateAsync(payload)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="my-4">
      <h2 className="text-2xl font-bold mb-4">
        {isEdit ? 'Edit Diagnostic Report' : 'New Diagnostic Report'}
      </h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="w-full"
        initialValues={{ status: DiagnosticReportStatus.REGISTERED }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="Code (LOINC)"
            name="code"
            rules={[{ required: true, message: 'Code is required' }]}
          >
            <Input placeholder="Diagnostic code" />
          </Form.Item>

          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select>
              {Object.values(DiagnosticReportStatus).map((s) => (
                <Select.Option key={s} value={s}>
                  {s}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Subject (Patient)"
            name="subjectId"
            rules={[{ required: true, message: 'Patient is required' }]}
          >
            <Select
              showSearch
              placeholder="Select Patient"
              optionFilterProp="children"
              disabled={form.getFieldValue('subjectId')}
              options={formattedPatients}
              loading={patientsQuery.isLoading}
            />
          </Form.Item>

          <Form.Item label="Encounter" name="encounterId">
            <Select
              allowClear
              showSearch
              placeholder="Select Encounter (Optional)"
              optionFilterProp="children"
              options={formattedEncounters}
              loading={encountersQuery.isLoading}
              onChange={(value) => {
                const encounter = (encountersQuery.data?.data as any[])?.find((e) => e.id === value)
                if (encounter && encounter.patientId) {
                  form.setFieldsValue({ subjectId: encounter.patientId })
                }
              }}
            />
          </Form.Item>

          <Form.Item label="Effective Date" name="effectiveDateTime">
            <DatePicker showTime className="w-full" />
          </Form.Item>

          <Form.Item label="Issued Date" name="issued">
            <DatePicker showTime className="w-full" />
          </Form.Item>

          <Form.Item label="Conclusion" name="conclusion" className="col-span-2">
            <Input.TextArea rows={3} placeholder="Clinical conclusion" />
          </Form.Item>
        </div>

        <Form.Item className="text-right mt-4">
          <Button type="primary" htmlType="submit" className="mr-2" loading={submitting}>
            {isEdit ? 'Update' : 'Save'}
          </Button>
          <Button
            htmlType="button"
            onClick={() => {
              form.resetFields()
              navigate('/dashboard/diagnostic')
            }}
          >
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default DiagnosticForm
