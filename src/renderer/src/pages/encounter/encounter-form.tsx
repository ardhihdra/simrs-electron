import { Form, Input, Button, DatePicker, Select, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import dayjs, { type Dayjs } from 'dayjs'
import type { EncounterAttributes } from '@shared/encounter'

import { SelectPoli } from '@renderer/components/molecules/SelectPoli'
import { SelectKepegawaian } from '@renderer/components/molecules/SelectKepegawaian'
import { useCreateEncounter, useEncounterDetail, useUpdateEncounter } from '@renderer/hooks/query/use-encounter'
import { usePatientOptions } from '@renderer/hooks/query/use-patient'

type EncounterFormValues = Omit<EncounterAttributes, 'visitDate'> & { visitDate: Dayjs }



function EncounterForm() {
  const [form] = Form.useForm<EncounterFormValues>()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const params = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode')
  const isEdit = !!params.id
  const isView = mode === 'view'

  const patients = usePatientOptions()
  const detail = useEncounterDetail(params.id)
  const createMutation = useCreateEncounter()
  const updateMutation = useUpdateEncounter()

  useEffect(() => {
    console.log('Encounter detail data:', detail.data)
    // @ts-ignore - Response type is not fully inferred
    const item = detail.data?.data as Partial<EncounterAttributes> | undefined
    if (item) {
      form.setFieldsValue({
        patientId: String(item.patientId),
        visitDate: item.visitDate ? dayjs(item.visitDate as unknown as string) : dayjs(),
        serviceType: String(item.serviceType),
        reason: item.reason ?? undefined,
        note: item.note ?? undefined,
        status: item.status!
      })
    }
  }, [detail.data, form])

  const onFinish = async (values: EncounterFormValues) => {
    if (isView) return // Prevent submit in view mode

    console.log(values)
    try {
      setSubmitting(true)
      const payload: EncounterAttributes = {
        patientId: values.patientId,
        visitDate: values.visitDate.toDate(),
        serviceType: values.serviceType,
        reason: values.reason ?? null,
        note: values.note ?? null,
        status: values.status
      }
      if (isEdit && params.id) {
        await updateMutation.mutateAsync({ ...payload, id: params.id })
        message.success('Encounter berhasil diperbarui')
        navigate('/dashboard/encounter')
      } else {
        await createMutation.mutateAsync(payload)
        message.success('Encounter berhasil disimpan')
        form.resetFields()
        navigate('/dashboard/encounter')
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      message.error(msg || 'Gagal menyimpan data')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="my-4">
      <Form form={form} layout="vertical" onFinish={onFinish} className="max-w-md mx-auto" disabled={isView}>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="Pasien" name="patientId" rules={[{ required: true, message: 'Pilih pasien' }]}>
            <Select
              placeholder="Pilih pasien"
              loading={patients.isLoading}
              options={patients.data}
              showSearch
              filterOption={(input, option) =>
                (String(option?.label ?? '')).toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item label="Tanggal Kunjungan" name="visitDate" rules={[{ required: true, message: 'Tanggal kunjungan wajib' }]}>
            <DatePicker showTime className="w-full" />
          </Form.Item>

          <Form.Item label="Jenis Layanan" name="serviceType" rules={[{ required: true, message: 'Jenis layanan wajib' }]}>
            <SelectPoli valueType="name" />
          </Form.Item>

          <Form.Item label="Dokter" name="doctorId" rules={[{ required: true, message: 'Dokter wajib' }]}>
            <SelectKepegawaian hakAksesCode="doctor" />
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
          {!isView && (
            <Button type="primary" htmlType="submit" className="mr-2" loading={submitting}>
              {isEdit ? 'Update' : 'Simpan'}
            </Button>
          )}
          <Button
            htmlType="button"
            onClick={() => {
              form.resetFields()
              navigate('/dashboard/encounter')
            }}
          >
            {isView ? 'Kembali' : 'Batal'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default EncounterForm
