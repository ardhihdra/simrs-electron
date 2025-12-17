import { Form, Input, Button, DatePicker, Select, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import type { EncounterAttributes } from '@shared/encounter'
import type { PatientAttributes } from '@shared/patient'

type EncounterFormValues = Omit<EncounterAttributes, 'visitDate'> & { visitDate: Dayjs }

function EncounterForm() {
  const [form] = Form.useForm<EncounterFormValues>()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const params = useParams<{ id: string }>()
  const isEdit = !!params.id

  const patients = useQuery({
    queryKey: ['patient', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.patient?.list
      if (!fn) throw new Error('API patient tidak tersedia')
      return fn()
    }
  })

  const detail = useQuery({
    queryKey: ['encounter', 'detail', params.id],
    queryFn: () => {
      const fn = window.api?.query?.encounter?.getById
      if (!fn || !params.id) throw new Error('API encounter tidak tersedia')
      return fn({ id: Number(params.id) })
    },
    enabled: isEdit
  })

  useEffect(() => {
    const item = detail.data?.data as Partial<EncounterAttributes> | undefined
    if (item) {
      form.setFieldsValue({
        patientId: item.patientId!,
        visitDate: item.visitDate ? dayjs(item.visitDate as unknown as string) : dayjs(),
        serviceType: item.serviceType!,
        reason: item.reason ?? undefined,
        note: item.note ?? undefined,
        status: item.status!
      })
    }
  }, [detail.data, form])

  const createMutation = useMutation({
    mutationKey: ['encounter', 'create'],
    mutationFn: async (payload: EncounterAttributes) => {
      const fn = window.api?.query?.encounter?.create
      if (!fn) throw new Error('API encounter tidak tersedia')
      const result = await fn(payload)
      if (!result.success) throw new Error(result.error || 'Failed to create encounter')
      return result
    },
    onSuccess: () => {
      message.success('Encounter berhasil disimpan')
      form.resetFields()
      navigate('/dashboard/encounter')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['encounter', 'update'],
    mutationFn: async (payload: EncounterAttributes & { id: number }) => {
      const fn = window.api?.query?.encounter?.update
      if (!fn) throw new Error('API encounter tidak tersedia')
      const result = await fn({ ...payload, id: payload.id })
      if (!result.success) throw new Error(result.error || 'Failed to update encounter')
      return result
    },
    onSuccess: () => {
      message.success('Encounter berhasil diperbarui')
      navigate('/dashboard/encounter')
    }
  })

  const onFinish = async (values: EncounterFormValues) => {
    try {
      setSubmitting(true)
      const payload: EncounterAttributes = {
        patientId: Number(values.patientId),
        visitDate: values.visitDate.toDate(),
        serviceType: values.serviceType,
        reason: values.reason ?? null,
        note: values.note ?? null,
        status: values.status
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
      <Form form={form} layout="vertical" onFinish={onFinish} className="max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="Pasien" name="patientId" rules={[{ required: true, message: 'Pilih pasien' }]}>
            <Select placeholder="Pilih pasien" loading={patients.isLoading}>
              {(patients.data?.data as PatientAttributes[] | undefined)?.map((p) => (
                <Select.Option key={String(p.id)} value={p.id!}>
                  {p.name} ({p.kode})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Tanggal Kunjungan" name="visitDate" rules={[{ required: true, message: 'Tanggal kunjungan wajib' }]}>
            <DatePicker showTime className="w-full" />
          </Form.Item>
          <Form.Item label="Jenis Layanan" name="serviceType" rules={[{ required: true, message: 'Jenis layanan wajib' }]}>
            <Input placeholder="Jenis layanan" />
          </Form.Item>
          <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Status wajib' }]}>
            <Select placeholder="Pilih status">
              <Select.Option value="planned">Planned</Select.Option>
              <Select.Option value="arrived">Arrived</Select.Option>
              <Select.Option value="triaged">Triaged</Select.Option>
              <Select.Option value="in-progress">In Progress</Select.Option>
              <Select.Option value="onhold">On Hold</Select.Option>
              <Select.Option value="finished">Finished</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
              <Select.Option value="entered-in-error">Entered in Error</Select.Option>
              <Select.Option value="unknown">Unknown</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Alasan" name="reason">
            <Input placeholder="Alasan kunjungan" />
          </Form.Item>
          <Form.Item label="Catatan" name="note">
            <Input placeholder="Catatan tambahan" />
          </Form.Item>
        </div>
        <Form.Item className="text-right">
          <Button type="primary" htmlType="submit" className="mr-2" loading={submitting}>
            {isEdit ? 'Update' : 'Simpan'}
          </Button>
          <Button
            htmlType="button"
            onClick={() => {
              form.resetFields()
              navigate('/dashboard/encounter')
            }}
          >
            Batal
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default EncounterForm
