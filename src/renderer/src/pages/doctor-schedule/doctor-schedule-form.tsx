import { Button, Card, Checkbox, Divider, Form, Select, Tag, TimePicker } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  SaveOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

interface DaySchedule {
  enabled: boolean
  startTime: string
  endTime: string
}

interface DoctorScheduleFormData {
  idPegawai: number
  idPoli: number
  kategori: string
  senin: DaySchedule
  selasa: DaySchedule
  rabu: DaySchedule
  kamis: DaySchedule
  jumat: DaySchedule
  sabtu: DaySchedule
  minggu: DaySchedule
  status: 'active' | 'inactive'
}

const defaultDaySchedule = {
  enabled: false,
  startTime: dayjs('08:00', 'HH:mm'),
  endTime: dayjs('16:00', 'HH:mm')
}

export function DoctorScheduleForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const isEdit = Boolean(id)

  const { data: detailData } = useQuery({
    queryKey: ['doctorSchedule', 'detail', id],
    queryFn: () => {
      const fn = window.api?.query?.doctorSchedule?.getById
      if (!fn)
        throw new Error('API jadwal dokter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  const { data: pegawaiData } = useQuery({
    queryKey: ['kepegawaian', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.kepegawaian?.list
      if (!fn) throw new Error('API kepegawaian tidak tersedia')
      return fn()
    }
  })

  const { data: poliData } = useQuery({
    queryKey: ['poli', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.poli?.list
      if (!fn) throw new Error('API poli tidak tersedia')
      return fn()
    }
  })

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.result) {
      const data = detailData.result
      const convertDaySchedule = (day: DaySchedule | undefined) => {
        if (!day) return defaultDaySchedule
        return {
          enabled: day.enabled,
          startTime: day.startTime ? dayjs(day.startTime, 'HH:mm') : dayjs('08:00', 'HH:mm'),
          endTime: day.endTime ? dayjs(day.endTime, 'HH:mm') : dayjs('16:00', 'HH:mm')
        }
      }

      const formValues = {
        idPegawai: data.idPegawai,
        idPoli: data.idPoli,
        kategori: data.kategori,
        status: data.status,
        senin: convertDaySchedule(data.senin),
        selasa: convertDaySchedule(data.selasa),
        rabu: convertDaySchedule(data.rabu),
        kamis: convertDaySchedule(data.kamis),
        jumat: convertDaySchedule(data.jumat),
        sabtu: convertDaySchedule(data.sabtu),
        minggu: convertDaySchedule(data.minggu)
      }

      form.setFieldsValue(formValues)
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['doctorSchedule', 'create'],
    mutationFn: (data: DoctorScheduleFormData) => {
      const fn = window.api?.query?.doctorSchedule?.create
      if (!fn)
        throw new Error('API jadwal dokter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn(data)
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['doctorSchedule', 'list'] })
        navigate('/dashboard/registration/doctor-schedule')
      } else {
        console.log('data', data)
        alert(data?.message || 'Gagal membuat jadwal dokter')
      }
    },
    onError: (error: { message: string }) => {
      alert(error?.message || 'Terjadi kesalahan saat membuat jadwal dokter')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['doctorSchedule', 'update'],
    mutationFn: (data: DoctorScheduleFormData & { id: number }) => {
      const fn = window.api?.query?.doctorSchedule?.update
      if (!fn)
        throw new Error('API jadwal dokter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn(data)
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['doctorSchedule', 'list'] })
        queryClient.invalidateQueries({ queryKey: ['doctorSchedule', 'detail', id] })
        navigate('/dashboard/registration/doctor-schedule')
      } else {
        alert(data?.message || 'Gagal mengupdate jadwal dokter')
      }
    },
    onError: (error: { message: string }) => {
      alert(error?.message || 'Terjadi kesalahan saat mengupdate jadwal dokter')
    }
  })

  const onFinish = (values: DoctorScheduleFormData) => {
    const formattedValues = { ...values }
    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']

    days.forEach((day) => {
      if (formattedValues[day]) {
        const dayData = formattedValues[day]
        formattedValues[day] = {
          enabled: dayData.enabled || false,
          startTime:
            dayData.startTime && dayjs.isDayjs(dayData.startTime)
              ? dayData.startTime.format('HH:mm')
              : dayData.startTime || '08:00',
          endTime:
            dayData.endTime && dayjs.isDayjs(dayData.endTime)
              ? dayData.endTime.format('HH:mm')
              : dayData.endTime || '16:00'
        }
      }
    })

    if (isEdit) {
      updateMutation.mutate({ ...formattedValues, id: Number(id) })
    } else {
      createMutation.mutate(formattedValues)
    }
  }

  const DayScheduleField = ({ name, label }: { name: string; label: string }) => {
    const enabled = Form.useWatch([name, 'enabled'], form)

    return (
      <div className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
        <div className="w-24 shrink-0">
          <Form.Item name={[name, 'enabled']} valuePropName="checked" className="mb-0">
            <Checkbox>
              <span className="font-medium text-gray-700">{label}</span>
            </Checkbox>
          </Form.Item>
        </div>
        <div className="flex items-center gap-3 flex-1">
          {enabled ? (
            <>
              <Form.Item
                name={[name, 'startTime']}
                className="mb-0"
                rules={[{ required: enabled, message: 'Waktu mulai harus diisi' }]}
              >
                <TimePicker format="HH:mm" placeholder="Mulai" className="w-32" />
              </Form.Item>
              <span className="text-gray-400 text-sm">s/d</span>
              <Form.Item
                name={[name, 'endTime']}
                className="mb-0"
                rules={[{ required: enabled, message: 'Waktu selesai harus diisi' }]}
              >
                <TimePicker format="HH:mm" placeholder="Selesai" className="w-32" />
              </Form.Item>
            </>
          ) : (
            <span className="text-gray-400 text-sm italic">— Libur / Tidak Praktek —</span>
          )}
        </div>
      </div>
    )
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header Card */}
      <Card bodyStyle={{ padding: '20px 24px' }} className="border-none">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => navigate('/dashboard/registration/doctor-schedule')}
                className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-sm"
              >
                <ArrowLeftOutlined />
                <span>Jadwal Praktek Dokter</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold mb-0">
              {isEdit ? 'Edit Jadwal Dokter' : 'Tambah Jadwal Dokter'}
            </h1>
            <p className="text-sm text-gray-400 m-0">
              {isEdit
                ? 'Perbarui data jadwal praktik dokter'
                : 'Isi formulir berikut untuk mendaftarkan jadwal praktik dokter baru'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tag
              color={isEdit ? 'blue' : 'green'}
              icon={isEdit ? <CalendarOutlined /> : <CheckCircleOutlined />}
              className="px-3 py-1 text-sm m-0"
            >
              {isEdit ? 'Mode Edit' : 'Jadwal Baru'}
            </Tag>
          </div>
        </div>
      </Card>

      {/* Form Content Card */}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          senin: defaultDaySchedule,
          selasa: defaultDaySchedule,
          rabu: defaultDaySchedule,
          kamis: defaultDaySchedule,
          jumat: defaultDaySchedule,
          sabtu: defaultDaySchedule,
          minggu: defaultDaySchedule,
          status: 'active'
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Info Dasar Card */}
          <Card
            bodyStyle={{ padding: '20px 24px' }}
            className="border-none"
            title="Informasi Dasar"
          >
            <Form.Item
              label={<span className="font-medium">Nama Dokter</span>}
              name="idPegawai"
              rules={[{ required: true, message: 'Nama dokter harus diisi' }]}
            >
              <Select
                placeholder="Pilih nama dokter"
                showSearch
                optionFilterProp="children"
                loading={!pegawaiData}
                size="large"
              >
                {pegawaiData?.success &&
                  pegawaiData.result?.map(
                    (pegawai: { email: string; id: number; namaLengkap: string }) => (
                      <Select.Option key={pegawai.id} value={pegawai.id}>
                        {pegawai.namaLengkap}
                      </Select.Option>
                    )
                  )}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Kategori</span>}
              name="kategori"
              rules={[{ required: true, message: 'Kategori harus diisi' }]}
            >
              <Select placeholder="Pilih kategori" size="large">
                <Select.Option value="Dokter Umum">Dokter Umum</Select.Option>
                <Select.Option value="Dokter Spesialis Anak">Dokter Spesialis Anak</Select.Option>
                <Select.Option value="Dokter Spesialis Kandungan">
                  Dokter Spesialis Kandungan
                </Select.Option>
                <Select.Option value="Dokter Spesialis Bedah">Dokter Spesialis Bedah</Select.Option>
                <Select.Option value="Dokter Spesialis Penyakit Dalam">
                  Dokter Spesialis Penyakit Dalam
                </Select.Option>
                <Select.Option value="Dokter Spesialis Mata">Dokter Spesialis Mata</Select.Option>
                <Select.Option value="Dokter Spesialis THT">Dokter Spesialis THT</Select.Option>
                <Select.Option value="Dokter Spesialis Kulit">Dokter Spesialis Kulit</Select.Option>
                <Select.Option value="Dokter Spesialis Jantung">
                  Dokter Spesialis Jantung
                </Select.Option>
                <Select.Option value="Dokter Spesialis Saraf">Dokter Spesialis Saraf</Select.Option>
                <Select.Option value="Dokter Gigi">Dokter Gigi</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Poli</span>}
              name="idPoli"
              rules={[{ required: true, message: 'Poli harus diisi' }]}
            >
              <Select
                placeholder="Pilih poli"
                showSearch
                optionFilterProp="children"
                loading={!poliData}
                size="large"
              >
                {poliData?.success &&
                  poliData.result?.map((poli: { id: number; name: string }) => (
                    <Select.Option key={poli.id} value={poli.id}>
                      {poli.name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Status</span>}
              name="status"
              rules={[{ required: true, message: 'Status harus dipilih' }]}
            >
              <Select placeholder="Pilih status" size="large">
                <Select.Option value="active">Aktif</Select.Option>
                <Select.Option value="inactive">Tidak Aktif</Select.Option>
              </Select>
            </Form.Item>
          </Card>

          {/* Jadwal Harian Card */}
          <Card
            bodyStyle={{ padding: '20px 24px' }}
            className="border-none"
            title="Jadwal Praktek Harian"
          >
            <div className="text-xs text-gray-400 mb-3 uppercase tracking-tight font-semibold">
              Centang hari yang aktif lalu tentukan jam mulai dan selesai
            </div>
            <Divider className="my-2" />
            <div>
              <DayScheduleField name="senin" label="Senin" />
              <DayScheduleField name="selasa" label="Selasa" />
              <DayScheduleField name="rabu" label="Rabu" />
              <DayScheduleField name="kamis" label="Kamis" />
              <DayScheduleField name="jumat" label="Jumat" />
              <DayScheduleField name="sabtu" label="Sabtu" />
              <DayScheduleField name="minggu" label="Minggu" />
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card bodyStyle={{ padding: '16px 24px' }} className="border-none mt-4">
          <div className="flex items-center justify-end gap-3">
            <Button
              size="large"
              onClick={() => navigate('/dashboard/registration/doctor-schedule')}
              icon={<ArrowLeftOutlined />}
            >
              Batal
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={isLoading}
              icon={<SaveOutlined />}
            >
              {isEdit ? 'Update Jadwal' : 'Simpan Jadwal'}
            </Button>
          </div>
        </Card>
      </Form>
    </div>
  )
}

export default DoctorScheduleForm
