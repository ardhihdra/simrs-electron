import { Form, Input, Button, TimePicker, message } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'

interface DoctorScheduleFormValues {
  doctorName: string
  poli: string
  monday?: Dayjs[]
  tuesday?: Dayjs[]
  wednesday?: Dayjs[]
  thursday?: Dayjs[]
  friday?: Dayjs[]
  saturday?: Dayjs[]
  sunday?: Dayjs[]
}

type DoctorScheduleItem = {
  id?: number
  doctorName: string
  poli: string
  monday?: string | null
  tuesday?: string | null
  wednesday?: string | null
  thursday?: string | null
  friday?: string | null
  saturday?: string | null
  sunday?: string | null
}

function toRangeString(v?: Dayjs[]): string | null {
  if (!v || v.length !== 2 || !v[0] || !v[1]) return null
  return `${v[0].format('HH:mm')}-${v[1].format('HH:mm')}`
}

function toRangeValue(s?: string | null): Dayjs[] | undefined {
  if (!s) return undefined
  const parts = String(s).split('-')
  if (parts.length !== 2) return undefined
  const start = dayjs(parts[0], 'HH:mm')
  const end = dayjs(parts[1], 'HH:mm')
  if (!start.isValid() || !end.isValid()) return undefined
  return [start, end]
}

export default function DoctorScheduleForm() {
  const [form] = Form.useForm<DoctorScheduleFormValues>()
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const isEdit = !!params.id
  const [submitting, setSubmitting] = useState(false)

  const detail = useQuery({
    queryKey: ['doctorSchedule', 'detail', params.id],
    queryFn: () => {
      const fn = window.api?.query?.doctorSchedule?.getById
      if (!fn || !params.id) throw new Error('API jadwal dokter tidak tersedia')
      return fn({ id: Number(params.id) })
    },
    enabled: isEdit
  })

  useEffect(() => {
    const item = detail.data?.data as DoctorScheduleItem | undefined
    if (item) {
      form.setFieldsValue({
        doctorName: item.doctorName,
        poli: item.poli,
        monday: toRangeValue(item.monday),
        tuesday: toRangeValue(item.tuesday),
        wednesday: toRangeValue(item.wednesday),
        thursday: toRangeValue(item.thursday),
        friday: toRangeValue(item.friday),
        saturday: toRangeValue(item.saturday),
        sunday: toRangeValue(item.sunday)
      })
    }
  }, [detail.data, form])

  const createMutation = useMutation({
    mutationKey: ['doctorSchedule', 'create'],
    mutationFn: async (payload: DoctorScheduleItem) => {
      const fn = window.api?.query?.doctorSchedule?.create
      if (!fn) throw new Error('API jadwal dokter tidak tersedia')
      const result = await fn(payload)
      if (!result.success) throw new Error(result.error || 'Gagal menyimpan jadwal dokter')
      return result
    },
    onSuccess: () => {
      message.success('Jadwal dokter berhasil disimpan')
      form.resetFields()
      navigate('/dashboard/registration/doctor-schedule')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['doctorSchedule', 'update'],
    mutationFn: async (payload: DoctorScheduleItem & { id: number }) => {
      const fn = window.api?.query?.doctorSchedule?.update
      if (!fn) throw new Error('API jadwal dokter tidak tersedia')
      const result = await fn(payload)
      if (!result.success) throw new Error(result.error || 'Gagal memperbarui jadwal dokter')
      return result
    },
    onSuccess: () => {
      message.success('Jadwal dokter berhasil diperbarui')
      navigate('/dashboard/registration/doctor-schedule')
    }
  })

  const onFinish = async (values: DoctorScheduleFormValues) => {
    try {
      setSubmitting(true)
      const payload: DoctorScheduleItem = {
        doctorName: values.doctorName,
        poli: values.poli,
        monday: toRangeString(values.monday),
        tuesday: toRangeString(values.tuesday),
        wednesday: toRangeString(values.wednesday),
        thursday: toRangeString(values.thursday),
        friday: toRangeString(values.friday),
        saturday: toRangeString(values.saturday),
        sunday: toRangeString(values.sunday)
      }
      if (isEdit) {
        await updateMutation.mutateAsync({ ...payload, id: Number(params.id) })
      } else {
        await createMutation.mutateAsync(payload)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      message.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="my-4">
      <Form form={form} layout="vertical" onFinish={onFinish} className="w-full">
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="Nama Dokter" name="doctorName" rules={[{ required: true, message: 'Nama dokter wajib' }]}>
            <Input placeholder="Nama dokter" />
          </Form.Item>
          <Form.Item label="Poli" name="poli" rules={[{ required: true, message: 'Poli wajib' }]}>
            <Input placeholder="Poli" />
          </Form.Item>
          <Form.Item label="Senin" name="monday">
            <TimePicker.RangePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item label="Selasa" name="tuesday">
            <TimePicker.RangePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item label="Rabu" name="wednesday">
            <TimePicker.RangePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item label="Kamis" name="thursday">
            <TimePicker.RangePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item label="Jumat" name="friday">
            <TimePicker.RangePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item label="Sabtu" name="saturday">
            <TimePicker.RangePicker format="HH:mm" className="w-full" />
          </Form.Item>
          <Form.Item label="Minggu" name="sunday">
            <TimePicker.RangePicker format="HH:mm" className="w-full" />
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
              navigate('/dashboard/registration/doctor-schedule')
            }}
          >
            Batal
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
